import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

class APIUtil {
  private static instance: APIUtil;
  private baseUrl: string | undefined;
  private accessKey: string | undefined;
  private webappUrl: string | undefined;
  private currentMessageId: string | undefined;


  constructor() {
    console.log("APIUtil ready");
  }

  public static getInstance(): APIUtil {
    if (!APIUtil.instance) {
      APIUtil.instance = new APIUtil();
    }
    return APIUtil.instance;
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

  async createMessage(message: object, messageId?: string) {
    // 如果 messageId 为空，则使用 uuid 生成新的 ID
    var newMessageId = messageId || `msg-${uuidv4()}`;
    newMessageId = newMessageId || this.currentMessageId || '';
    try {
      if (!this.webappUrl) this.webappUrl = await this.fetchWebappUrl();
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

async createEvent(event: object, messageId?: string) {
  // 如果 messageId 为空，则使用当前的 messageId
  const idToUse = messageId || this.currentMessageId;
  
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
      return true; // 成功创建事件
    } catch(err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return false; // 遇到 404 错误，返回 false
      }
      console.error(err);
      return true; // 其他错误，不再重试
    }
  };

  if (!(await attemptCreate())) {
    // 如果第一次尝试失败且是 404 错误，等待 2 秒后重试
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