import IdeaBridge from "./ideaBridge";

class MessageUtil {
  private static instance: MessageUtil;

  handlers: { [x: string]: any };
  vscodeApi: any;
  messageListener: any;

  constructor() {
    this.handlers = {};
    this.messageListener = null;
    if (process.env.platform === "vscode") {
      this.vscodeApi = window.acquireVsCodeApi();
    }

    if (!this.messageListener) {
      this.messageListener = (event: { data: any }) => {
        const message = event.data;
        this.handleMessage(message);
      };
      window.addEventListener("message", this.messageListener);
    } else {
      console.log("Message listener has already been bound.");
    }
  }

  public static getInstance(): MessageUtil {
    if (!MessageUtil.instance) {
      MessageUtil.instance = new MessageUtil();
    }
    return MessageUtil.instance;
  }

  // Register a message handler for a specific message type
  registerHandler(messageType: string, handler: any) {
    if (process.env.platform === "idea") {
      IdeaBridge.registerHandler(messageType, handler);
    } else {
      if (!this.handlers[messageType]) {
        this.handlers[messageType] = [];
      }
      this.handlers[messageType].push(handler);
    }
  }

  // Unregister a message handler for a specific message type
  unregisterHandler(messageType: string | number, handler: any) {
    if (this.handlers[messageType]) {
      this.handlers[messageType] = this.handlers[messageType].filter(
        (h: any) => h !== handler
      );
    }
  }

  // Handle a received message
  handleMessage(message: { command: string | number } & Record<string, any>) {
    if (!('command' in message)) {
      throw new Error('Missing required field: command');
    }
  
    const handlers = this.handlers[message.command];
    if (handlers) {
      handlers.forEach((handler: (arg0: { command: string | number } & Record<string, any>) => any) =>
        handler(message)
      );
    }
  }

  // Send a message to the VSCode API
  sendMessage(message: any) {
    if (process.env.platform === "idea") {
      IdeaBridge.sendMessage(message);
    } else {
      this.vscodeApi.postMessage(message);
    }
  }
}

// Export the MessageUtil class as a module
export default MessageUtil.getInstance();
