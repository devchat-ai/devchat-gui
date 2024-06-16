import axios from "axios";

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
      const res = await axios.post(`${this.host}:${this.port}/current_file_info`)
      const info = res?.data?.result;
      console.log("currentFileInfo: ", info);
      return info;
    } catch(err) {
      console.error(err);
    }
  }
}


export default IDEServiceUtil.getInstance();
