import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

class APIUtil {
  private static instance: APIUtil;
  private baseUrl: string | undefined;
  private accessKey: string | undefined;
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

  config(baseUrl: string, accessKey: string) {
    this.baseUrl = baseUrl;
    this.accessKey = accessKey;
  }

  async createMessage(message: object) {
    this.currentMessageId = `msg-${uuidv4()}`;
    try {
      const res = await axios.post(
        `${this.baseUrl}/api/v1/messages`,
        {...message, message_id: this.currentMessageId},
        { headers: { 
          Authorization: `Bearer ${this.accessKey}`,
          'Content-Type': 'application/json',
        }}
      )
      console.log("Message created: ", res?.data);
    } catch(err) {
      console.error(err);
    }
  }

  async createEvent(event: object) {
    try {
      const res = await axios.post(
        `${this.baseUrl}/api/v1/messages/${this.currentMessageId}/events`,
        event,
        {headers: {
          Authorization: `Bearer ${this.accessKey}`,
          'Content-Type': 'application/json',
        }}
      )
      console.log("Event created: ", res?.data);
    } catch(err) {
      console.error(err);
    }
  }
}

export default APIUtil.getInstance();
