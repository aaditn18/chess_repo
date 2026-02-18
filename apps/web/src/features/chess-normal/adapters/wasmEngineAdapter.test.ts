import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GameStateDTO } from "@chess/contracts";
import type { WasmGameLike } from "@chess/engine-wasm";

const { createWasmGameMock } = vi.hoisted(() => ({
  createWasmGameMock: vi.fn()
}));

vi.mock("@chess/engine-wasm", () => ({
  createWasmGame: createWasmGameMock
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

function createMockGame(overrides?: Partial<WasmGameLike>): WasmGameLike {
  return {
    legalMoves: vi.fn().mockReturnValue([]),
    applyMove: vi.fn().mockReturnValue(createState("black")),
    state: vi.fn().mockReturnValue(createState("white")),
    ...overrides
  };
}

describe("wasmEngineAdapter", () => {
  beforeEach(() => {
    vi.resetModules();
    createWasmGameMock.mockReset();
  });

  it("maps legal moves from the engine", async () => {
    const mockGame = createMockGame({
      legalMoves: vi.fn().mockReturnValue([
        { from: "e2", to: "e3" },
        { from: "e2", to: "e4" }
      ])
    });
    createWasmGameMock.mockResolvedValue(mockGame);

    const adapter = await import("./wasmEngineAdapter");
    await expect(adapter.getLegalMoves("e2")).resolves.toEqual(["e3", "e4"]);
  });

  it("deduplicates legal target squares when promotion options share the same target", async () => {
    const mockGame = createMockGame({
      legalMoves: vi.fn().mockReturnValue([
        { from: "a7", to: "a8", promotion: "queen" },
        { from: "a7", to: "a8", promotion: "rook" }
      ])
    });
    createWasmGameMock.mockResolvedValue(mockGame);

    const adapter = await import("./wasmEngineAdapter");
    await expect(adapter.getLegalMoves("a7")).resolves.toEqual(["a8"]);
    await expect(adapter.getLegalMoveOptions("a7")).resolves.toEqual([
      { from: "a7", to: "a8", promotion: "queen" },
      { from: "a7", to: "a8", promotion: "rook" }
    ]);
  });

  it("rejects illegal moves before calling applyMove", async () => {
    const applyMove = vi.fn().mockReturnValue(createState("black"));
    const mockGame = createMockGame({
      legalMoves: vi.fn().mockReturnValue([{ from: "e2", to: "e3" }]),
      applyMove
    });
    createWasmGameMock.mockResolvedValue(mockGame);

    const adapter = await import("./wasmEngineAdapter");
    await expect(adapter.applyMove({ from: "e2", to: "e4" })).rejects.toThrow(
      "Illegal move: e2 -> e4"
    );
    expect(applyMove).not.toHaveBeenCalled();
  });

  it("enforces promotion-piece legality when choosing a candidate move", async () => {
    const mockGame = createMockGame({
      legalMoves: vi.fn().mockReturnValue([{ from: "a7", to: "a8", promotion: "queen" }])
    });
    createWasmGameMock.mockResolvedValue(mockGame);

    const adapter = await import("./wasmEngineAdapter");
    await expect(
      adapter.applyMove({ from: "a7", to: "a8", promotion: "rook" })
    ).rejects.toThrow("Illegal move: a7 -> a8");
  });

  it("resets engine instance when resetGame is called", async () => {
    const gameA = createMockGame({
      state: vi.fn().mockReturnValue(createState("white"))
    });
    const gameB = createMockGame({
      state: vi.fn().mockReturnValue(createState("black"))
    });

    createWasmGameMock.mockResolvedValueOnce(gameA).mockResolvedValueOnce(gameB);

    const adapter = await import("./wasmEngineAdapter");
    await expect(adapter.getGameState()).resolves.toMatchObject({ activeColor: "white" });

    await adapter.resetGame();

    await expect(adapter.getGameState()).resolves.toMatchObject({ activeColor: "black" });
    expect(createWasmGameMock).toHaveBeenCalledTimes(2);
  });
});
