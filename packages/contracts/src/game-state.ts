import type { PieceColor, PieceKind } from "./variants";

export type PieceDTO = {
  color: PieceColor;
  kind: PieceKind;
};

export type BoardMapDTO = Record<string, PieceDTO | undefined>;

export type MoveDTO = {
  from: string;
  to: string;
  promotion?: PieceKind;
};

export type GameStatusDTO =
  | { type: "in_progress" }
  | { type: "checkmate"; winner: PieceColor }
  | { type: "stalemate"; sideToMove: PieceColor };

export type CastlingRightsDTO = {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
};

export type GameStateDTO = {
  board: BoardMapDTO;
  activeColor: PieceColor;
  status: GameStatusDTO;
  halfmoveClock: number;
  fullmoveNumber: number;
  castlingRights: CastlingRightsDTO;
  enPassantTarget: string | null;
};
