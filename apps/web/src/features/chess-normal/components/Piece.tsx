import type { PieceDTO } from "@chess/contracts";

const glyphByPiece: Record<string, string> = {
  "white-pawn": "♙",
  "white-knight": "♘",
  "white-bishop": "♗",
  "white-rook": "♖",
  "white-queen": "♕",
  "white-king": "♔",
  "black-pawn": "♟",
  "black-knight": "♞",
  "black-bishop": "♝",
  "black-rook": "♜",
  "black-queen": "♛",
  "black-king": "♚"
};

type Props = {
  piece: PieceDTO;
};

export function Piece({ piece }: Props): JSX.Element {
  const key = `${piece.color}-${piece.kind}`;
  return <span style={{ fontSize: 24 }}>{glyphByPiece[key] ?? "?"}</span>;
}
