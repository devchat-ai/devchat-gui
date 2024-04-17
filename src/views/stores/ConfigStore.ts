import MessageUtil from "@/util/MessageUtil";
import { types, Instance } from "mobx-state-tree";
import modelsTemplate from "@/models";
import cloneDeep from "lodash.clonedeep";
import { set } from "mobx";

const defaultAPIBase = [
  "https://api.devchat.ai/v1",
  "https://api.devchat-ai.cn/v1",
];

export const ConfigStore = types
  .model("Config", {
    config: types.optional(types.frozen(), {}),
    modelsTemplate: types.optional(types.frozen(), {}),
    settle: types.optional(types.boolean, false),
    defaultModel: types.optional(types.string, ""),
  })
  .actions((self) => ({
    setTemplate: (value: any, provider: string) => {
      const models = value
        .filter((item) => !item.category || item.category === "chat")
        .map((item) => {
          return {
            name: item.model ?? item.id,
            max_input_tokens: item.max_input_tokens ?? 6000,
            provider: provider,
            stream: true,
          };
        });
      self.modelsTemplate = models;
    },
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
        if (
          self.config.providers.devchat.api_base === "custom" &&
          self.config.providers.devchat.cumstom_api_base
        ) {
          return self.config.providers.devchat.cumstom_api_base;
        }
        return self.config.providers.devchat.api_base;
      }
      if (self.config?.providers?.openai?.api_base) {
        return self.config.providers.openai.api_base;
      }
      return "";
    },
    setConfig: function (data) {
      this.updateSettle(false);
      let needUpdate = false;
      const newConfig = { ...data };
      if (!data.models) {
        newConfig.models = {};
      }
      if (!newConfig.providers?.openai) {
        newConfig.providers.openai = {
          api_key: "",
          api_base: "",
        };
      }
      if (!newConfig.providers?.devchat) {
        newConfig.providers.devchat = {
          api_key: "",
          api_base: "",
        };
      }

      self.modelsTemplate.forEach((item) => {
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

        if (newConfig.models[item.name].provider !== currentModel.provider) {
          needUpdate = true;
          newConfig.models[item.name].provider = currentModel.provider;
        }
        // 只有之前配置过 openai 的，provider 才可以是 openai
        if (
          newConfig.models[item.name].provider === "openai" &&
          !newConfig.providers.openai.api_key
        ) {
          newConfig.models[item.name].provider = "devchat";
        }
      });

      const modelList = this.getModelList();
      if (!modelList.includes(newConfig.default_model)) {
        newConfig.default_model = modelList[0];
        needUpdate = true;
      }

      if (!defaultAPIBase.includes(newConfig.providers.devchat.api_base)) {
        newConfig.providers.devchat.cumstom_api_base =
          newConfig.providers.devchat.api_base;
        newConfig.providers.devchat.api_base = "custom";
      }

      self.config = newConfig;
      self.defaultModel = newConfig.default_model;
      if (needUpdate) {
        this.writeConfig();
      }
      this.updateSettle(true);
    },
    getModelList: () => {
      const modelsArray = self.modelsTemplate.map((item) => {
        return item.name;
      });
      return modelsArray;
    },
    writeConfig: function () {
      const writeConfig = cloneDeep(self.config);
      if (
        writeConfig.providers.devchat.api_base === "custom" &&
        writeConfig.providers.devchat.cumstom_api_base
      ) {
        writeConfig.providers.devchat.api_base =
          writeConfig.providers.devchat.cumstom_api_base;
      }
      delete writeConfig.providers.devchat.cumstom_api_base;

      MessageUtil.sendMessage({
        command: "writeConfig",
        value: writeConfig,
        key: "",
      });

      setTimeout(() => {
        MessageUtil.sendMessage({ command: "readConfig", key: "" });
      }, 1000);
    },
    setConfigValue: function (key: string, value: any) {
      if (key === "default_model") {
        self.defaultModel = value;
      }
      const cloneConfig = cloneDeep(self.config);
      cloneConfig[key] = value;
      self.config = cloneConfig;
      this.writeConfig();
    },
  }));

export type IConfigStore = Instance<typeof ConfigStore>;
