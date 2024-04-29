import MessageUtil from "@/util/MessageUtil";
import { types, Instance, flow } from "mobx-state-tree";
import modelsTemplate from "@/models";
import _ from "lodash";
import { set } from "mobx";
import axios from "axios";

const defaultAPIBase = [
  "https://api.devchat.ai/v1",
  "https://api.devchat-ai.cn/v1",
];

export const Model = types.model({
  name: types.string,
  provider: types.string,
  stream: types.boolean,
  maxInputTokens: types.number
});

export const Provider = types.model({
  name: types.string,
  apiKey: types.string,
  apiBase: types.string,
});

export const ConfigFile = types.model({
  language: types.string,
  defaultModel: types.string,
  providers: types.array(Provider),
  models: types.array(Model),
  enableFunctionCalling: types.boolean,
  betaInvitationCode: types.string,
  maxLogCount: types.number,
  pythonForChat:types.string,
  pythonForCommands:types.string,
});

export const fetchLLMs = async (provider) => {
  return new Promise<{data:any}>((resolve, reject) => {
      try {
        // 添加 header: "Authorization: Bearer ${devchatApiKey}"
        axios.get(`${provider.api_base}/models`, { headers: { 'Authorization': `Bearer ${provider.api_key}` }}).then((res) => {
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

export const readConfigFile = async () => {
  return new Promise((resolve, reject) => {
      try {
        const handler =  (data: { value: any }) => {
          console.log("readConfig registerHandler: ", data);
          resolve(data.value);
          MessageUtil.unregisterHandler("readConfig",handler);
        };
        MessageUtil.registerHandler("readConfig",handler);
        MessageUtil.sendMessage({ command: "readConfig", key: "" });
      } catch (e) {
        reject(e);
      }
    }
  );
};

export const ConfigStore = types
  .model("Config", {
    file: types.optional(ConfigFile,{
      language: "zh",
      defaultModel: "",
      providers: [],
      models: [],
      enableFunctionCalling: false,
      betaInvitationCode: "",
      maxLogCount: 20,
      pythonForChat:"",
      pythonForCommands:"",
    }),
    modelNames: types.optional(types.array(types.string),[]),
    settle: types.optional(types.boolean, false),
    devchat: types.optional(Provider,{
      name: "devchat",
      apiKey: "DC.xxxxxxx",
      apiBase: "https://api.devchat.ai/v1",
    }),
    openai: types.optional(Provider,{
      name: "openai",
      apiKey: "xxxxx",
      apiBase: "https://api.openai.com/v1",
    })
  })
  .actions((self) => {
    const setTemplate = (value: any, provider: string) => {
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
      self.file.models = models;
      self.modelNames = models.map((item)=>item.name);
    };

    const getProvider = () =>{
      const devchatIndex = self.file.providers.findIndex((p)=>p.name==="devchat");
      const openaiIndex = self.file.providers.findIndex((p)=>p.name==="openai");

      // key 可能有两个，一个是 devchat key,一个是 openai key
      if (devchatIndex>0) {
        return self.file.providers[devchatIndex];
      } else if (openaiIndex>0) {
        return self.file.providers[openaiIndex];
      } else{
        return Provider.create({
          name: "devchat",
          apiKey: "DC.xxxxxxx",
          apiBase: "https://api.devchat.ai/v1",
        });
      }
    };

    const readConfig = flow(function*(){
      const fileConfig = yield readConfigFile();
      // load config file data
      self.file.models = _.map(fileConfig.models,(value,key) => Model.create({
        name:key,
        provider: value.provider,
        stream: value.stream,
        maxInputTokens: value.max_input_tokens || -1
      }));
      self.file.providers = _.map(fileConfig.providers,(value,key) => Provider.create({
          name: key,
          apiKey: value.api_key,
          apiBase: value.api_base,
      }));
      self.file.language = fileConfig.language;
      self.file.defaultModel = fileConfig.default_model;
      self.file.enableFunctionCalling = fileConfig.enable_function_calling;
      self.file.betaInvitationCode = fileConfig.beta_invitation_code;
      self.file.maxLogCount = fileConfig.max_log_count;
      self.file.pythonForChat = fileConfig.python_for_chat;
      self.file.pythonForCommands = fileConfig.python_for_commands;
      // for view layer data
      self.modelNames = _.map(fileConfig.models,(value, key) => key);
      self.devchat = _.findLast(self.file.providers,(p)=>p.name==="devchat");
      self.openai = _.findLast(self.file.providers,(p)=>p.name==="openai");
    });

    const writeConfig = () => {
      const writeConfig = self.file;
      MessageUtil.sendMessage({
        command: "writeConfig",
        value: writeConfig,
        key: "",
      });
    };

    const updateSettle = (value: boolean):void => {
      self.settle = value;
    };

    const initConfig = (data:any) => {
      updateSettle(false);
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

      self.file.models.forEach((item) => {
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

      const modelList = self.modelNames;
      if (!modelList.includes(newConfig.default_model)) {
        newConfig.default_model = modelList[0];
        needUpdate = true;
      }

      self = newConfig;
      self.file.defaultModel = newConfig.default_model;
      if (needUpdate) {
        writeConfig();
      }
      updateSettle(true);
    };
    
    const refreshModelList = flow(function* (){
      const provider = getProvider();
      const { data } = yield fetchLLMs(provider);
      setTemplate(data, provider.name);
    });

    const setConfigValue = (key: string, value: any) => {
      self[key]=value;
      writeConfig();
    };

    return {
      setTemplate,
      getProvider,
      readConfig,
      writeConfig,
      updateSettle,
      initConfig,
      refreshModelList,
      setConfigValue
    };
  });

export type IConfigStore = Instance<typeof ConfigStore>;
