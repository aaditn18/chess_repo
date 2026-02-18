import type { GameStatusDTO } from "@chess/contracts";
import { useGameStore } from "../state/gameStore";

function statusLabel(status: GameStatusDTO): string {
  if (status.type === "in_progress") {
    return "In progress";
  }

  if (status.type === "checkmate") {
    return `Checkmate - ${status.winner} wins`;
  }

  return `Stalemate (${status.sideToMove} to move)`;
}

export function GameControls(): JSX.Element {
  const gameState = useGameStore((s) => s.gameState);
  const moveHistory = useGameStore((s) => s.moveHistory);
  const reset = useGameStore((s) => s.reset);

  const castling = gameState.castlingRights;

  return (
    <section style={{ marginTop: 16 }}>
      <h2>Game</h2>
      <p>
        <strong>Turn:</strong> {gameState.activeColor}
      </p>
      <p>
        <strong>Status:</strong> {statusLabel(gameState.status)}
      </p>
      <p>
        <strong>Halfmove Clock:</strong> {gameState.halfmoveClock}
      </p>
      <p>
        <strong>Fullmove Number:</strong> {gameState.fullmoveNumber}
      </p>
      <p>
        <strong>En Passant Target:</strong> {gameState.enPassantTarget ?? "none"}
      </p>
      <p>
        <strong>Castling Rights:</strong>{" "}
        {castling.whiteKingSide ? "K" : "-"}
        {castling.whiteQueenSide ? "Q" : "-"}
        {castling.blackKingSide ? "k" : "-"}
        {castling.blackQueenSide ? "q" : "-"}
      </p>

      <button onClick={() => void reset()}>Reset Game</button>

      <section style={{ marginTop: 20 }}>
        <h3>Move History</h3>
        {moveHistory.length === 0 ? (
          <p>No moves yet.</p>
        ) : (
          <ol>
            {moveHistory.map((entry) => (
              <li key={entry.ply}>
                {entry.player}: {entry.notation}
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}
