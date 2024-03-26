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
      config.setConfig(data.value);
      setReady(true);
    });
    // 获取 models 模版列表
    axios.get("https://api-test.devchat.ai/v1/models").then((res) => {
      if (res?.data?.data && Array.isArray(res?.data?.data)) {
        config.setTemplate(res.data.data);
        MessageUtil.sendMessage({ command: "readConfig", key: "" });
      }
    });
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
