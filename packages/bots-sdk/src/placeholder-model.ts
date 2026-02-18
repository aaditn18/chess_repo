import type { BotModel } from "./interface";

export const placeholderModel: BotModel = {
  id: "placeholder-bot",
  displayName: "Placeholder Bot",
  provider: "local",
  async chooseMove() {
    return null;
  }
};
