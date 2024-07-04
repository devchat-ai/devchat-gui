import axios from "axios";

interface ServiceResponse {
  result?: any;
  error?: string;
}

class IDEServiceUtil {
  private static instance: IDEServiceUtil;
  private host = "http://localhost";
  private port: number | undefined;


  constructor() {
    console.log("IDEServiceUtil ready");
  }

  public static getInstance(): IDEServiceUtil {
    if (!IDEServiceUtil.instance) {
      IDEServiceUtil.instance = new IDEServiceUtil();
    }
    return IDEServiceUtil.instance;
  }
  config(port: number) {
    console.log("Recieved IDEService port: ", port);
    this.port = port;
  }


  async getCurrentFileInfo() {
    try {
      if (!this.port) return undefined;
      const res = await axios.get(`${this.host}:${this.port}/current_file_info`)
      const info = res?.data?.result;
      console.log("currentFileInfo: ", info);
      return info;
    } catch(err) {
      console.error(err);
    }
  }

  async callService(serviceName: string, data: Record<string, any>): Promise<any> {
    console.log("callService: ", serviceName, data);
    try {
      const url = `${this.host}:${this.port}/${serviceName}`;
      console.log("callService url: ", url);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const headers = { 'Content-Type': 'application/json' };
  
      const response = await axios.post<ServiceResponse>(url, data, { headers });
      console.log("callService response: ", response);
  
      if (response.status !== 200) {
        console.log(`Server error: ${response.status}`);
        return undefined;
      }
  
      const responseData = response.data;
      if (responseData.error) {
        console.log(`Server returned error: ${responseData.error}`);
        return undefined;
      }
  
      return responseData.result;
    } catch (error) {
      console.error('Error calling service:', error);
      return undefined;
    }
  }
}


export default IDEServiceUtil.getInstance();
