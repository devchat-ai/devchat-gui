import React, { useEffect, useState } from "react";
import {
  ActionIcon,
  Drawer,
  Text,
  Box,
  Flex,
  Divider,
  LoadingOverlay,
} from "@mantine/core";
import {
  IconClock,
  IconChevronDown,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import messageUtil from "@/util/MessageUtil";
import dayjs from "dayjs";

export default function Topic({ styleName, disabled }) {
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [topicList, setTopicList] = useState<any>([]);

  useEffect(() => {
    messageUtil.registerHandler("listTopics", ({ list }: { list: any }) => {
      setTopicList(list);
      setLoading(false);
    });
    messageUtil.registerHandler(
      "getTopics",
      (detail: { topicEntries: any }) => {
        setTopicList(detail.topicEntries?.reverse());
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (drawerOpened) {
      refreshTopicList();
    }
  }, [drawerOpened]);

  const showTopic = (root_prompt: any) => {
    closeDrawer();
    // messageUtil.sendMessage({
    //   command: "getTopicDetail",
    //   topicHash: root_prompt.hash,
    // });
    messageUtil.sendMessage({
      command: "historyMessages",
      topicId: root_prompt.hash,
    });
  };

  const refreshTopicList = () => {
    setLoading(true);
    messageUtil.sendMessage({
      // new getTopics
      // old listTopics
      command: "getTopics",
    });
  };

  const deleteTopic = (topicHash: string) => {
    const newTopicList = topicList.filter(
      (topic) => topic.root_prompt.hash !== topicHash
    );
    setTopicList(newTopicList);
    messageUtil.sendMessage({
      command: "deleteTopic",
      topicId: topicHash,
      topicHash: topicHash,
    });
  };

  return (
    <>
      <Drawer
        opened={drawerOpened}
        position="bottom"
        title={
          <Flex justify="space-between">
            <Text>DevChat Topics</Text>
            <Flex>
              <ActionIcon onClick={refreshTopicList}>
                <IconRefresh size="1rem" />
              </ActionIcon>
            </Flex>
          </Flex>
        }
        onClose={closeDrawer}
        overlayProps={{ opacity: 0.5, blur: 4 }}
        closeButtonProps={{ children: <IconChevronDown size="1rem" /> }}
        styles={{
          content: {
            background: "var(--vscode-sideBar-background)",
            color: "var(--vscode-editor-foreground)",
            overflowY: "auto",
          },
          header: {
            background: "var(--vscode-sideBar-background)",
            color: "var(--vscode-editor-foreground)",
          },
          title: {
            flex: 1,
          },
        }}
      >
        <Box>
          {topicList.map((item: any, index) => (
            <Box>
              <Flex sx={{ width: "100%" }} gap="sm">
                <Box
                  sx={{
                    cursor: "pointer",
                    flex: 1,
                    overflow: "hidden",
                  }}
                  onClick={() => showTopic(item?.root_prompt)}
                >
                  <Flex justify="space-between" gap="sm">
                    <Text
                      fz="sm"
                      fw={700}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: 1,
                      }}
                    >
                      {item?.root_prompt.request}
                    </Text>
                    <Text
                      fz="sm"
                      c="dimmed"
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {dayjs(item?.latest_time * 1000).format("MM-DD HH:mm:ss")}
                    </Text>
                  </Flex>

                  <Text
                    c="dimmed"
                    fz="sm"
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {Array.isArray(item?.root_prompt.responses)
                      ? item?.root_prompt.responses?.[0]
                      : item?.root_prompt.response}
                  </Text>
                </Box>
                <Flex align="center">
                  <ActionIcon
                    onClick={() => {
                      deleteTopic(item?.root_prompt.hash);
                    }}
                  >
                    <IconTrash size="1rem" />
                  </ActionIcon>
                </Flex>
              </Flex>
              {index !== topicList.length - 1 && (
                <Divider variant="solid" my={6} opacity="0.5" />
              )}
            </Box>
          ))}
        </Box>
      </Drawer>
      <ActionIcon
        className={styleName}
        disabled={disabled}
        radius="xl"
        variant="default"
        onClick={openDrawer}
      >
        <IconClock size="1rem" />
      </ActionIcon>
      <LoadingOverlay
        style={{
          height: "380px",
          inset: "auto",
          bottom: "0",
          left: "0",
          right: "0",
          position: "fixed",
        }}
        visible={loading}
        overlayBlur={3}
        overlayOpacity={0}
        keepMounted={true}
      />
    </>
  );
}
