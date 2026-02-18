import type { BotAdapter, GameStateDTO, MoveDTO } from "@chess/contracts";

export interface BotModel extends BotAdapter {
  provider: "local" | "remote";
  warmup?(): Promise<void>;
}

export type BotEvaluation = {
  move: MoveDTO | null;
  confidence: number;
  notes?: string;
};

export type BotEvaluator = (state: GameStateDTO) => Promise<BotEvaluation>;
