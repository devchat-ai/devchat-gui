import MessageUtil from "@/util/MessageUtil";
import { types, Instance, flow } from "mobx-state-tree";
import modelsTemplate from "@/models";
import cloneDeep from "lodash.clonedeep";
import { set } from "mobx";
import axios from "axios";

const defaultAPIBase = [
  "https://api.devchat.ai/v1",
  "https://api.devchat-ai.cn/v1",
];

export const fetchLLMs = async ({modelsUrl,devchatApiKey}) => {
  return new Promise<{data:any}>((resolve, reject) => {
      try {
        // 添加 header: "Authorization: Bearer ${devchatApiKey}"
        axios.get(`${modelsUrl}/models`, { headers: { 'Authorization': `Bearer ${devchatApiKey}` }}).then((res) => {
          // 获取 models 模版列表
          if (res?.data?.data && Array.isArray(res?.data?.data)) {
            resolve(res.data);
          }
        });
      } catch (e) {
        reject(e);
      }
    }
  );
};

export const Model = types.model({
  name: types.string,
  provider: types.string,
  stream: types.boolean,
  max_input_tokens: types.number
});

export const ConfigStore = types
  .model("Config", {
    config: types.optional(types.frozen(), {}),
    modelsTemplate: types.optional(types.array(Model), modelsTemplate),
    settle: types.optional(types.boolean, false),
    defaultModel: types.optional(types.string, ""),
    devchatApiKey: "DC.xxxxxxx",
    modelsUrl: "https://api.devchat.ai/v1",
    provider: "devchat",
  })
  .actions((self) => {
    const setTemplate = (value: any, provider: string) => {
      debugger
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
    }
    return {
      setTemplate,
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
        newConfig.models = newConfig.models || {};
        newConfig.providers = newConfig.providers || {};
        newConfig.providers.openai = newConfig.providers.openai || {
          api_key: "",
          api_base: "",
        };
        newConfig.providers.devchat = newConfig.providers.devchat || {
          api_key: "",
          api_base: "",
        };

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

          // 尝试获取 devchat 的 api_base
          self.provider = "devchat";
          self.modelsUrl = data.value?.providers?.devchat?.api_base;
          self.devchatApiKey = data.value?.providers?.devchat?.api_key;

          // 如果 devchat 的 api_base 没有设置，尝试获取 openai 的 api_base
          if (!self.modelsUrl || !self.devchatApiKey) {
            self.modelsUrl = data.value?.providers?.openai?.api_base;
            self.devchatApiKey = data.value?.providers?.openai?.api_key;
            self.provider = "openai";
          }

          // 如果以上两者都没有设置，使用默认链接
          if (!self.modelsUrl) {
            self.modelsUrl = "https://api.devchat.ai/v1";
            self.devchatApiKey = "1234";
            self.provider = "devchat";
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
      refreshModelList: flow(function* (){
        debugger
        const { data } = yield fetchLLMs({modelsUrl:self.modelsUrl,devchatApiKey:self.devchatApiKey});
        setTemplate(data,self.provider);
      }),
      getModelList: function () {
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
    };
  });

export type IConfigStore = Instance<typeof ConfigStore>;
