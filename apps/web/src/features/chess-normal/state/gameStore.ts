import { create } from "zustand";
import type { GameStateDTO, MoveDTO, PieceColor } from "@chess/contracts";
import {
  applyMove,
  getGameState,
  getLegalMoveOptions,
  resetGame
} from "../adapters/wasmEngineAdapter";

export type MoveHistoryEntry = {
  ply: number;
  player: PieceColor;
  from: string;
  to: string;
  notation: string;
};

type LastMove = {
  from: string;
  to: string;
};

type PromotionPiece = NonNullable<MoveDTO["promotion"]>;

type PendingPromotion = {
  from: string;
  to: string;
  options: PromotionPiece[];
};

type GameStore = {
  gameState: GameStateDTO;
  selectedSquare: string | null;
  legalMoves: MoveDTO[];
  legalTargets: string[];
  pendingPromotion: PendingPromotion | null;
  moveHistory: MoveHistoryEntry[];
  lastMove: LastMove | null;
  errorMessage: string | null;
  initialize: () => Promise<void>;
  selectSquare: (square: string) => Promise<void>;
  choosePromotion: (promotion: PromotionPiece) => Promise<void>;
  cancelPromotion: () => void;
  reset: () => Promise<void>;
};

const emptyState: GameStateDTO = {
  board: {},
  activeColor: "white",
  status: { type: "in_progress" },
  halfmoveClock: 0,
  fullmoveNumber: 1,
  castlingRights: {
    whiteKingSide: true,
    whiteQueenSide: true,
    blackKingSide: true,
    blackQueenSide: true
  },
  enPassantTarget: null
};

function promotionSuffix(promotion?: PromotionPiece): string {
  if (!promotion) {
    return "";
  }

  if (promotion === "queen") {
    return "=Q";
  }
  if (promotion === "rook") {
    return "=R";
  }
  if (promotion === "bishop") {
    return "=B";
  }
  return "=N";
}

function formatMoveNotation(from: string, to: string, promotion?: PromotionPiece): string {
  return `${from}-${to}${promotionSuffix(promotion)}`;
}

function uniqueTargets(moves: MoveDTO[]): string[] {
  return [...new Set(moves.map((move) => move.to))];
}

function promotionOptions(moves: MoveDTO[]): PromotionPiece[] {
  const options = moves.flatMap((move) => (move.promotion ? [move.promotion] : []));
  return [...new Set(options)];
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: emptyState,
  selectedSquare: null,
  legalMoves: [],
  legalTargets: [],
  pendingPromotion: null,
  moveHistory: [],
  lastMove: null,
  errorMessage: null,
  initialize: async () => {
    const gameState = await getGameState();
    set({
      gameState,
      selectedSquare: null,
      legalMoves: [],
      legalTargets: [],
      pendingPromotion: null,
      moveHistory: [],
      lastMove: null,
      errorMessage: null
    });
  },
  selectSquare: async (square) => {
    const { selectedSquare, gameState, legalMoves, moveHistory, pendingPromotion } = get();

    if (pendingPromotion) {
      set({ errorMessage: "Choose a promotion piece to continue." });
      return;
    }

    const clickedPiece = gameState.board[square];

    if (!selectedSquare) {
      if (!clickedPiece) {
        set({ errorMessage: `Select a ${gameState.activeColor} piece to move.` });
        return;
      }

      if (clickedPiece.color !== gameState.activeColor) {
        set({ errorMessage: `It is ${gameState.activeColor}'s turn.` });
        return;
      }

      const nextLegalMoves = await getLegalMoveOptions(square);
      set({
        selectedSquare: square,
        legalMoves: nextLegalMoves,
        legalTargets: uniqueTargets(nextLegalMoves),
        errorMessage: null
      });
      return;
    }

    if (selectedSquare === square) {
      set({ selectedSquare: null, legalMoves: [], legalTargets: [], errorMessage: null });
      return;
    }

    if (clickedPiece && clickedPiece.color === gameState.activeColor) {
      const nextLegalMoves = await getLegalMoveOptions(square);
      set({
        selectedSquare: square,
        legalMoves: nextLegalMoves,
        legalTargets: uniqueTargets(nextLegalMoves),
        errorMessage: null
      });
      return;
    }

    const candidateMoves = legalMoves.filter((move) => move.to === square);
    if (candidateMoves.length === 0) {
      set({
        selectedSquare: null,
        legalMoves: [],
        legalTargets: [],
        errorMessage: `Illegal move target: ${square}`
      });
      return;
    }

    const promotionChoices = promotionOptions(candidateMoves);
    if (promotionChoices.length > 0) {
      set({
        selectedSquare: null,
        legalMoves: [],
        legalTargets: [],
        pendingPromotion: {
          from: selectedSquare,
          to: square,
          options: promotionChoices
        },
        errorMessage: null
      });
      return;
    }

    try {
      const player = gameState.activeColor;
      const nextState = await applyMove({ from: selectedSquare, to: square });
      const historyEntry: MoveHistoryEntry = {
        ply: moveHistory.length + 1,
        player,
        from: selectedSquare,
        to: square,
        notation: formatMoveNotation(selectedSquare, square)
      };

      set({
        gameState: nextState,
        selectedSquare: null,
        legalMoves: [],
        legalTargets: [],
        pendingPromotion: null,
        moveHistory: [...moveHistory, historyEntry],
        lastMove: { from: selectedSquare, to: square },
        errorMessage: null
      });
    } catch {
      set({
        selectedSquare: null,
        legalMoves: [],
        legalTargets: [],
        pendingPromotion: null,
        errorMessage: "Move rejected by engine."
      });
    }
  },
  choosePromotion: async (promotion) => {
    const { pendingPromotion, gameState, moveHistory } = get();
    if (!pendingPromotion) {
      return;
    }

    if (!pendingPromotion.options.includes(promotion)) {
      set({
        pendingPromotion: null,
        errorMessage: `Invalid promotion piece: ${promotion}`
      });
      return;
    }

    try {
      const player = gameState.activeColor;
      const nextState = await applyMove({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion
      });
      const historyEntry: MoveHistoryEntry = {
        ply: moveHistory.length + 1,
        player,
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        notation: formatMoveNotation(pendingPromotion.from, pendingPromotion.to, promotion)
      };

      set({
        gameState: nextState,
        selectedSquare: null,
        legalMoves: [],
        legalTargets: [],
        pendingPromotion: null,
        moveHistory: [...moveHistory, historyEntry],
        lastMove: { from: pendingPromotion.from, to: pendingPromotion.to },
        errorMessage: null
      });
    } catch {
      set({
        selectedSquare: null,
        legalMoves: [],
        legalTargets: [],
        pendingPromotion: null,
        errorMessage: "Move rejected by engine."
      });
    }
  },
  cancelPromotion: () => {
    set({
      pendingPromotion: null,
      selectedSquare: null,
      legalMoves: [],
      legalTargets: [],
      errorMessage: "Promotion cancelled."
    });
  },
  reset: async () => {
    await resetGame();
    const gameState = await getGameState();
    set({
      gameState,
      selectedSquare: null,
      legalMoves: [],
      legalTargets: [],
      pendingPromotion: null,
      moveHistory: [],
      lastMove: null,
      errorMessage: null
    });
  }
}));
