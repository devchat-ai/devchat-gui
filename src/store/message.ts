/* eslint-disable @typescript-eslint/no-explicit-any */
import { proxy } from "valtio";

export const messageStore = proxy<any>({
  list: [],
});

export const addMessage = (newMessage: any) => {
  // 检查是否存在具有相同消息和类型的项目
  const isDuplicate = messageStore.list.some(
    (item: any) =>
      item.message === newMessage.message && item.type === newMessage.type
  );

  if (!isDuplicate) {
    messageStore.list.push(newMessage);
  }
};
