import { types, flow, Instance ,getParent} from "mobx-state-tree";
import messageUtil from "@/util/MessageUtil";
import { ChatContext } from "@/views/stores/InputStore";
import yaml from "js-yaml";
import { RootInstance } from "./RootStore";

interface Context {
  content: string;
  role: string;
}

interface Entry {
  hash: string;
  type: string;
  user: string;
  date: string;
  request: string;
  response: string;
  context: Context[];
}

interface LoadHistoryMessage {
  command: string;
  entries: Entry[];
}

export const fetchHistoryMessages = async (params) => {
  const { pageIndex } = params;
  return new Promise<{ pageIndex: number; entries: Entry[] }>(
    (resolve, reject) => {
      try {
        messageUtil.sendMessage({
          command: "historyMessages",
          page: pageIndex,
        });
        messageUtil.registerHandler(
          "loadHistoryMessages",
          (message: LoadHistoryMessage) => {
            resolve({
              pageIndex: pageIndex,
              entries: message.entries,
            });
          }
        );
      } catch (e) {
        reject(e);
      }
    }
  );
};

interface DevChatInstalledMessage {
  command: string;
  result: boolean;
}

export const deleteMessage = async (messageHash: string) => {
  return new Promise<{ hash: string }>((resolve, reject) => {
    try {
      messageUtil.sendMessage({
        command: "deleteChatMessage",
        hash: messageHash,
      });
      messageUtil.registerHandler("deletedChatMessage", (message) => {
        resolve({
          hash: message.hash,
        });
      });
    } catch (e) {
      reject(e);
    }
  });
};

export const Message = types.model({
  index: types.maybe(types.number),
  hash: types.maybe(types.string),
  type: types.enumeration(["user", "bot", "system"]),
  message: types.string,
  contexts: types.maybe(types.array(ChatContext)),
});

export const ChatStore = types
  .model("Chat", {
    generating: false,
    responsed: false,
    currentMessage: "",
    hasDone: false,
    errorMessage: "",
    messages: types.array(Message),
    pageIndex: 0,
    isLastPage: false,
    isBottom: true,
    isTop: false,
    scrollBottom: 0,
    chatModel: "GPT-3.5",
    chatPanelWidth: 300,
    disabled: false,
    rechargeSite: "https://web.devchat.ai/pricing/",
    features: types.optional(types.frozen(), {}),
    key: types.optional(types.string, ""),
  })
  .actions((self) => {
    const goScrollBottom = () => {
      self.scrollBottom++;
    };

    const helpWorkflowCommands = () =>{
      const rootStore = getParent<RootInstance>(self);

      return rootStore.input.commandMenus.map((item) => {
        if(item.name === "help"){
          return "";
        }
        return `<a class="workflow_command" href="${item.pattern}">/${item.name}: ${item.description}</a>`;
      }).join("\n\n");
    };

    const lastNonEmptyHash = () => {
      let lastNonEmptyHash;
      for (let i = self.messages.length - 1; i >= 0; i--) {
        if (self.messages[i].hash) {
          lastNonEmptyHash = self.messages[i].hash;
          break;
        }
      }
      return lastNonEmptyHash === "message" ? null : lastNonEmptyHash;
    };

    // Process and send the message to the extension
    const contextInfo = (chatContexts) =>
      chatContexts.map((item, index: number) => {
        const { file, path, content, command } = item;
        return {
          file,
          context: {
            path: path,
            command: command,
            content: content,
          },
        };
      });

    const helpMessage = (originalMessage = false) => {

      let helps = `
Do you want to write some code or have a question about the project? Simply right-click on your chosen files or code snippets and add them to DevChat. Feel free to ask me anything or let me help you with coding.
    
Don't forget to check out the "+" button on the left of the input to add more context. To see a list of workflows you can run in the context, just type "/". Happy prompting!

To get started, here are some of the things that I can do for you:

${helpWorkflowCommands()}`;

      const setKeyMessage = `
Devchat key is missing from your environment or settings. Kindly input your DevChat key, and I'll ensure DevChat is all set for you.

<button value="get_devchat_key" ${process.env.platform === "vscode" ?'href="https://web.devchat.ai" component="a"':''}>Register DevChat key</button>
<button value="setting_devchat_key">Set DevChat key</button>
`;

      const setKeyUser = `Is DevChat Access Key ready?`;

      if (self.key === "") {
        self.messages.push(
          Message.create({
            type: "user",
            message: setKeyUser,
          })
        );
        self.messages.push(
          Message.create({
            type: "bot",
            message: setKeyMessage,
          })
        );
      } else {
        self.messages.push(
          Message.create({
            type: "user",
            message: originalMessage ? "How do I use DevChat?" : "/help",
          })
        );
        self.messages.push(
          Message.create({
            type: "bot",
            message: helps,
          })
        );
      }

      // goto bottom
      goScrollBottom();
    };

    const startGenerating = (text: string, chatContexts) => {
      self.generating = true;
      self.responsed = false;
      self.hasDone = false;
      self.errorMessage = "";
      self.currentMessage = "";
      messageUtil.sendMessage({
        command: "sendMessage",
        text: text,
        contextInfo: contextInfo(chatContexts),
        parent_hash: lastNonEmptyHash(),
        model: self.chatModel,
      });
    };

    const sendLastUserMessage = () => {
      const lastUserMessage = self.messages[self.messages.length - 2];
      const lastBotMessage = self.messages[self.messages.length - 1];
      if (lastUserMessage && lastUserMessage.type === "user") {
        startGenerating(lastUserMessage.message, lastUserMessage.contexts);
      }
      self.disabled = false;
    };

    const cancelDevchatAsk = () => {
      const lastBotMessage = self.messages[self.messages.length - 1];
      if (lastBotMessage && lastBotMessage.type === "bot") {
        lastBotMessage.message =
          "You've cancelled the question. Please let me know if you have any other questions or if there's anything else I can assist with.";
      }
      self.disabled = false;
    };

    const commonMessage = (text: string, chatContexts) => {
      self.messages.push({
        type: "user",
        message: text,
        contexts: chatContexts,
      });
      self.messages.push({
        type: "bot",
        message: "",
      });
      // start generating
      startGenerating(text, chatContexts);
      // goto bottom
      goScrollBottom();
    };

    const userInput = (values: any) => {
      const inputStr = `
\`\`\`yaml type=chatmark-values
${yaml.dump(values)}
\`\`\`
`;
      self.currentMessage = `
${self.currentMessage}
${inputStr}
\`\`\`Step
Thinking...
\`\`\`
      `;
      messageUtil.sendMessage({
        command: "userInput",
        text: inputStr,
      });
      // goto bottom
      goScrollBottom();
    };

    return {
      helpMessage,
      sendLastUserMessage,
      cancelDevchatAsk,
      goScrollBottom,
      startGenerating,
      commonMessage,
      userInput,
      helpWorkflowCommands,
      devchatAsk: flow(function* (userMessage, chatContexts) {
        self.messages.push({
          type: "user",
          contexts: chatContexts,
          message: userMessage,
        });

        self.messages.push({
          type: "bot",
          message: "",
        });
        startGenerating(userMessage, chatContexts);

        // goto bottom
        goScrollBottom();
      }),
      updateChatPanelWidth: (width: number) => {
        self.chatPanelWidth = width;
      },
      changeChatModel: (chatModel: string) => {
        self.chatModel = chatModel;
      },
      updateFeatures: (features: any) => {
        self.features = features;
      },
      startSystemMessage: () => {
        self.generating = true;
        self.responsed = false;
        self.hasDone = false;
        self.errorMessage = "";
        self.currentMessage = "";
      },
      reGenerating: () => {
        self.generating = true;
        self.responsed = false;
        self.hasDone = false;
        self.errorMessage = "";
        self.currentMessage = "";
        messageUtil.sendMessage({
          command: "regeneration",
        });
      },
      stopGenerating: (
        hasDone: boolean,
        hash: string = "",
        message: string = ""
      ) => {
        self.generating = false;
        self.responsed = false;
        self.hasDone = hasDone;
        self.currentMessage = message;
        const messagesLength = self.messages.length;
        if (hasDone) {
          if (messagesLength > 1) {
            self.messages[messagesLength - 2].hash = hash;
            self.messages[messagesLength - 1].hash = hash;
          } else if (messagesLength > 0) {
            self.messages[messagesLength - 1].hash = hash;
          }
        } else {
          self.messages[messagesLength - 1].message = message;
        }
      },
      startResponsing: (message: string) => {
        self.responsed = true;
        self.currentMessage = message;
      },
      setKey: (key: string) => {
        self.key = key;
      },
      newMessage: (message: IMessage) => {
        self.messages.push(message);
      },
      addMessages: (messages: IMessage[]) => {
        self.messages.push(...messages);
      },
      updateLastMessage: (message: string) => {
        if (self.messages.length > 0) {
          self.messages[self.messages.length - 1].message = message;
        }
      },
      shiftMessage: () => {
        self.messages.splice(0, 1);
      },
      popMessage: () => {
        self.messages.pop();
      },
      clearMessages: () => {
        self.messages.length = 0;
      },
      happendError: (errorMessage: string) => {
        self.errorMessage = errorMessage;
      },
      onMessagesTop: () => {
        self.isTop = true;
        self.isBottom = false;
      },
      onMessagesBottom: () => {
        self.isTop = false;
        self.isBottom = true;
      },
      onMessagesMiddle: () => {
        self.isTop = false;
        self.isBottom = false;
      },
      reloadMessage: ({ entries, pageIndex, reset }) => {
        if (entries.length > 0) {
          self.pageIndex = pageIndex;
          const messages = entries
            .map((entry, index) => {
              const { hash, user, date, request, response, context } = entry;
              const chatContexts = context?.map(({ content }) => {
                return JSON.parse(content);
              });
              return [
                {
                  type: "user",
                  message: request,
                  contexts: chatContexts,
                  date: date,
                  hash: hash,
                },
                { type: "bot", message: response, date: date, hash: hash },
              ];
            })
            .flat();
          if (self.pageIndex === 0) {
            self.messages = messages;
          } else if (self.pageIndex > 0) {
            self.messages.concat(...messages);
          }
        } else {
          self.isLastPage = true;
          if (reset) {
            self.messages = [] as any;
            self.errorMessage = "";
          }
          if (self.messages.length === 0) {
            helpMessage(true);
          }
        }
      },
      fetchHistoryMessages: flow(function* (params: { pageIndex: number }) {
        const { pageIndex, entries } = yield fetchHistoryMessages(params);
        if (entries.length > 0) {
          self.pageIndex = pageIndex;
          const messages = entries
            .map((entry, index) => {
              const { hash, user, date, request, response, context } = entry;
              const chatContexts = context?.map(({ content }) => {
                return JSON.parse(content);
              });
              return [
                {
                  type: "user",
                  message: request,
                  contexts: chatContexts,
                  date: date,
                  hash: hash,
                },
                { type: "bot", message: response, date: date, hash: hash },
              ];
            })
            .flat();
          if (self.pageIndex === 0) {
            self.messages.push(...messages);
          } else if (self.pageIndex > 0) {
            self.messages.concat(...messages);
          }
        } else {
          self.isLastPage = true;
          if (self.messages.length === 0) {
            helpMessage(true);
          }
        }
      }),
      deleteMessage: flow(function* (messageHash: string) {
        const { hash } = yield deleteMessage(messageHash);
        const index = self.messages.findIndex(
          (item: any) => item.hash === hash
        );
        if (index > -1) {
          self.messages.splice(index);
        }
      }),
    };
  });

export type IMessage = Instance<typeof Message>;
