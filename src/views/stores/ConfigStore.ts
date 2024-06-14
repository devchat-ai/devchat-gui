import MessageUtil from "@/util/MessageUtil";
import { types, Instance, flow } from "mobx-state-tree";
import modelsTemplate from "@/models";
import cloneDeep from "lodash.clonedeep";
import axios from "axios";

const defaultAPIBase = [
  "https://api.devchat.ai/v1",
  "https://api.devchat-ai.cn/v1",
];


function deepCopy(obj) {
  let copy = Array.isArray(obj) ? [] : {};

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        copy[key] = deepCopy(obj[key]); // 递归调用
      } else {
        copy[key] = obj[key];
      }
    }
  }

  return copy;
}

export const fetchServerConfigUtil = async ({ modelsUrl, devchatApiKey }) => {
  try {
    const response = await axios.get(`${modelsUrl}/models`, {
      headers: { 'Authorization': `Bearer ${devchatApiKey}` }
    });

    if (response.status === 200) {
      if (response.data.data && Array.isArray(response.data.data)) {
        // change data to models key
        response.data.models = response.data.data;
        delete response.data.data;
      }
      return response.data;
    } else {
      console.error("fetchServerConfig error: Non-200 status code", response.status);
      return undefined;
    }
  } catch (e) {
    console.error("fetchServerConfig error:", e);
    return undefined;
  }
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
  input_price: types.number,
  output_price: types.number,
  currency: types.string
});


export const ConfigStore = types
  .model("Config", {
    config: types.optional(types.frozen(), {}),
    modelsTemplate: types.optional(types.array(Model), modelsTemplate),
    chatModels: types.optional(types.array(Model), []),
    settle: types.optional(types.boolean, false),
    defaultModel: types.optional(types.string, ""),
    devchatApiKey: "DC.xxxxxxx",
    modelsUrl: "https://api.devchat.ai/v1",
    provider: "devchat",
  })
  .actions((self) => {
    const setTemplate = (value: any,) => {
      const provider = self.provider;
      const list: any[] = [];

      for (const name in value) {
          if (value.hasOwnProperty(name)) {
              const item: any = { name };
              for (const key in value[name]) {
                  if (value[name].hasOwnProperty(key)) {
                      item[key] = value[name][key];
                  }
              }
              list.push(item);
          }
      }
      value = list;

      const models = value
        .map((item) => {
          return {
            name: item.name,
            max_input_tokens: item.max_input_tokens ?? 6000,
            provider: provider,
            stream: true,
            category: item.category ?? "chat",
            context_size: item.context_size ?? 8000,
            temperature: item.temperature ?? 0.3,
            max_tokens: item.max_tokens ?? 2000,
            json_mode: item.json_mode ?? false,
            input_price: item.input_price ?? -1,
            output_price: item.output_price ?? -1,
            currency: item.currency ?? "CNY",
          };
        });
      self.chatModels  = models
        .filter((item) => item.category === "chat");
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
      updateConfig(server_config: any, server_config_base: any, user_config: any) {
          console.log("----->:::updateConfig");
          // 如果server_config没有获取到，那么直接返回
          if (!server_config || !server_config.models) {
              return [undefined, user_config];
          }
          if (server_config_base === undefined) {
              server_config_base = {};
          }
          if (server_config_base.models === undefined) {
              server_config_base.models = {};
          }
          // 将 server_config 转换为本地配置存储的格式
          const localConfig: any = {"models": {}};
          server_config.models.forEach((model: any) => {
              const modelConfig: any = {};
              for (const key in model) {
                  if (key !== 'model') {
                      modelConfig[key] = model[key];
                  }
              }
              localConfig["models"][model.model || model.id] = modelConfig;
          });
      
          // 合并 config 部分，不假设具体的配置项名称
          for (const key in server_config.config) {
              localConfig[key] = server_config.config[key];
          }
      
          // 使用子函数处理对比和更新
          const userConfigNew = this.compareConfigs(localConfig, server_config_base, user_config);
      
          return [localConfig, userConfigNew];
      },
      compareConfigs(localConfig: any, baseConfig: any, userConfigIn: any) {
        let userConfig = { ...userConfigIn };

          for (const key in localConfig) {
              if (baseConfig.hasOwnProperty(key) && userConfig.hasOwnProperty(key)) {
                  // 递归比较对象的每个叶子结点
                  if (typeof localConfig[key] === 'object' && !Array.isArray(localConfig[key]) && localConfig[key] !== null) {
                    userConfig[key] = this.compareConfigs(localConfig[key], baseConfig[key], userConfig[key]);
                  } else {
                      if (localConfig[key] !== baseConfig[key]) {
                          // 检查用户配置中是否存在该条目
                          if (!userConfig[key] || JSON.stringify(userConfig[key]) === JSON.stringify(baseConfig[key])) {
                              userConfig[key] = localConfig[key];
                          }
                      }
                  }
              } else {
                  // 新增的配置项
                  if (!userConfig[key]) {
                    if (!Object.isExtensible(userConfig)) {
                      // 如果 userConfig 不可扩展，创建一个新的可扩展对象
                      userConfig = { ...userConfig };
                    }
                    userConfig[key] = localConfig[key];
                  }
              }
          }
      
          // 处理删除的配置项，仅针对 models 下的 model
          if (localConfig.models ) {
            const localModels = localConfig.models;
            const userModels = userConfig.models;

            for (const modelKey in userModels) {
                if (!localModels.hasOwnProperty(modelKey)) {
                    // 删除的 model，从 userConfig 中移除
                    delete userModels[modelKey];
                }
            }
          }
          return userConfig;
      },
      setConfig: function (data) {
        this.setTemplate(data.models);
        this.updateSettle(false);
        const newConfig: any = deepCopy(data);
        newConfig.models = newConfig.models || {};
        newConfig.providers = newConfig.providers || {};
        if (!newConfig.providers.openai) {
          newConfig.providers.openai = {
            api_key: "",
            api_base: "",
          };
        }
        if (!newConfig.providers.devchat) {
          newConfig.providers.devchat = {
            api_key: "",
            api_base: "",
          };
        }

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
        
        if (!defaultAPIBase.includes(newConfig.providers.devchat.api_base)) {
          newConfig.providers.devchat.cumstom_api_base =
            newConfig.providers.devchat.api_base;
          newConfig.providers.devchat.api_base = "custom";
        }

        self.config = newConfig;
        self.defaultModel = newConfig.default_model;
        this.writeConfig();
        this.updateSettle(true);
      },
      fetchServerConfig: flow(function* (){
        try {
          const data = yield fetchServerConfigUtil({ modelsUrl: self.modelsUrl, devchatApiKey: self.devchatApiKey });
          if (data !== undefined) {
            MessageUtil.handleMessage({ command: "readServerConfig", value: data });
          } else {
            console.log("fetchLLMs error: Failed to fetch server config");
            MessageUtil.handleMessage({ command: "readServerConfig", value: undefined });
          }
        } catch (e) {
          console.log("fetchLLMs error:", e);
          MessageUtil.handleMessage({ command: "readServerConfig", value: undefined });
        }
      }),
      checkAndSetCompletionDefaults: (newConfig) => {
        const codeModels = self.modelsTemplate.filter(model => model.category === "code");
        const isCustomAPIBase = self.modelsUrl.indexOf("api.devchat.ai") === -1 && self.modelsUrl.indexOf("api.devchat-ai.cn") === -1;
        const isCompleteModelUnset = !self.config.complete_model;

        if (codeModels.length > 0 && isCustomAPIBase && isCompleteModelUnset) {
          newConfig.complete_enable = true;
          newConfig.complete_index_enable = true;
          newConfig.complete_context_limit = 5000;
          newConfig.complete_model = codeModels[0].name;
          return true;
        } else {
          // 如果代码补全模型可用，但complete_model设置模型不在codeModels中，则重新更新
          if (codeModels.length > 0 && newConfig.complete_model && codeModels.find((item) => item.name === newConfig.complete_model) === undefined) {
            newConfig.complete_model = codeModels[0].name;
            return true;
          }
        }
        return false;
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
