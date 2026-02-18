import type { GameStateDTO, MoveDTO, PieceColor } from "@chess/contracts";

export type WasmMoveDTO = MoveDTO;

export interface WasmGameLike {
  legalMoves(square: string): WasmMoveDTO[];
  applyMove(from: string, to: string, promotion?: MoveDTO["promotion"]): GameStateDTO;
  state(): GameStateDTO;
}

type RawPieceColor = "White" | "Black";
type RawPieceKind = "Pawn" | "Knight" | "Bishop" | "Rook" | "Queen" | "King";

type RawPiece = {
  color: RawPieceColor;
  kind: RawPieceKind;
};

type RawSquare = {
  file: number;
  rank: number;
};

type RawWasmMove = {
  from: string;
  to: string;
  promotion?: string | null;
};

interface RawWasmGame {
  legalMoves(square: string): unknown;
  applyMove(from: string, to: string, promotion?: string): unknown;
  state(): unknown;
}

interface WasmModule {
  default: (options?: { module_or_path?: unknown } | unknown) => Promise<unknown>;
  WasmGame: new () => RawWasmGame;
}

const FILES = "abcdefgh";
const dynamicImport = new Function(
  "specifier",
  "return import(specifier)"
) as (specifier: string) => Promise<unknown>;

function createInitialBoard(): GameStateDTO["board"] {
  return {
    a1: { color: "white", kind: "rook" },
    b1: { color: "white", kind: "knight" },
    c1: { color: "white", kind: "bishop" },
    d1: { color: "white", kind: "queen" },
    e1: { color: "white", kind: "king" },
    f1: { color: "white", kind: "bishop" },
    g1: { color: "white", kind: "knight" },
    h1: { color: "white", kind: "rook" },
    a2: { color: "white", kind: "pawn" },
    b2: { color: "white", kind: "pawn" },
    c2: { color: "white", kind: "pawn" },
    d2: { color: "white", kind: "pawn" },
    e2: { color: "white", kind: "pawn" },
    f2: { color: "white", kind: "pawn" },
    g2: { color: "white", kind: "pawn" },
    h2: { color: "white", kind: "pawn" },
    a7: { color: "black", kind: "pawn" },
    b7: { color: "black", kind: "pawn" },
    c7: { color: "black", kind: "pawn" },
    d7: { color: "black", kind: "pawn" },
    e7: { color: "black", kind: "pawn" },
    f7: { color: "black", kind: "pawn" },
    g7: { color: "black", kind: "pawn" },
    h7: { color: "black", kind: "pawn" },
    a8: { color: "black", kind: "rook" },
    b8: { color: "black", kind: "knight" },
    c8: { color: "black", kind: "bishop" },
    d8: { color: "black", kind: "queen" },
    e8: { color: "black", kind: "king" },
    f8: { color: "black", kind: "bishop" },
    g8: { color: "black", kind: "knight" },
    h8: { color: "black", kind: "rook" }
  };
}

function nextColor(color: PieceColor): PieceColor {
  return color === "white" ? "black" : "white";
}

function toAlgebraicSquare(square: RawSquare): string | null {
  if (
    typeof square.file !== "number" ||
    typeof square.rank !== "number" ||
    square.file < 0 ||
    square.file > 7 ||
    square.rank < 0 ||
    square.rank > 7
  ) {
    return null;
  }

  return `${FILES[square.file]}${square.rank + 1}`;
}

function toPieceColor(input: unknown): PieceColor {
  if (input === "white" || input === "White") {
    return "white";
  }
  return "black";
}

function toPieceKind(input: unknown): MoveDTO["promotion"] {
  if (input === "queen" || input === "Queen" || input === "q" || input === "Q") {
    return "queen";
  }
  if (input === "rook" || input === "Rook" || input === "r" || input === "R") {
    return "rook";
  }
  if (input === "bishop" || input === "Bishop" || input === "b" || input === "B") {
    return "bishop";
  }
  if (input === "knight" || input === "Knight" || input === "n" || input === "N") {
    return "knight";
  }
  return undefined;
}

function toWasmPromotion(promotion?: MoveDTO["promotion"]): string | undefined {
  if (!promotion) {
    return undefined;
  }

  if (promotion === "queen") {
    return "q";
  }
  if (promotion === "rook") {
    return "r";
  }
  if (promotion === "bishop") {
    return "b";
  }
  return "n";
}

function toBoardMap(rawBoard: unknown): GameStateDTO["board"] {
  if (!Array.isArray(rawBoard)) {
    return {};
  }

  const board: GameStateDTO["board"] = {};
  for (let rank = 0; rank < rawBoard.length; rank += 1) {
    const row = rawBoard[rank];
    if (!Array.isArray(row)) {
      continue;
    }

    for (let file = 0; file < row.length; file += 1) {
      const maybePiece = row[file];
      if (!maybePiece || typeof maybePiece !== "object") {
        continue;
      }

      const piece = maybePiece as RawPiece;
      const square = `${FILES[file]}${rank + 1}`;
      board[square] = {
        color: toPieceColor(piece.color),
        kind: String(piece.kind).toLowerCase() as NonNullable<GameStateDTO["board"][string]>["kind"]
      };
    }
  }

  return board;
}

function toGameStatus(rawStatus: unknown): GameStateDTO["status"] {
  if (rawStatus === "in_progress") {
    return { type: "in_progress" };
  }

  if (typeof rawStatus === "string") {
    if (rawStatus === "InProgress") {
      return { type: "in_progress" };
    }
    return { type: "in_progress" };
  }

  if (!rawStatus || typeof rawStatus !== "object") {
    return { type: "in_progress" };
  }

  const statusRecord = rawStatus as Record<string, unknown>;
  if (statusRecord.type === "checkmate") {
    return { type: "checkmate", winner: toPieceColor(statusRecord.winner) };
  }
  if (statusRecord.type === "stalemate") {
    return {
      type: "stalemate",
      sideToMove: toPieceColor(statusRecord.sideToMove)
    };
  }
  if ("Checkmate" in statusRecord) {
    return { type: "checkmate", winner: toPieceColor(statusRecord.Checkmate) };
  }
  if ("Stalemate" in statusRecord) {
    return { type: "stalemate", sideToMove: toPieceColor(statusRecord.Stalemate) };
  }

  return { type: "in_progress" };
}

function toCastlingRights(raw: unknown): GameStateDTO["castlingRights"] {
  const fallback: GameStateDTO["castlingRights"] = {
    whiteKingSide: true,
    whiteQueenSide: true,
    blackKingSide: true,
    blackQueenSide: true
  };

  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const candidate = raw as Record<string, unknown>;

  if ("whiteKingSide" in candidate) {
    return {
      whiteKingSide: Boolean(candidate.whiteKingSide),
      whiteQueenSide: Boolean(candidate.whiteQueenSide),
      blackKingSide: Boolean(candidate.blackKingSide),
      blackQueenSide: Boolean(candidate.blackQueenSide)
    };
  }

  return {
    whiteKingSide: Boolean(candidate.white_king_side),
    whiteQueenSide: Boolean(candidate.white_queen_side),
    blackKingSide: Boolean(candidate.black_king_side),
    blackQueenSide: Boolean(candidate.black_queen_side)
  };
}

function toGameStateDTO(rawState: unknown): GameStateDTO {
  if (!rawState || typeof rawState !== "object") {
    return {
      board: createInitialBoard(),
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
  }

  const stateRecord = rawState as Record<string, unknown>;
  const enPassantRaw = stateRecord.enPassantTarget ?? stateRecord.en_passant_target;
  const enPassantTarget =
    typeof enPassantRaw === "string"
      ? enPassantRaw
      : enPassantRaw && typeof enPassantRaw === "object"
        ? toAlgebraicSquare(enPassantRaw as RawSquare)
        : null;

  return {
    board: toBoardMap(stateRecord.board),
    activeColor: toPieceColor(stateRecord.activeColor ?? stateRecord.active_color),
    status: toGameStatus(stateRecord.status),
    halfmoveClock: Number(stateRecord.halfmoveClock ?? stateRecord.halfmove_clock ?? 0),
    fullmoveNumber: Number(stateRecord.fullmoveNumber ?? stateRecord.fullmove_number ?? 1),
    castlingRights: toCastlingRights(stateRecord.castlingRights ?? stateRecord.castling_rights),
    enPassantTarget
  };
}

function toMoveList(rawMoves: unknown): WasmMoveDTO[] {
  if (!Array.isArray(rawMoves)) {
    return [];
  }

  return rawMoves.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const move = entry as RawWasmMove;
    if (typeof move.from !== "string" || typeof move.to !== "string") {
      return [];
    }

    const promotion = toPieceKind(move.promotion ?? undefined);
    if (promotion) {
      return [{ from: move.from, to: move.to, promotion }];
    }

    return [{ from: move.from, to: move.to }];
  });
}

class WasmBoundGame implements WasmGameLike {
  constructor(private readonly game: RawWasmGame) {}

  legalMoves(square: string): WasmMoveDTO[] {
    return toMoveList(this.game.legalMoves(square));
  }

  applyMove(from: string, to: string, promotion?: MoveDTO["promotion"]): GameStateDTO {
    const rawState = this.game.applyMove(from, to, toWasmPromotion(promotion));
    return toGameStateDTO(rawState);
  }

  state(): GameStateDTO {
    return toGameStateDTO(this.game.state());
  }
}

function isNodeRuntime(): boolean {
  const runtime = globalThis as unknown as {
    process?: { versions?: { node?: string } };
  };
  return typeof runtime.process?.versions?.node === "string";
}

async function initializeWasmModule(wasmModule: WasmModule, modulePath: string): Promise<void> {
  if (isNodeRuntime()) {
    const wasmBinaryUrl = new URL("chess_core_wasm_bg.wasm", modulePath);
    const fsModule = (await dynamicImport("node:fs/promises")) as {
      readFile: (path: URL | string) => Promise<Uint8Array>;
    };
    const wasmBytes = await fsModule.readFile(wasmBinaryUrl);
    await wasmModule.default({ module_or_path: wasmBytes });
    return;
  }

  await wasmModule.default();
}

async function loadWasmGame(): Promise<WasmGameLike | null> {
  const relativeModuleCandidates = [
    ["..", "pkg", "chess_core_wasm.js"].join("/"),
    ["..", "..", "..", "pkg", "chess_core_wasm.js"].join("/")
  ];

  for (const relativePath of relativeModuleCandidates) {
    const modulePath = new URL(relativePath, import.meta.url).toString();

    try {
      const wasmModule = (await import(/* @vite-ignore */ modulePath)) as Partial<WasmModule>;
      if (typeof wasmModule.default !== "function" || typeof wasmModule.WasmGame !== "function") {
        continue;
      }

      await initializeWasmModule(wasmModule as WasmModule, modulePath);
      return new WasmBoundGame(new wasmModule.WasmGame());
    } catch {
      // Try the next candidate path.
    }
  }

  return null;
}

class FallbackWasmGame implements WasmGameLike {
  private gameState: GameStateDTO = {
    board: createInitialBoard(),
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

  legalMoves(square: string): WasmMoveDTO[] {
    const piece = this.gameState.board[square];
    if (!piece || piece.color !== this.gameState.activeColor) {
      return [];
    }

    const files = "abcdefgh";
    const file = files.indexOf(square[0]);
    const rank = Number(square[1]) - 1;

    if (file < 0 || Number.isNaN(rank) || rank < 0 || rank > 7) {
      return [];
    }

    const candidates: Array<[number, number]> = [
      [file - 1, rank],
      [file + 1, rank],
      [file, rank - 1],
      [file, rank + 1]
    ];

    return candidates
      .filter(([f, r]) => f >= 0 && f < 8 && r >= 0 && r < 8)
      .map(([f, r]) => `${files[f]}${r + 1}`)
      .filter((to) => {
        const target = this.gameState.board[to];
        return !target || target.color !== piece.color;
      })
      .map((to) => ({ from: square, to }));
  }

  applyMove(from: string, to: string, promotion?: MoveDTO["promotion"]): GameStateDTO {
    const legal = this.legalMoves(from).some((m) => m.to === to);
    if (!legal) {
      return this.gameState;
    }

    const piece = this.gameState.board[from];
    if (!piece) {
      return this.gameState;
    }

    const board = { ...this.gameState.board };
    delete board[from];
    board[to] = {
      ...piece,
      kind: promotion ?? piece.kind
    };

    const next = nextColor(this.gameState.activeColor);

    this.gameState = {
      ...this.gameState,
      board,
      activeColor: next,
      halfmoveClock: this.gameState.halfmoveClock + 1,
      fullmoveNumber:
        next === "white" ? this.gameState.fullmoveNumber + 1 : this.gameState.fullmoveNumber,
      enPassantTarget: null
    };

    return this.gameState;
  }

  state(): GameStateDTO {
    return this.gameState;
  }
}

export async function createWasmGame(): Promise<WasmGameLike> {
  const wasmGame = await loadWasmGame();
  if (wasmGame) {
    return wasmGame;
  }

  return new FallbackWasmGame();
}
