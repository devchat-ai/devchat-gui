import { Container, createStyles, Text } from "@mantine/core";
import React from "react";
import { observer } from "mobx-react-lite";
import MessageMarkdown from "@/views/components/MessageMarkdown";
import { useMst } from "@/views/stores/RootStore";
<<<<<<< HEAD
import { Trans, useTranslation } from "react-i18next";
=======
import { useTranslation } from "react-i18next";
>>>>>>> 36a272b (Update language translations and fix UI issues)

interface IProps {
  messageType: string;
  children: string;
  messageDone?: boolean;
<<<<<<< HEAD
  activeStep?: boolean;
=======
  temp?: boolean;
>>>>>>> 36a272b (Update language translations and fix UI issues)
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
<<<<<<< HEAD
  const { children, messageType, activeStep = false, messageDone } = props;
=======
  const { children, messageType, temp = false, messageDone } = props;
>>>>>>> 36a272b (Update language translations and fix UI issues)
  const { chat } = useMst();
  const { classes } = useStyles({
    chatPanelWidth: chat.chatPanelWidth,
  });
  const { t } = useTranslation();
<<<<<<< HEAD
  const transkey = trasnlateKey(children);
=======
>>>>>>> 36a272b (Update language translations and fix UI issues)

  return messageType === "bot" ? (
    <MessageMarkdown
      className={classes.bodyWidth}
<<<<<<< HEAD
      activeStep={activeStep}
=======
      temp={temp}
>>>>>>> 36a272b (Update language translations and fix UI issues)
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
<<<<<<< HEAD
      <pre className={classes.userContent}>{children}</pre>
=======
      <pre className={classes.userContent}>{t(children)}</pre>
>>>>>>> 36a272b (Update language translations and fix UI issues)
    </Container>
  );
});

export default MessageBody;
