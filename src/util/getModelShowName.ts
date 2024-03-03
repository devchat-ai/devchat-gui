const nameMap = {
  "gpt-3.5-turbo": "GPT-3.5",
  "gpt-4": "GPT-4",
  "gpt-4-turbo-preview": "GPT-4-turbo",
  "claude-2.1": "CLAUDE-2.1",
  "xinghuo-3.5": "xinghuo-3.5",
  "GLM-4": "GLM-4",
  "ERNIE-Bot-4.0": "ERNIE-Bot-4.0",
  "togetherai/codellama/CodeLlama-70b-Instruct-hf": "CodeLlama-70b",
  "togetherai/mistralai/Mixtral-8x7B-Instruct-v0.1": "Mixtral-8x7B",
  "minimax/abab6-chat": "minimax-abab6",
  "llama-2-70b-chat": "llama2-70b",
};

export default function getModelShowName(modelName: string) {
  if (modelName in nameMap) {
    return nameMap[modelName];
  } else if (modelName.lastIndexOf("/") > -1) {
    return modelName
      .substring(modelName.lastIndexOf("/") + 1)
      .toLocaleUpperCase();
  } else {
    return modelName.toUpperCase();
  }
}
