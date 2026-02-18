import type { ModeDescriptor } from "@chess/contracts";

export const normalOfflineMode: ModeDescriptor = {
  id: "offline_local",
  label: "Offline Local",
  teamMode: "1v1",
  supportedVariants: ["normal"],
  enabledByDefault: true
};
