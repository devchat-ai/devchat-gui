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
import axios from "axios";

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
    MessageUtil.registerHandler("readConfig", (data: { value: any }) => {
      console.log("readConfig registerHandler: ", data);

      // 尝试获取 devchat 的 api_base
      let provider: string = "devchat";
      let modelsUrl = data.value?.providers?.devchat?.api_base;
      let devchatApiKey = data.value?.providers?.devchat?.api_key;

      // 如果 devchat 的 api_base 没有设置，尝试获取 openai 的 api_base
      if (!modelsUrl || !devchatApiKey) {
        modelsUrl = data.value?.providers?.openai?.api_base;
        devchatApiKey = data.value?.providers?.openai?.api_key;
        provider = "openai";
      }

      // 如果以上两者都没有设置，使用默认链接
      if (!modelsUrl) {
        modelsUrl = "https://api.devchat.ai/v1";
        devchatApiKey = "1234";
        provider = "devchat";
      }

      // 添加 header: "Authorization: Bearer ${devchatApiKey}"
      axios.get(`${modelsUrl}/models`, { headers: { 'Authorization': `Bearer ${devchatApiKey}` }}).then((res) => {
        // 获取 models 模版列表
        if (res?.data?.data && Array.isArray(res?.data?.data)) {
          config.setTemplate(res.data.data, provider);
          config.setConfig(data.value);
          setReady(true);
        }
      });
    });
    MessageUtil.sendMessage({ command: "readConfig", key: "" });
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
