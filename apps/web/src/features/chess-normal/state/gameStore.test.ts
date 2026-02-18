import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GameStateDTO } from "@chess/contracts";

const { getGameStateMock, getLegalMoveOptionsMock, applyMoveMock, resetGameMock } = vi.hoisted(() => ({
  getGameStateMock: vi.fn(),
  getLegalMoveOptionsMock: vi.fn(),
  applyMoveMock: vi.fn(),
  resetGameMock: vi.fn()
}));

vi.mock("../adapters/wasmEngineAdapter", () => ({
  getGameState: getGameStateMock,
  getLegalMoveOptions: getLegalMoveOptionsMock,
  applyMove: applyMoveMock,
  resetGame: resetGameMock
}));

function createState(activeColor: GameStateDTO["activeColor"]): GameStateDTO {
  return {
    board: {
      e2: { color: "white", kind: "pawn" },
      e7: { color: "black", kind: "pawn" }
    },
    activeColor,
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

describe("gameStore", () => {
  beforeEach(() => {
    vi.resetModules();
    getGameStateMock.mockReset();
    getLegalMoveOptionsMock.mockReset();
    applyMoveMock.mockReset();
    resetGameMock.mockReset();
  });

  it("initializes from adapter state and clears transient UI state", async () => {
    getGameStateMock.mockResolvedValue(createState("white"));
    const { useGameStore } = await import("./gameStore");

    await useGameStore.getState().initialize();
    const state = useGameStore.getState();

    expect(state.gameState.activeColor).toBe("white");
    expect(state.selectedSquare).toBeNull();
    expect(state.legalMoves).toEqual([]);
    expect(state.legalTargets).toEqual([]);
    expect(state.pendingPromotion).toBeNull();
    expect(state.moveHistory).toEqual([]);
    expect(state.errorMessage).toBeNull();
  });

  it("shows an error when selecting an empty square with no active selection", async () => {
    getGameStateMock.mockResolvedValue(createState("white"));
    const { useGameStore } = await import("./gameStore");

    await useGameStore.getState().initialize();
    await useGameStore.getState().selectSquare("e4");

    expect(useGameStore.getState().errorMessage).toBe("Select a white piece to move.");
    expect(getLegalMoveOptionsMock).not.toHaveBeenCalled();
  });

  it("records move history and last move for a successful move", async () => {
    getGameStateMock.mockResolvedValue(createState("white"));
    getLegalMoveOptionsMock.mockResolvedValue([{ from: "e2", to: "e4" }]);
    applyMoveMock.mockResolvedValue(createState("black"));

    const { useGameStore } = await import("./gameStore");

    await useGameStore.getState().initialize();
    await useGameStore.getState().selectSquare("e2");
    await useGameStore.getState().selectSquare("e4");

    const state = useGameStore.getState();
    expect(applyMoveMock).toHaveBeenCalledWith({ from: "e2", to: "e4" });
    expect(state.gameState.activeColor).toBe("black");
    expect(state.lastMove).toEqual({ from: "e2", to: "e4" });
    expect(state.moveHistory).toMatchObject([
      {
        ply: 1,
        player: "white",
        from: "e2",
        to: "e4",
        notation: "e2-e4"
      }
    ]);
  });

  it("rejects illegal targets and clears selection", async () => {
    getGameStateMock.mockResolvedValue(createState("white"));
    getLegalMoveOptionsMock.mockResolvedValue([{ from: "e2", to: "e4" }]);

    const { useGameStore } = await import("./gameStore");

    await useGameStore.getState().initialize();
    await useGameStore.getState().selectSquare("e2");
    await useGameStore.getState().selectSquare("e5");

    const state = useGameStore.getState();
    expect(state.selectedSquare).toBeNull();
    expect(state.legalMoves).toEqual([]);
    expect(state.legalTargets).toEqual([]);
    expect(state.errorMessage).toBe("Illegal move target: e5");
  });

  it("requires promotion choice when multiple promotion moves share a target", async () => {
    getGameStateMock.mockResolvedValue({
      ...createState("white"),
      board: {
        a7: { color: "white", kind: "pawn" },
        e8: { color: "black", kind: "king" },
        e1: { color: "white", kind: "king" }
      }
    });
    getLegalMoveOptionsMock.mockResolvedValue([
      { from: "a7", to: "a8", promotion: "queen" },
      { from: "a7", to: "a8", promotion: "rook" },
      { from: "a7", to: "a8", promotion: "bishop" },
      { from: "a7", to: "a8", promotion: "knight" }
    ]);
    applyMoveMock.mockResolvedValue(createState("black"));

    const { useGameStore } = await import("./gameStore");

    await useGameStore.getState().initialize();
    await useGameStore.getState().selectSquare("a7");
    await useGameStore.getState().selectSquare("a8");

    const pending = useGameStore.getState().pendingPromotion;
    expect(pending).toMatchObject({ from: "a7", to: "a8" });
    expect(pending?.options).toEqual(["queen", "rook", "bishop", "knight"]);
    expect(applyMoveMock).not.toHaveBeenCalled();

    await useGameStore.getState().choosePromotion("rook");

    const state = useGameStore.getState();
    expect(applyMoveMock).toHaveBeenCalledWith({ from: "a7", to: "a8", promotion: "rook" });
    expect(state.pendingPromotion).toBeNull();
    expect(state.lastMove).toEqual({ from: "a7", to: "a8" });
    expect(state.moveHistory.at(-1)?.notation).toBe("a7-a8=R");
  });

  it("resets game and clears move metadata", async () => {
    getGameStateMock.mockResolvedValueOnce(createState("white")).mockResolvedValueOnce(createState("white"));
    getLegalMoveOptionsMock.mockResolvedValue([{ from: "e2", to: "e4" }]);
    applyMoveMock.mockResolvedValue(createState("black"));
    resetGameMock.mockResolvedValue(undefined);

    const { useGameStore } = await import("./gameStore");

    await useGameStore.getState().initialize();
    await useGameStore.getState().selectSquare("e2");
    await useGameStore.getState().selectSquare("e4");
    await useGameStore.getState().reset();

    const state = useGameStore.getState();
    expect(resetGameMock).toHaveBeenCalledTimes(1);
    expect(state.moveHistory).toEqual([]);
    expect(state.lastMove).toBeNull();
    expect(state.pendingPromotion).toBeNull();
    expect(state.errorMessage).toBeNull();
    expect(state.gameState.activeColor).toBe("white");
  });
});
