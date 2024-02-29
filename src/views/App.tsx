import * as React from "react";
import { AppShell, LoadingOverlay } from "@mantine/core";
import ChatPanel from "@/views/pages/ChatPanel";
import Config from "./pages/Config";
import Head from "@/views/components/Header";
import { CurrentRouteType, IRouter, RouterContext } from "./router";
import "./App.css";
import "./i18n";

export default function App() {
  const [ready, setReady] = React.useState(false);
  const [currentRoute, setCurrentRoute] =
    React.useState<CurrentRouteType>("chat");

  const router: IRouter = {
    currentRoute,
    updateRoute: setCurrentRoute,
  };

  React.useEffect(() => {
    if (process.env.platform === "vscode") {
      setReady(true);
      return;
    }
    const checkReady = () => {
      if (window.JSJavaBridge) {
        setReady(true);
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
            <Config />
          </>
        ) : (
          <LoadingOverlay visible />
        )}
      </AppShell>
    </RouterContext.Provider>
  );
}
