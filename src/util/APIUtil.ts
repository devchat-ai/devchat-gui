import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import IDEServiceUtil from "./IDEServiceUtil";

interface EventData {
  ide: string | undefined;
  [key: string]: any;  // For other potential properties
}
interface MessageData {
  ide: string | undefined;
  [key: string]: any;  // For other potential properties
}

class APIUtil {
  private static instance: APIUtil;
  private baseUrl: string | undefined;
  private accessKey: string | undefined;
  private webappUrl: string | undefined;
  private currentMessageId: string | undefined;
  private extensionVersion: string | undefined;


  constructor() {
    console.log("APIUtil ready");
  }

  public static getInstance(): APIUtil {
    if (!APIUtil.instance) {
      APIUtil.instance = new APIUtil();
    }
    return APIUtil.instance;
  }

  async getExtensionVersion(): Promise<string | undefined> {
    if (this.extensionVersion) {
      return this.extensionVersion;
    }

    try {
      const version = await IDEServiceUtil.callService("get_extension_version", {});
      this.extensionVersion = version || "unknown";
      return this.extensionVersion;
    } catch (err) {
      console.error("Failed to get extension version:", err);
      return "unknown";
    }
  }
  
  async fetchWebappUrl() {
    try {
      const res = await axios.get(
        `${this.baseUrl}/addresses/webapp`,
        { headers: { 'Authorization': `Bearer ${this.accessKey}` }}
      )
      const urlOrPath = res?.data;
      if (!urlOrPath) {
        throw new Error("No webapp url found");
      }
      let href = "";
      if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
        href = urlOrPath;
      } else {
        href = new URL(urlOrPath, this.baseUrl).href
      }
      if (href.endsWith('/')) {
        href = href.slice(0, -1);
      }
      if (href.endsWith('/api')) {
        href = href.slice(0, -4);
      }
      console.log('Webapp url: ', href)
      return href;
    } catch (err) {
      throw(`Error fetch webapp url: ${err}`)
    }
  }

  config(baseUrl: string, accessKey: string) {
    this.baseUrl = baseUrl;
    this.accessKey = accessKey;
    this.fetchWebappUrl().then(url => {
      this.webappUrl = url;
    }).catch(err => {
      console.error(err);
    })
  }

  updateCurrentMessageId() {
    this.currentMessageId = `msg-${uuidv4()}`;
    return this.currentMessageId;
  }
  
  getCurrentMessageId() {
    return this.currentMessageId;
  }

  async createMessage(message: MessageData, messageId?: string) {
    // 如果 messageId 为空，则使用 uuid 生成新的 ID
    var newMessageId = messageId || `msg-${uuidv4()}`;
    newMessageId = newMessageId || this.currentMessageId || '';
    
    try {
      if (!this.webappUrl) this.webappUrl = await this.fetchWebappUrl();
      
      // 获取版本号并更新ide字段
      const version = await this.getExtensionVersion() || "unknown";
      message.ide = `${message.ide}[${version}]`;

      const res = await axios.post(
        `${this.webappUrl}/api/v1/messages`,
        {...message, message_id: newMessageId},
        { headers: { 
          Authorization: `Bearer ${this.accessKey}`,
          'Content-Type': 'application/json',
        }}
      );
      console.log("Message created: ", res?.data);
    } catch(err) {
      console.error(err);
    }
  }
  async createEvent(event: EventData, messageId?: string) {
    // 如果 messageId 为空，则使用当前的 messageId
    const idToUse = messageId || this.currentMessageId;
    
    // 获取版本号
    const version = await this.getExtensionVersion() || "unknow";
    // 更新event.ide, 添加version信息。
    // 原来值为vscode,修改后值为vscode[0.1.96]
    event.ide = `${event.ide}[${version}]`;
    const attemptCreate = async () => {
      try {
        if (!this.webappUrl) this.webappUrl = await this.fetchWebappUrl();
        const res = await axios.post(
          `${this.webappUrl}/api/v1/messages/${idToUse}/events`,
          event,
          {headers: {
            Authorization: `Bearer ${this.accessKey}`,
            'Content-Type': 'application/json',
          }}
        );
        console.log("Event created: ", res?.data);
        return true;
      } catch(err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return false;
        }
        console.error(err);
        return true;
      }
    };

    if (!(await attemptCreate())) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await attemptCreate();
    }
  }

  async getBalance() {
    try {
      if (!this.webappUrl) this.webappUrl = await this.fetchWebappUrl();
      const res = await axios.get(
        `${this.webappUrl}/api/v1/users/profile`,
        {headers: { Authorization: `Bearer ${this.accessKey}` }}
      )
      return res?.data?.organization
    } catch(err) {
      console.error(err);
      return null;
    }
  }
}


export default APIUtil.getInstance();