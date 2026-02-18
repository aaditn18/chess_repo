import type { TeamMode, VariantId } from "./variants";

export type GameModeId = "offline_local" | "online_realtime" | "bot_match";

export type ModeDescriptor = {
  id: GameModeId;
  label: string;
  teamMode: TeamMode;
  supportedVariants: VariantId[];
  enabledByDefault: boolean;
};
