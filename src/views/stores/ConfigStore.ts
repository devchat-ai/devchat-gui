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
        // 添加 header: "Authorization: Bearer ${devchatApiKey}"
        axios.get(`${modelsUrl}/models`, { headers: { 'Authorization': `Bearer ${devchatApiKey}` }}).then((res) => {
          // 获取 models 模版列表
          if (res?.data?.data && Array.isArray(res?.data?.data)) {
            resolve(res.data);
          }
        }).catch((e) => {
          console.error("fetchLLMs error:", e);
          reject(e);
        });
    }
  );
};

export const Model = types.model({
  name: types.string,
  provider: types.string,
  stream: types.boolean,
  max_input_tokens: types.number,
  category: types.string,
  context_size: types.number,
  temperature: types.number,
  max_tokens: types.number,
  json_mode: types.boolean,
});

export const ConfigStore = types
  .model("Config", {
    config: types.optional(types.frozen(), {}),
    modelsTemplate: types.optional(types.array(Model), modelsTemplate),
    modelNames: types.optional(types.array(types.string),modelsTemplate.map((item)=>item.name)),
    settle: types.optional(types.boolean, false),
    defaultModel: types.optional(types.string, ""),
    devchatApiKey: "DC.xxxxxxx",
    modelsUrl: "https://api.devchat.ai/v1",
    provider: "devchat",
  })
  .actions((self) => {
    const setTemplate = (value: any, provider: string) => {
      const models = value
        .map((item) => {
          return {
            name: item.model ?? item.id,
            max_input_tokens: item.max_input_tokens ?? 6000,
            provider: provider,
            stream: true,
            category: item.category ?? "chat",
            context_size: item.context_size ?? 8000,
            temperature: item.temperature ?? 0.3,
            max_tokens: item.max_tokens ?? 2000,
            json_mode: item.json_mode ?? false,
          };
        });
      self.modelNames  = value
        .filter((item) => item.category === "chat")
        .map((item) => item.model ?? item.id);
      self.modelsTemplate = models;
    };

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
            needUpdate = true;
          } else {
            if (Object.keys(currentModel).length !== Object.keys(newConfig.models[item.name]).length) {
              newConfig.models[item.name] = {
                ...currentModel,
                ...newConfig.models[item.name],
              };
              needUpdate = true;
            }
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
            needUpdate = true;
            newConfig.models[item.name].provider = "devchat";
          }
        });

        // 尝试获取 devchat 的 api_base
        self.provider = "devchat";
        self.modelsUrl = data?.providers?.devchat?.cumstom_api_base || data?.providers?.devchat?.api_base;
        self.devchatApiKey = data?.providers?.devchat?.api_key;

        // 如果 devchat 的 api_base 没有设置，尝试获取 openai 的 api_base
        if (!self.modelsUrl || !self.devchatApiKey) {
          self.modelsUrl = data?.providers?.openai?.api_base;
          self.devchatApiKey = data?.providers?.openai?.api_key;
          self.provider = "openai";
        }

        // 如果以上两者都没有设置，使用默认链接
        if (!self.modelsUrl) {
          self.modelsUrl = "https://api.devchat.ai/v1";
          self.devchatApiKey = "1234";
          self.provider = "devchat";
        }

        const modelsChat = self.modelsTemplate.filter(model => model.category === "chat");
        
        if (modelsChat.length > 0 && modelsChat.find((item) => item.name === newConfig.default_model) === undefined) {
          newConfig.default_model = modelsChat[0].name;
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
        try {
          if (self.modelsTemplate.length === 0) {
            const { data } = yield fetchLLMs({modelsUrl:self.modelsUrl,devchatApiKey:self.devchatApiKey});
            setTemplate(data,self.provider);
            MessageUtil.sendMessage({ command: "readConfig", key: "" });
          }
        } catch (e) {
          console.log("fetchLLMs error:", e);
        }
      }),
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
