import { useMst } from "@/views/stores/RootStore";
import React from "react";
import { observer } from "mobx-react-lite";
import { Alert } from "@mantine/core";
import { useTranslation, Trans } from "react-i18next";

interface IProps {
  messageIndex?: number;
}

const showTipArray = ["/unit_tests", "/pr", "/ask-code"];

const WorkflowTip = ({ messageIndex }: IProps) => {
  const { chat } = useMst();
  const { t } = useTranslation();
  if (
    messageIndex &&
    chat.messages[messageIndex - 1] &&
    chat.messages[messageIndex - 1]?.message?.startsWith("/") &&
    showTipArray.includes(chat.messages[messageIndex - 1]?.message) &&
    !chat.messages[messageIndex]?.message?.includes("操作指南")
  ) {
    const name = t(chat.messages[messageIndex - 1]?.message);
    return (
      <Alert
        color="orange"
        title="tip"
        sx={{
          "& .mantine-Alert-message": {
            color: "var(--vscode-editor-foreground)",
          },
        }}
      >
        <Trans i18nKey="workflowTip" name={name}>
          In essence, the text suggests that the {{ name }} adopts LLM design
          patterns that include Planning, Tool use, and Reflection to ensure
          high accuracy. However, it also notes that due to the in-depth
          processing required, response times may exceed <b>one minute</b>.
        </Trans>
      </Alert>
    );
  }
  return null;
};

export default observer(WorkflowTip);
