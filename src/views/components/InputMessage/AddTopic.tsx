import React from "react";
import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import messageUtil from "@/util/MessageUtil";
import { useMst } from "@/views/stores/RootStore";

export default function Topic({ buttonStyles, disabled }) {
  const { chat } = useMst();
  const isVscode = process.env.platform === "vscode";

  const setNewTopic = () => {
    if (isVscode) {
      chat.reloadMessage({
        entries: [],
        pageIndex: 0,
        reset: true,
      });
    } else {
      messageUtil.sendMessage({
        command: "setNewTopic",
      });
    }
  };

  return (
    <Button
      variant="default"
      size="xs"
      radius="xl"
      leftIcon={<IconPlus size="1rem" />}
      styles={buttonStyles}
      onClick={setNewTopic}
      disabled={disabled}
    >
      New Topic
    </Button>
  );
}
