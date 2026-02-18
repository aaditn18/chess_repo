import type { GameStateDTO, MoveDTO } from "@chess/contracts";
import { createWasmGame, type WasmGameLike } from "@chess/engine-wasm";

let gamePromise: Promise<WasmGameLike> | null = null;

async function getGame(): Promise<WasmGameLike> {
  if (!gamePromise) {
    gamePromise = createWasmGame();
  }
  return gamePromise;
}

function isCandidateMoveLegal(candidate: MoveDTO, requested: MoveDTO): boolean {
  if (candidate.to !== requested.to) {
    return false;
  }

  if (!requested.promotion) {
    return true;
  }

  return candidate.promotion === requested.promotion;
}

export async function getGameState(): Promise<GameStateDTO> {
  const game = await getGame();
  return game.state();
}

export async function getLegalMoveOptions(square: string): Promise<MoveDTO[]> {
  const game = await getGame();
  return game.legalMoves(square);
}

export async function getLegalMoves(square: string): Promise<string[]> {
  const moves = await getLegalMoveOptions(square);
  return [...new Set(moves.map((m) => m.to))];
}

export async function applyMove(move: MoveDTO): Promise<GameStateDTO> {
  const game = await getGame();
  const legal = (await getLegalMoveOptions(move.from)).some((candidateMove) =>
    isCandidateMoveLegal(candidateMove, move)
  );

  if (!legal) {
    throw new Error(`Illegal move: ${move.from} -> ${move.to}`);
  }

  return game.applyMove(move.from, move.to, move.promotion);
}

export async function resetGame(): Promise<void> {
  gamePromise = createWasmGame();
}
