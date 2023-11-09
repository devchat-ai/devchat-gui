import { Input, ActionIcon } from "@mantine/core";
import { sendMessage } from "@/bridge";
import { IconSend } from "@tabler/icons-react";
import { useInputState } from "@mantine/hooks";
import { useSnapshot } from "valtio";
import { messageStore, addMessage } from "@/store/message";

export default function SendMessageInput() {
  const [stringValue, setStringValue] = useInputState("");
  useSnapshot(messageStore);

  const handleClick = () => {
    sendMessage(stringValue);
    addMessage({
      message: stringValue,
      promptHash: "user",
      type: "user",
    });
    setStringValue("");
  };

  return (
    <div>
      <Input
        rightSectionPointerEvents="all"
        value={stringValue}
        onChange={setStringValue}
        rightSection={
          <ActionIcon onClick={handleClick}>
            <IconSend />
          </ActionIcon>
        }
      />
    </div>
  );
}
