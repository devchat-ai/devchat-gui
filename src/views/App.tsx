import React, { useState, useEffect } from "react";
import { AppShell, LoadingOverlay } from "@mantine/core";
import ChatPanel from "@/views/pages/ChatPanel";
import ConfigPanel from "@/views/pages/Config";
import Head from "@/views/components/Header";
import { CurrentRouteType, IRouter, RouterContext } from "./router";
import { useMst } from "./stores/RootStore";
import MessageUtil from "@/util/MessageUtil";
import "./App.css";
import "./i18n";
import APIUtil from "@/util/APIUtil";

export default function App() {
  const [ready, setReady] = useState(false);
  const { config } = useMst();
  const [currentRoute, setCurrentRoute] = useState<CurrentRouteType>("chat");
  const [lastRoute, setLastRoute] = useState<CurrentRouteType>("chat");

  const router: IRouter = {
    currentRoute,
    lastRoute,
    updateRoute: (route: CurrentRouteType) => {
      setLastRoute(currentRoute);
      setCurrentRoute(route);
    },
  };

  const getConfig = () => {
    // 比较函数
    const compare_func = (configs: any) => {
        const [serverConfig, userConfig] = config.updateConfig(configs.server_config, configs.server_config_base, configs.user_config);        
        if (serverConfig) {
            // save server config as base
            MessageUtil.sendMessage({ command: "writeServerConfigBase", value: serverConfig });
        }

        const modelList = Object.keys(userConfig.models || {});
        
        // 判断是否需要重设默认模型值
        if (!userConfig.default_model || !modelList.includes(userConfig.default_model)) {
            // 需要重新设置默认模型
            if (serverConfig && serverConfig.default_model && modelList.includes(serverConfig.default_model)) {
                // 优先使用服务器配置中的默认设置
                userConfig.default_model = serverConfig.default_model;
            } else {
                // 使用 chat 类型的第一个模型
                const chatModel = modelList.find(model => userConfig.models[model].category === "chat");
                userConfig.default_model = chatModel || modelList[0] || "";
            }
        }

        // set user config
        config.setConfig(userConfig);
    };

    // 结果记录
    let configs = {};
    let configCount = 0;

    // 处理函数
    const handleConfig = (key: string, data: { value: any }) => {
        console.log("-----> receive:", key);
        configs[key] = {...data.value};
        configCount++;
        checkConfigs();
    };

    // 检查是否所有配置都已准备好
    const checkConfigs = () => {
        if (configCount === 3) {
            compare_func(configs);
            // 假设setReady是一个函数，用于设置应用状态为准备就绪
            setReady(true); 
            // update workflow list
            config.updateWorkflowList();
        }
    };

    // 注册处理函数
    MessageUtil.registerHandler("readConfig", (data: { value: any }) => {
      config.setConfig(data.value);
      APIUtil.config(config.getAPIBase(), config.getUserKey());
      setReady(true);
      config.fetchServerConfig();
      handleConfig("user_config", data);
    });
    MessageUtil.registerHandler("readServerConfigBase", (data: { value: any }) => handleConfig("server_config_base", data));
    MessageUtil.registerHandler("readServerConfig", (data: { value: any }) => handleConfig("server_config", data));
    
    MessageUtil.registerHandler(
      "reloadConfig", 
      (data: { value: any }) => {
        configs = {};
        configCount = 0;

        // 发送消息
        MessageUtil.sendMessage({ command: "readConfig", key: "" });
        MessageUtil.sendMessage({ command: "readServerConfigBase", key: "" });
      });
    MessageUtil.handleMessage({ command: "reloadConfig" });  
  };

  useEffect(() => {
    if (process.env.platform === "vscode") {
      getConfig();
      return;
    }

    const checkReady = () => {
      if (window.JSJavaBridge) {
        getConfig();
      } else {
        setTimeout(checkReady, 200);
      }
    };
    checkReady();
  }, []);

  return (
    <RouterContext.Provider value={router}>
      <AppShell
        header={ready ? <Head /> : <div></div>}
        styles={{
          main: {
            padding: "40px 0 0 0",
            fontFamily: "var(--vscode-editor-font-family)",
            fontSize: "var(--vscode-editor-font-size)",
          },
        }}
      >
        {ready ? (
          <>
            <ChatPanel />
            <ConfigPanel />
          </>
        ) : (
          <LoadingOverlay visible />
        )}
      </AppShell>
    </RouterContext.Provider>
  );
}
