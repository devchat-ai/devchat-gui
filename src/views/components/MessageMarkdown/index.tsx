import { Button, Anchor, Stack, Group, Box, createStyles } from "@mantine/core";
import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Highlight, themes, Prism } from "prism-react-renderer";
import CodeButtons from "./CodeButtons";
import Step from "./Step";
import LanguageCorner from "./LanguageCorner";
import { observer } from "mobx-react-lite";
import { useMst } from "@/views/stores/RootStore";
import { Message } from "@/views/stores/ChatStore";
import messageUtil from "@/util/MessageUtil";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";
import ChatMark from "@/views/components/ChatMark";
import { useSetState } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { useRouter } from "@/views/router";
import remarkGfm from "remark-gfm";
import APIUtil from "@/util/APIUtil";
import { ASSISTANT_DISPLAY_NAME } from "@/util/constants";

(typeof global !== "undefined" ? global : window).Prism = Prism;
require("prismjs/components/prism-java");

const useStyles = createStyles((theme) => ({
  link: {
    "&:hover": {
      color: theme.colors.merico[6],
      textDecoration: "none",
    },
  },
  codeOverride: {
    code: {
      padding: "1px 0px !important",
    },
  },
}));
interface MessageMarkdownProps
  extends React.ComponentProps<typeof ReactMarkdown> {
  children: string | any;
  className: string;
  messageDone?: boolean;
  temp?: boolean;
  activeStep?: boolean;
}

type Step = {
  index: number;
  content: string;
  endsWithTripleBacktick: boolean;
};

function parseMetaData(string) {
  const regexp =
    /((?<k1>(?!=)\S+)=((?<v1>(["'`])(.*?)\5)|(?<v2>\S+)))|(?<k2>\S+)/g;
  const io = (string ?? "").matchAll(regexp);

  const resultMap = new Map(
    [...io]
      .map((item) => item?.groups)
      .map(({ k1, k2, v1, v2 }) => [k1 ?? k2, v1 ?? v2])
  );

  let props = {};
  for (let [key, value] of resultMap) {
    props[key] = value;
  }

  return props;
}

const MessageMarkdown = observer((props: MessageMarkdownProps) => {
  const { children, activeStep = false, messageDone } = props;
  const { config, chat } = useMst();
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([]);
  const tree = fromMarkdown(children);
  const codes = tree.children.filter((node) => node.type === "code");
  const lastNode = tree.children[tree.children.length - 1];
  const [chatmarkProps, setChatmarkProps] = useSetState({});
  const { classes } = useStyles();
  const { i18n, t } = useTranslation();
  const platform = process.env.platform;

  const handleButton = (
    value: string | number | readonly string[] | undefined
  ) => {
    switch (value) {
      case "settings":
        router.updateRoute("config");
        break;
      case "setting_openai_key":
        router.updateRoute("config");
        break;
      case "setting_devchat_key":
        router.updateRoute("config");
        break;
      case "get_devchat_key":
        window.open("https://web.devchat.ai");
        break;
    }
  };

  const openLink = (link) => {
    messageUtil.sendMessage({
      command: "openLink",
      url: link,
    });
  };

  const handleCodeCopy = (platform, language) => {
    const selection = window.getSelection()?.toString();
    console.log("Copied: ", selection);
    const e = 'manual_copy';
    APIUtil.createEvent({name: e, value: selection, language: language, ide: platform})
  }

  useEffect(() => {
    let previousNode: any = null;
    let chatmarkCount = 0;
    visit(tree, function (node) {
      if (node.type === "code") {
        // set meta data as props
        let props = {};
        if (node.lang === "chatmark" || node.lang === "ChatMark") {
          props["index"] = chatmarkCount;
          const metaData = parseMetaData(node.meta);
          setChatmarkProps({
            [`chatmark-${chatmarkCount}`]: {
              ...metaData,
            },
          });
        } else if (
          (node.lang === "yaml" || node.lang === "YAML") &&
          previousNode &&
          previousNode.type === "code" &&
          previousNode.lang === "chatmark"
        ) {
          setChatmarkProps({
            [`chatmark-${previousNode.data.hProperties.index}`]: {
              ...chatmarkProps[
                `chatmark-${previousNode.data.hProperties.index}`
              ],
              value: node.value,
            },
          });
        }
        node.data = {
          hProperties: {
            ...props,
          },
        };
        // record node and count data for next loop
        previousNode = node;
        if (node.lang === "chatmark" || node.lang === "ChatMark") {
          chatmarkCount++;
        }
      }
    });
  }, [children]);

  const trasnlateChildren = useMemo(() => {
    if (i18n && i18n.language === "zh") {
      // 目前只有中文需要单独翻译
      if (children) {
        if (
          children.includes(
            "Do you want to write some code or have a question about the project? "
          )
        ) {
          return t("devchat.help", {assistantName: t(ASSISTANT_DISPLAY_NAME)}) + chat.helpWorkflowCommands();
        }
        if (
          children.includes(
            "Your DevChat Access Key is not detected in the current settings."
          )
        ) {
          if (process.env.platform === "vscode") {
            return t("devchat.setkey_vscode", {assistantName: t(ASSISTANT_DISPLAY_NAME)});
          }
          return t("devchat.setkey", {assistantName: t(ASSISTANT_DISPLAY_NAME)});
        }
        if (
          children.includes(
            "DevChat intelligently navigates your codebase using GPT-4."
          )
        ) {
          return t("ask-code-explain", {assistantName: t(ASSISTANT_DISPLAY_NAME)});
        }
        if (
          children.includes(
            "Use this DevChat workflow to request code writing. Please input your specific requirement"
          )
        ) {
          return t("code-explain", {assistantName: t(ASSISTANT_DISPLAY_NAME)});
        }
        if (
          children.includes(
            "Generate a professionally written and formatted release note in markdown with this workflow. I just need some basic information"
          )
        ) {
          return t("note-explain");
        }
      }
    }
    return children;
  }, [children, i18n.language]);

  return (
    <ReactMarkdown
      {...props}
      transformImageUri={(uri) =>
        uri.startsWith("http")
          ? uri
          : `${process.env.REACT_APP_IMAGE_BASE_URL}${uri}`
      }
      remarkPlugins={[
        remarkGfm,
        () => (tree) => {
          let stepCount = 1;
          let chatmarkCount = 0;
          let previousNode: any = null;
          visit(tree, function (node) {
            if (node.type === "code") {
              // set meta data as props
              let props = {};
              if (node.lang === "step" || node.lang === "Step") {
                props["index"] = stepCount;
              } else if (node.lang === "chatmark" || node.lang === "ChatMark") {
                props["id"] = `chatmark-${chatmarkCount}`;
                props["index"] = chatmarkCount;
              } else if (
                (node.lang === "yaml" || node.lang === "YAML") &&
                previousNode &&
                previousNode.type === "code" &&
                previousNode.lang === "chatmark"
              ) {
                props["hidden"] = true;
              }
              node.data = {
                hProperties: {
                  ...props,
                },
              };
              // record node and count data for next loop
              previousNode = node;
              if (node.lang === "chatmark" || node.lang === "ChatMark") {
                chatmarkCount++;
              }
              if (node.lang === "step" || node.lang === "Step") {
                stepCount++;
              }
            }
          });
        },
      ]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code({ node, inline, className, children, index, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const value = String(children).replace(/\n$/, "");
          let language = match && match[1];

          if (!language) {
            language = "plaintext";
          }

          let wrapLongLines = false;
          if (language === "markdown" || language === "text") {
            wrapLongLines = true;
          }

          if (language === "step" || language === "Step") {
            const status =
              activeStep &&
              Number(index) === codes.length &&
              lastNode.type === "code"
                ? "running"
                : "done";
            return (
              <Step language={language} status={status} index={index}>
                {value}
              </Step>
            );
          }

          if (language === "chatmark" || language === "ChatMark") {
            const chatmarkValue = chatmarkProps[`chatmark-${index}`];
            return (
              <ChatMark messageDone={messageDone} {...chatmarkValue}>
                {value}
              </ChatMark>
            );
          }

          if ((language === "yaml" || language === "YAML") && props.hidden) {
            return <></>;
          }

          return !inline && language ? (
            <div
              style={{ position: "relative" }}
              className={classes.codeOverride}
            >
              <LanguageCorner language={language} />
              <CodeButtons platform={platform === "idea" ? "intellij" : platform} language={language} code={value} />
              {/* <SyntaxHighlighter
                {...props}
                language={lanugage}
                customStyle={{ padding: "35px 10px 10px 10px" }}
                style={okaidia}
                wrapLongLines={wrapLongLines}
                PreTag="div"
              >
                {value}
              </SyntaxHighlighter> */}
              <Highlight
                code={value}
                theme={themes.okaidia}
                language={language}
              >
                {({
                  className,
                  style,
                  tokens,
                  getLineProps,
                  getTokenProps,
                }) => (
                  <pre
                    className={className}
                    style={{
                      ...style,
                      padding: "35px 10px 10px 10px",
                      borderRadius: "5px",
                      overflowX: "auto",
                      whiteSpace: "pre",
                      ...props.style,
                    }}
                    onCopy={() => handleCodeCopy(platform, language)}
                    {...props}
                  >
                    {tokens.map((line, i) => (
                      <div {...getLineProps({ line, key: i })}>
                        {line.map((token, key) => (
                          <span {...getTokenProps({ token, key })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          ) : (
            <code {...props} className={className}>
              {children}
            </code>
          );
        },
        button({ node, className, children, value, ...props }) {
          return (
            <Button
              size="compact-xs"
              sx={{
                backgroundColor: "#ED6A45",
                fontFamily: "var(--vscode-editor-font-familyy)",
                fontSize: "var(--vscode-editor-font-size)",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#ED6A45",
                  opacity: 0.8,
                  color: "#fff",
                },
                "&:focus": {
                  backgroundColor: "#ED6A45",
                  opacity: 0.8,
                  color: "#fff",
                },
              }}
              styles={{
                root: {
                  marginBottom: 10,
                },
              }}
              onClick={() => {
                value === "get_devchat_key" && platform === "idea"
                  ? openLink("https://web.devchat.ai")
                  : handleButton(value);
              }}
              {...props}
            >
              {children}
            </Button>
          );
        },
        a({ node, className, children, href, ...props }) {
          return className === "workflow_command" ? (
            <Anchor
              className={classes.link}
              href="javascript:void()"
              onClick={() => {
                if (href) {
                  chat.commonMessage(`/${href}`, []);
                }
              }}
            >
              {children}
            </Anchor>
          ) : (
            <Anchor
              className={classes.link}
              href="javascript:void()"
              onClick={() => {
                if (href) {
                  messageUtil.sendMessage({
                    command: "openLink",
                    url: href,
                  });
                }
              }}
            >
              {children}
            </Anchor>
          );
        },
        img({ node, ...props }) {
          return <img {...props} style={{ width: "100%" }} />;
        },
      }}
    >
      {trasnlateChildren}
    </ReactMarkdown>
  );
});

export default MessageMarkdown;
