import { types, flow, Instance } from "mobx-state-tree";

const fetechConfig = async () => {};

export const ConfigStore = types
  .model("Config", {
    config: types.optional(types.frozen(), {}),
  })
  .actions((self) => ({
    getUserKey: () => {
      // key 可能有两个，一个是 devchat key,一个是 openai key
      if (self.config?.providers?.devchat?.api_key) {
        return self.config.providers.devchat.key;
      }
      if (self.config?.providers?.openai?.api_key) {
        return self.config.providers.openai.api_key;
      }
      return null;
    },
    setConfig: (data) => {
      self.config = data;
    },
    getModels: () => {
      const modelsArray = self.config.models.keys();
      console.log("modelsArray: ", modelsArray);
    },
  }));

export type IConfigStore = Instance<typeof ConfigStore>;
