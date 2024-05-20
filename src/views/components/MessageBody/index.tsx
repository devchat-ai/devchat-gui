import { Container, createStyles, Text } from "@mantine/core";
import React from "react";
import { observer } from "mobx-react-lite";
import MessageMarkdown from "@/views/components/MessageMarkdown";
import { useMst } from "@/views/stores/RootStore";
import { useTranslation } from "react-i18next";
import WorkflowTip from "./workflowTip";

interface IProps {
  messageType: string;
  children: string;
  messageDone?: boolean;
  activeStep?: boolean;
  temp?: boolean;
  messageIndex?: number;
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
  const {
    children,
    messageType,
    activeStep = false,
    temp = false,
    messageDone,
    messageIndex,
  } = props;
  const { chat } = useMst();
  const { classes } = useStyles({
    chatPanelWidth: chat.chatPanelWidth,
  });
  const { t } = useTranslation();

  return messageType === "bot" ? (
    <>
      <WorkflowTip messageIndex={messageIndex} />
      <MessageMarkdown
        className={classes.bodyWidth}
        activeStep={activeStep}
        temp={temp}
        messageDone={messageDone}
      >
        {children}
      </MessageMarkdown>
    </>
  ) : (
    <Container
      sx={{
        margin: 0,
        padding: 0,
        width: chat.chatPanelWidth - 20,
      }}
    >
      <pre className={classes.userContent}>{t(children, children)}</pre>
    </Container>
  );
});

export default MessageBody;
