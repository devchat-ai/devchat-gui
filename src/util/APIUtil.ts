import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

class APIUtil {
  private static instance: APIUtil;
  private currentMessageId: string | undefined;


  constructor() {
    console.log("APIUtil");
  }

  public static getInstance(): APIUtil {
    if (!APIUtil.instance) {
      APIUtil.instance = new APIUtil();
    }
    return APIUtil.instance;
  }

  async createMessage(baseUrl: string, accessKey: string, message: object) {
    this.currentMessageId = `msg-${uuidv4()}`;
    try {
      const res = await axios.post(
        `${baseUrl}/api/v1/messages`,
        {...message, message_id: this.currentMessageId},
        { headers: { 
          Authorization: `Bearer ${accessKey}`,
          'Content-Type': 'application/json',
        }}
      )
      console.log("Message created: ", res?.data);
    } catch(err) {
      console.error(err);
    }
  }

  async createEvent(baseUrl: string, accessKey: string, event: object) {
    try {
      const res = await axios.post(
        `${baseUrl}/api/v1/messages/${this.currentMessageId}/events`,
        event,
        {headers: {
          Authorization: `Bearer ${accessKey}`,
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
