const modelsTemplate = [
  {
    name: "gpt-3.5-turbo",
    provider: "devchat",
    stream: true,
    max_input_tokens: 13000,
  },
  {
    name: "gpt-4",
    provider: "devchat",
    stream: true,
    max_input_tokens: 6000,
  },
  {
    name: "gpt-4-turbo-preview",
    provider: "devchat",
    stream: true,
    max_input_tokens: 32000,
  },
  {
    name: "claude-3-opus",
    provider: "devchat",
    stream: true,
    max_input_tokens: 32000,
  },
  {
    name: "claude-3-sonnet",
    provider: "devchat",
    stream: true,
    max_input_tokens: 32000,
  },
  {
    name: "xinghuo-3.5",
    provider: "devchat",
    stream: true,
    max_input_tokens: 6000,
  },
  {
    name: "GLM-4",
    provider: "devchat",
    stream: true,
    max_input_tokens: 8000,
  },
  {
    name: "ERNIE-Bot-4.0",
    provider: "devchat",
    stream: true,
    max_input_tokens: 8000,
  },
  {
    name: "togetherai/codellama/CodeLlama-70b-Instruct-hf",
    provider: "devchat",
    stream: true,
    max_input_tokens: 4000,
  },
  {
    name: "togetherai/mistralai/Mixtral-8x7B-Instruct-v0.1",
    provider: "devchat",
    stream: true,
    max_input_tokens: 4000,
  },
  {
    name: "minimax/abab6-chat",
    provider: "devchat",
    stream: true,
    max_input_tokens: 4000,
  },
  {
    name: "llama-2-70b-chat",
    provider: "devchat",
    stream: true,
    max_input_tokens: 4000,
  },
];

export default modelsTemplate;
