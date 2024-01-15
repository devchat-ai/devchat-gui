import * as React from "react";
import { AppShell, LoadingOverlay } from "@mantine/core";
import ChatPanel from "@/views/pages/ChatPanel";
import Head from "@/views/components/Header";
import "./App.css";
import "./i18n";

export default function App() {
  const [ready, setReady] = React.useState(false);

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
      {ready ? <ChatPanel /> : <LoadingOverlay visible />}
    </AppShell>
  );
}
