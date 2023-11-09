// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import "@mantine/core/styles.css";
import { AppShell, MantineProvider } from "@mantine/core";
import SendMessage from "@/components/sendMessage";
import MessageList from "@/components/messageList";
export default function App() {
  return (
    <MantineProvider>
      <AppShell header={{ height: 60 }} padding="md" footer={{ height: 60 }}>
        <AppShell.Header>
          <div>this is Logo</div>
        </AppShell.Header>

        <AppShell.Main>
          <MessageList />
        </AppShell.Main>
        <AppShell.Footer p="md">
          <SendMessage />
        </AppShell.Footer>
      </AppShell>
    </MantineProvider>
  );
}
