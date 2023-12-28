import { Container, createStyles, Text } from "@mantine/core";
import React from "react";
import { observer } from "mobx-react-lite";
import MessageMarkdown from "@/views/components/MessageMarkdown";
import { useMst } from "@/views/stores/RootStore";
import { Trans, useTranslation } from "react-i18next";

interface IProps {
  messageType: string;
  children: string;
  messageDone?: boolean;
  activeStep?: boolean;
}

const useStyles = createStyles((theme, options: any) => ({
  bodyWidth: {
    width: options.chatPanelWidth - 20,
  },
  userContent: {
    fontFamily: theme.fontFamily,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
}));

const trasnlateKey = (children: string) => {
  if (children && children.includes("You can configure DevChat from")) {
    return "devchat.help";
  }
  return "";
};

const MessageBody = observer((props: IProps) => {
  const { children, messageType, activeStep = false, messageDone } = props;
  const { chat } = useMst();
  const { classes } = useStyles({
    chatPanelWidth: chat.chatPanelWidth,
  });
  const { t } = useTranslation();
  const transkey = trasnlateKey(children);

  return messageType === "bot" ? (
    <MessageMarkdown
      className={classes.bodyWidth}
      activeStep={activeStep}
      messageDone={messageDone}
    >
      {children}
    </MessageMarkdown>
  ) : (
    <Container
      sx={{
        margin: 0,
        padding: 0,
        width: chat.chatPanelWidth - 20,
      }}
    >
      <pre className={classes.userContent}>{children}</pre>
    </Container>
  );
});

export default MessageBody;
