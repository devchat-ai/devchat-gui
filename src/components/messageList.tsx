/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { messageStore, addMessage } from "@/store/message";
import { Divider } from "@mantine/core";

export default function MessageList() {
  const msgStore = useSnapshot(messageStore);

  useEffect(() => {
    window.getMessage = (message: string) => {
      const target: {
        payload: {
          message: string;
          promptHash: string;
        };
      } = JSON.parse(message);
      addMessage({
        message: target.payload.message,
        promptHash: target.payload.promptHash,
        type: "Devchat",
      });
    };

    // 组件卸载时移除绑定
    return () => {
      delete window.getMessage;
    };
  }, []);

  return (
    <div>
      {msgStore.list.map((item: any) => {
        return (
          <div>
            <div>{item.type}</div>
            <div>{item.message}</div>
            <Divider />
          </div>
        );
      })}
    </div>
  );
}
