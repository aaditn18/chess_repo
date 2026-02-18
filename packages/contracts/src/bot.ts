import type { GameStateDTO, MoveDTO } from "./game-state";

export type BotAdapter = {
  id: string;
  displayName: string;
  chooseMove(state: GameStateDTO): Promise<MoveDTO | null>;
};
