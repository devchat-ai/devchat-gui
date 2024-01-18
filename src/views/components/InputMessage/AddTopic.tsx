import React from "react";
import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import messageUtil from "@/util/MessageUtil";

export default function Topic({ buttonStyles, disabled }) {
  const setNewTopic = () => {
    messageUtil.sendMessage({
      command: "setNewTopic",
    });
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
