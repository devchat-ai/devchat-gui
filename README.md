# devchat-gui

The unified webview UI of DevChat plugins.

## Parameterize packaging

### Step 1: Config the assistant names and logo file [Optional]

Custom assistant name and logo are supported, they can be configured in the `.env` file

~~~env
# Default to DevChat
REACT_APP_ASSISTANT_DISPLAY_NAME_EN=English name of the AI assistant
# Default to DevChat
REACT_APP_ASSISTANT_DISPLAY_NAME_ZH=Chinese name of the AI assistant
# Default to DevChat logo
REACT_APP_LOGO_FILE=/path/to/the/logo.svg
~~~

Notes:

1. The logo should be a `.svg` file;
2. Recommend size of the logo is `64x64`;


### Step 2: Build the UI for `VSCode` and `IntelliJ`

The `devchat-gui` repo is assumed to be a submodule of `devchat-vscode` and `devchat-intellij`. You need to build `devchat-gui` first before you build your plugins.

~~~bash
cd gui
yarn idea    # for intellij
yarn vscode  # for vscode
~~~