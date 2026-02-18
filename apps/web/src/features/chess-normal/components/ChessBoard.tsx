import { useEffect } from "react";
import { Piece } from "./Piece";
import { useGameStore } from "../state/gameStore";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

export function ChessBoard(): JSX.Element {
  const board = useGameStore((s) => s.gameState.board);
  const selected = useGameStore((s) => s.selectedSquare);
  const legalTargets = useGameStore((s) => s.legalTargets);
  const lastMove = useGameStore((s) => s.lastMove);
  const pendingPromotion = useGameStore((s) => s.pendingPromotion);
  const errorMessage = useGameStore((s) => s.errorMessage);
  const initialize = useGameStore((s) => s.initialize);
  const selectSquare = useGameStore((s) => s.selectSquare);
  const choosePromotion = useGameStore((s) => s.choosePromotion);
  const cancelPromotion = useGameStore((s) => s.cancelPromotion);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <section>
      <h2>Board</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 56px)",
          border: "2px solid #111",
          width: "fit-content"
        }}
      >
        {ranks.flatMap((rank) =>
          files.map((file, fileIndex) => {
            const square = `${file}${rank}`;
            const isDark = (fileIndex + rank) % 2 === 0;
            const piece = board[square];
            const isSelected = selected === square;
            const isLegalTarget = legalTargets.includes(square);
            const isLastMoveSquare = Boolean(
              lastMove && (lastMove.from === square || lastMove.to === square)
            );

            return (
              <button
                key={square}
                aria-label={`Square ${square}`}
                onClick={() => void selectSquare(square)}
                style={{
                  width: 56,
                  height: 56,
                  border: isSelected ? "2px solid #c62828" : "1px solid #222",
                  background: isSelected
                    ? "#ffcc80"
                    : isLegalTarget
                      ? "#ffd54f"
                      : isLastMoveSquare
                        ? "#90caf9"
                        : isDark
                          ? "#b58863"
                          : "#f0d9b5",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer"
                }}
              >
                {piece ? <Piece piece={piece} /> : null}
              </button>
            );
          })
        )}
      </div>
      {pendingPromotion ? (
        <section
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #222",
            background: "#fff8e1",
            maxWidth: 448
          }}
        >
          <p style={{ margin: 0, marginBottom: 8, fontWeight: 600 }}>
            Choose promotion for {pendingPromotion.from} to {pendingPromotion.to}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {pendingPromotion.options.map((option) => (
              <button key={option} onClick={() => void choosePromotion(option)}>
                Promote to {option}
              </button>
            ))}
            <button onClick={cancelPromotion}>Cancel</button>
          </div>
        </section>
      ) : null}
      {errorMessage ? (
        <p style={{ marginTop: 12, color: "#b71c1c", fontWeight: 600 }}>{errorMessage}</p>
      ) : null}
    </section>
  );
}
