import { types, flow, Instance, getParent } from "mobx-state-tree";
import messageUtil from "@/util/MessageUtil";
import { RootInstance } from "./RootStore";

export interface Item {
  name: string;
  pattern: string;
  description: string;
  recommend: number;
}

const regContextMenus = async () => {
  return new Promise<Item[]>((resolve, reject) => {
    try {
      messageUtil.sendMessage({ command: "regContextList" });
      messageUtil.registerHandler(
        "regContextList",
        (message: { result: Item[] }) => {
          resolve(message.result);
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

export const ChatContext = types.model({
  file: types.maybe(types.string),
  path: types.maybe(types.string),
  command: types.maybe(types.string),
  content: types.string,
});

export const MenuItem = types.model({
  icon: types.maybe(types.string),
  name: types.string,
  pattern: types.maybe(types.string),
  description: types.string,
  recommend: types.number,
});

export const ContextMenuItem = types.model({
  icon: types.maybe(types.string),
  name: types.string,
  pattern: types.maybe(types.string),
  description: types.string,
});

export const InputStore = types
  .model("Input", {
    value: "",
    contexts: types.array(ChatContext),
    menuType: "contexts",
    menuOpend: false,
    currentMenuIndex: 0,
    commandMenus: types.array(MenuItem),
    contextMenus: types.array(ContextMenuItem)
  })
  .actions((self) => ({
    setValue(value: string) {
      self.value = value;
    },
    removeContext(index: number) {
      self.contexts.splice(index, 1);
    },
    clearContexts() {
      self.contexts.clear();
    },
    setContexts(contexts: IChatContext[]) {
      self.contexts.clear();
      contexts?.forEach((context) => {
        self.contexts.push({ ...context });
      });
    },
    newContext(context: IChatContext) {
      self.contexts.push(context);
    },
    openMenu(menuType: string) {
      self.menuOpend = true;
      self.menuType = menuType;
    },
    closeMenu() {
      self.menuOpend = false;
      self.menuType = "";
    },
    setCurrentMenuIndex(index: number) {
      self.currentMenuIndex = index;
    },
    fetchContextMenus: flow(function* () {
      try {
        const items = yield regContextMenus();
        self.contextMenus.push(...items);
      } catch (error) {}
    }),
    fetchCommandMenus: (items: Item[]) => {
      self.commandMenus.clear();
      self.commandMenus.push(...items);
      self.commandMenus.push({
        name: "help",
        description: "View the DevChat documentation.",
        pattern: "help",
        recommend: -1,
      });
    },
  }));

export type IInputStore = Instance<typeof InputStore>;
export type IChatContext = Instance<typeof ChatContext>;
