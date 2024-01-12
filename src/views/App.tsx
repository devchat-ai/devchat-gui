import * as React from "react";
import { AppShell } from "@mantine/core";
import ChatPanel from "@/views/pages/ChatPanel";
import Head from "@/views/components/Header";
import "./App.css";
import "./i18n";

export default function App() {
  // vscode

  return (
    <AppShell
      header={<Head />}
      styles={{
        main: {
          padding: "40px 0 0 0",
          fontFamily: "var(--vscode-editor-font-family)",
          fontSize: "var(--vscode-editor-font-size)",
        },
      }}
    >
      <ChatPanel />
    </AppShell>
  );
}
