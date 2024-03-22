import MessageUtil from "@/util/MessageUtil";
import { types, Instance } from "mobx-state-tree";
import modelsTemplate from "@/models";

export const ConfigStore = types
  .model("Config", {
    config: types.optional(types.frozen(), {}),
    settle: types.optional(types.boolean, false),
    defaultModel: types.optional(types.string, ""),
  })
  .actions((self) => ({
    updateSettle: (value: boolean) => {
      self.settle = value;
    },
    getDefaultModel: () => {
      return self.defaultModel;
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
      if (!data.models) {
        newConfig.models = {};
      }
      modelsTemplate.forEach((item) => {
        const currentModel: any = {
          ...item,
        };
        delete currentModel.name;
        if (!newConfig.models[item.name]) {
          newConfig.models[item.name] = {
            ...currentModel,
          };
        } else {
          newConfig.models[item.name] = {
            ...currentModel,
            ...newConfig.models[item.name],
          };
        }
        if (
          newConfig.models[item.name].provider !== "devchat" &&
          newConfig.models[item.name].provider !== "openai"
        ) {
          newConfig.models[item.name].provider = currentModel.provider;
        }
      });

      if (!newConfig.providers?.openai) {
        newConfig.providers.openai = {
          api_key: "",
          api_base: "",
        };
      }
      self.config = newConfig;
      console.log("newConfig: ", newConfig);
      self.settle = true;
      self.defaultModel = newConfig.default_model;
    },
    getModelList: () => {
      const modelsArray = modelsTemplate.map((item) => {
        return item.name;
      });
      return modelsArray;
    },
    setConfigValue: (key: string, value: any) => {
      if (key === "default_model") {
        self.defaultModel = value;
      }
      const newConfig = { ...self.config };
      newConfig[key] = value;
      self.config = newConfig;
      MessageUtil.sendMessage({
        command: "writeConfig",
        value: newConfig,
        key: "",
      });
    },
  }));

export type IConfigStore = Instance<typeof ConfigStore>;
