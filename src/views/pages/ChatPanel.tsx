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

const chatPanel = observer(() => {
  const { input, chat } = useMst();

  const [chatContainerRef, chatContainerRect] = useResizeObserver();
  const scrollViewport = useRef<HTMLDivElement>(null);
  const { height } = useViewportSize();
  const { ref: inputAreatRef, height: inputAreaHeight } = useElementSize();

  const chatPanelWidth = chatContainerRect.width;

  const scrollToBottom = () =>
    scrollViewport?.current?.scrollTo({
      top: scrollViewport.current.scrollHeight,
      behavior: "smooth",
    });

  const getSettings = () => {
    messageUtil.sendMessage({
      command: "getSetting",
      key1: "devchat",
      key2: "defaultModel",
    });
    messageUtil.sendMessage({
      command: "getUserAccessKey",
    });
  };

  const getFeatureToggles = () => {
    messageUtil.sendMessage({
      command: "featureToggles",
    });
  };

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
    // console.log(`sh:${sh},vh:${vh},x:${x},y:${y},gap:${gap}`);
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
    // Fetch the command menus, before history records are obtained,
    // because the display information in the history record requires adjustment
    input.fetchCommandMenus().then(() => {
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
      // The history records need to be obtained after setting the key,
      // as the display information in the history record requires adjustment
      // based on whether the key is present.
      messageUtil.registerHandler("getUserAccessKey", (message: any) => {
        chat.setKey(message.accessKey);
        chat.fetchHistoryMessages({ pageIndex: 0 }).then();
      });
      // The history records need to be obtained after setting the key,
      input.fetchContextMenus().then();
      input.fetchModelMenus().then();
      getFeatureToggles();
      getSettings();
    });
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
    messageUtil.registerHandler(
      "getSetting",
      (message: { value: string; key2: string }) => {
        console.log("message: ", message);
        if (message.key2 === "defaultModel") {
          chat.changeChatModel(message.value);
        }
      }
    );
    messageUtil.registerHandler(
      "featureToggles",
      (message: { features: object }) => {
        // chat.changeChatModel(message.value);
        chat.updateFeatures(message.features);
      }
    );

    timer.start();
    return () => {
      timer.clear();
    };
  }, []);

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
