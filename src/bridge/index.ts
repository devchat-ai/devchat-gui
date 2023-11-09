const sendMessage = (message: string) => {
  const params = {
    action: "sendMessage/request",
    metadata: {
      callback: "getMessage",
    },
    payload: {
      context: "",
      message: message,
    },
  };
  window.JSJavaBridge.callJava(JSON.stringify(params));
};

export { sendMessage };
