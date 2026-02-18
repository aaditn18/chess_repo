import type { GameModeId, ModeDescriptor } from "@chess/contracts";
import { normalOfflineMode } from "./normal";

const registry: Record<GameModeId, ModeDescriptor> = {
  offline_local: normalOfflineMode,
  online_realtime: {
    id: "online_realtime",
    label: "Online Realtime",
    teamMode: "1v1",
    supportedVariants: ["normal", "antichess", "nd_chess"],
    enabledByDefault: false
  },
  bot_match: {
    id: "bot_match",
    label: "Bot Match",
    teamMode: "1v1",
    supportedVariants: ["normal"],
    enabledByDefault: false
  }
};

export function getModeRegistry(): Record<GameModeId, ModeDescriptor> {
  return registry;
}
