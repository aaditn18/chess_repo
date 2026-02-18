import { ChessBoard } from "../features/chess-normal/components/ChessBoard";
import { GameControls } from "../features/chess-normal/components/GameControls";

export function AppRoutes(): JSX.Element {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24, fontFamily: "ui-sans-serif" }}>
      <h1>Chess Platform</h1>
      <p>Normal chess MVP: offline local 1v1.</p>

      <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
        <ChessBoard />
        <aside style={{ minWidth: 280, flex: "1 1 320px" }}>
          <GameControls />
        </aside>
      </div>
    </main>
  );
}
