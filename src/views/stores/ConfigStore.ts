import MessageUtil from "@/util/MessageUtil";
import { types, Instance } from "mobx-state-tree";
import modelsTemplate from "@/models";

export const ConfigStore = types
  .model("Config", {
    config: types.optional(types.frozen(), {}),
    settle: types.optional(types.boolean, false),
  })
  .actions((self) => ({
    updateSettle: (value: boolean) => {
      self.settle = value;
    },
    getDefaultModel: () => {
      return self.config?.default_model;
    },
    getLanguage: () => {
      return self.config?.language;
    },
    getUserKey: () => {
      // key 可能有两个，一个是 devchat key,一个是 openai key
      if (self.config?.providers?.devchat?.api_key) {
        return self.config.providers.devchat.api_key;
      }
      if (self.config?.providers?.openai?.api_key) {
        return self.config.providers.openai.api_key;
      }
      return "";
    },
    getAPIBase: () => {
      if (self.config?.providers?.devchat?.api_base) {
        return self.config.providers.devchat.api_base;
      }
      if (self.config?.providers?.openai?.api_base) {
        return self.config.providers.openai.api_base;
      }
      return "";
    },
    setConfig: (data) => {
      self.settle = false;
      const newConfig = { ...data };
      modelsTemplate.forEach((item) => {
        if (!newConfig.models[item.name]) {
          newConfig[item.name] = {
            ...item,
          };
        } else {
          newConfig.models[item.name] = {
            ...item,
            ...newConfig[item.name],
          };
        }
      });
      if (!newConfig.providers?.openai) {
        newConfig.providers.openai = {
          api_key: "",
          api_base: "",
        };
      }
      self.config = newConfig;
      self.settle = true;
    },
    getModelList: () => {
      const modelsArray = modelsTemplate.map((item) => {
        return item.name;
      });
      return modelsArray;
    },
    setConfigValue: (key: string, value: any) => {
      self.config[key] = value;
      MessageUtil.sendMessage({});
    },
  }));

export type IConfigStore = Instance<typeof ConfigStore>;
