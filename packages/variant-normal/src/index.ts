import type { VariantId } from "@chess/contracts";

export type NormalVariantDefinition = {
  id: VariantId;
  label: string;
  description: string;
};

export const normalVariant: NormalVariantDefinition = {
  id: "normal",
  label: "Normal Chess",
  description: "Standard chess ruleset used by the MVP."
};
