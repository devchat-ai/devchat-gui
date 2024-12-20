import * as React from "react";
import { useEffect, useRef } from "react";
import { ActionIcon, Alert, Box, Button, Center, Stack } from "@mantine/core";
import { ScrollArea } from "@mantine/core";
import {
  useElementSize,
  useResizeObserver,
  useTimeout,
  useViewportSize,
} from "@mantine/hooks";
import messageUtil from "@/util/MessageUtil";
import APIUtil from "@/util/APIUtil";
import StopButton from "@/views/components/StopButton";
import RegenerationButton from "@/views/components/RegenerationButton";
import { observer } from "mobx-react-lite";
import { useMst } from "@/views/stores/RootStore";
import { Message } from "@/views/stores/ChatStore";

import InputMessage from "@/views/components/InputMessage";
import MessageList from "@/views/components/MessageList";
import {
  IconCircleArrowDownFilled,
  IconExternalLink,
} from "@tabler/icons-react";
import { useRouter } from "../router";
import IDEServiceUtil from "@/util/IDEServiceUtil";

interface WorkflowConf {
  description: string;
}

interface WorkflowItem {
  name: string;
  namespace: string;
  active: boolean;
  command_conf: WorkflowConf;
  recommend: number;
}

const chatPanel = observer(() => {
  const { input, chat } = useMst();
  const router = useRouter();
  const [chatContainerRef, chatContainerRect] = useResizeObserver();
  const scrollViewport = useRef<HTMLDivElement>(null);
  const { height } = useViewportSize();
  const { ref: inputAreatRef, height: inputAreaHeight } = useElementSize();
  const isFirstRender = useRef(true);

  const chatPanelWidth = chatContainerRect.width;

  const scrollToBottom = () =>
    scrollViewport?.current?.scrollTo({
      top: scrollViewport.current.scrollHeight,
      behavior: "smooth",
    });

  const timer = useTimeout(() => {
    if (chat.isBottom) {
      scrollToBottom();
    }
  }, 1000);

  const onScrollPositionChange = ({ x, y }) => {
    const sh = scrollViewport.current?.scrollHeight || 0;
    const vh = scrollViewport.current?.clientHeight || 0;
    const gap = sh - vh - y;
    const isBottom = sh < vh ? true : gap < 100;
    const isTop = y === 0;
    //
    if (isBottom) {
      chat.onMessagesBottom();
    } else if (isTop) {
      chat.onMessagesTop();
      if (!chat.isLastPage) {
        //TODO: Data loading flickers and has poor performance, so I temporarily disabled the loading logic.
        // dispatch(fetchHistoryMessages({ pageIndex: pageIndex + 1 }));
      }
    } else {
      chat.onMessagesMiddle();
    }
  };

  useEffect(() => {
    if (!router.currentRoute || router.currentRoute !== "chat") {return;}
    // Fetch the command menus, before history records are obtained,
    // because the display information in the history record requires adjustment
    messageUtil.registerHandler(
      "regCommandList",
      (message: { result: WorkflowItem[] }) => {
        const commandMenus = message.result?.filter(item => item.active).map(item => ({
          name: item.name,
          pattern: item.name,
          description: item.command_conf.description,
          recommend: item.recommend ?? -1,
        }));
        input.fetchCommandMenus(commandMenus);
        if (!isFirstRender.current) {
          return;
        }
        isFirstRender.current = false;
        messageUtil.registerHandler("reloadMessage", (message: any) => {
          chat.reloadMessage(message);
        });
        messageUtil.registerHandler("loadHistoryMessages", (message: any) => {
          chat.reloadMessage({
            entries: message.entries,
            pageIndex: 0,
            reset: message.entries.length === 0,
          });
        });
        chat.fetchHistoryMessages();
      }
    );
    messageUtil.registerHandler(
      "receiveMessagePartial",
      (message: { text: string }) => {
        chat.startResponsing(message.text);
        timer.start();
      }
    );
    messageUtil.registerHandler(
      "receiveMessage",
      (message: { text: string; isError: boolean; hash }) => {
        chat.stopGenerating(true, message.hash, message.text);
        if (message.isError) {
          chat.happendError(message.text);
        }
      }
    );
    messageUtil.registerHandler(
      "systemMessage",
      (message: { text: string }) => {
        const messageItem = Message.create({
          type: "system",
          message: message.text,
        });
        chat.newMessage(messageItem);
        // start generating
        chat.startSystemMessage();
        // Clear the input field
        input.setValue("");
        input.clearContexts();
      }
    );
    messageUtil.registerHandler("codeDiffApply", (_: any) => {
      const e = 'code_diff_apply';
      const platform = process.env.platform === "idea" ? "intellij" : process.env.platform;
      IDEServiceUtil.getCurrentFileInfo().then(info => APIUtil.createEvent({
        name: e,
        value: e,
        ide: platform,
        language: info?.extension || info?.path?.split('.').pop()
      }));
    });

    messageUtil.registerHandler("logEvent", (message: {id: string, language: string,  name: string, value: Record<string, any>}) => {
      const platform = process.env.platform === "idea" ? "intellij" : process.env.platform;
      APIUtil.createEvent({
        name: message.name,
        value: typeof message.value === 'string' ? message.value : JSON.stringify(message.value),
        ide: platform,
        language: message.language
      }, message.id);
      console.log("logEvent:", message);
    });

    messageUtil.registerHandler("logMessage", (message: {id: string, language: string, commandName: string, content: string, model: string}) => {
      const platform = process.env.platform === "idea" ? "intellij" : process.env.platform;
      const timestamp = new Date().toISOString(); // 自动生成当前时间的ISO格式时间戳

      APIUtil.createMessage({
        content: message.content,
        command: message.commandName,
        timestamp: timestamp,
        ide: platform,
        language: message.language,
        model: message.model
      }, message.id);

      console.log("logMessage:", { message, timestamp });
    });

    messageUtil.registerHandler("getIDEServicePort", (data: any) => {
      IDEServiceUtil.config(data.result);
    });

    messageUtil.sendMessage({ command: "getIDEServicePort" });
    messageUtil.sendMessage({ command: "regCommandList" });

    timer.start();
    return () => {
      timer.clear();
    };
  }, []);

  useEffect(() => {
    if (router.currentRoute === "chat" && router.lastRoute !== "chat") {
      chat.reloadMessage({
        entries: [],
        pageIndex: 0,
        reset: true,
      });
    }
  }, [router.currentRoute]);

  useEffect(() => {
    scrollToBottom();
  }, [chat.scrollBottom]);

  useEffect(() => {
    chat.updateChatPanelWidth(chatPanelWidth);
  }, [chatPanelWidth]);

  return (
    <Stack
      ref={chatContainerRef}
      miw={300}
      spacing={0}
      sx={{
        height: "100%",
        background: "var(--vscode-sideBar-background)",
        color: "var(--vscode-editor-foreground)",
      }}
    >
      <ScrollArea
        sx={{
          height: height - inputAreaHeight - 40,
          margin: 0,
        }}
        onScrollPositionChange={onScrollPositionChange}
        viewportRef={scrollViewport}
      >
        <MessageList />
        {chat.errorMessage && (
          <Box
            sx={{
              width: chatPanelWidth - 20,
              margin: "0 10px 40px 10px",
            }}
          >
            <Alert
              styles={{
                message: {
                  width: chatPanelWidth - 50,
                  whiteSpace: "break-spaces",
                  overflowWrap: "break-word",
                  fontSize: "var(--vscode-editor-font-size)",
                },
              }}
              color="gray"
              variant="filled"
            >
              {chat.errorMessage}
            </Alert>
            {chat.errorMessage.search("Insufficient balance") > -1 && (
              <Button
                size="xs"
                component="a"
                href={chat.rechargeSite}
                mt={5}
                variant="outline"
                leftIcon={<IconExternalLink size="0.9rem" />}
              >
                Open official website to recharge.
              </Button>
            )}
          </Box>
        )}
        {!chat.isBottom && (
          <ActionIcon
            onClick={() => {
              scrollToBottom();
            }}
            title="Bottom"
            variant="transparent"
            sx={{ position: "absolute", bottom: 5, right: 16, zIndex: 2 }}
          >
            <IconCircleArrowDownFilled size="1.125rem" />
          </ActionIcon>
        )}
        {chat.generating && (
          <Center
            sx={{ position: "absolute", bottom: 5, zIndex: 1, width: "100%" }}
          >
            <StopButton />
          </Center>
        )}
        {chat.errorMessage && (
          <Center
            sx={{ position: "absolute", bottom: 5, zIndex: 1, width: "100%" }}
          >
            <RegenerationButton />
          </Center>
        )}
      </ScrollArea>
      <Box
        ref={inputAreatRef}
        sx={{
          position: "absolute",
          bottom: 0,
          width:
            chatPanelWidth > 300 || chatPanelWidth === 0
              ? "100%"
              : chatPanelWidth,
          background: "var(--vscode-sideBar-background)",
          boxShadow: "0 0 10px 0 var(--vscode-widget-shadow)",
          borderTop: "1px solid #ced4da",
        }}
      >
        <InputMessage />
      </Box>
    </Stack>
  );
});

export default chatPanel;
