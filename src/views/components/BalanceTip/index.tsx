import React, { useEffect, useState } from "react";
import messageUtil from "@/util/MessageUtil";
import { IconWallet } from "@tabler/icons-react";
import {
  HoverCard,
  Text,
  ActionIcon,
  Group,
  LoadingOverlay,
} from "@mantine/core";
import { Trans } from "react-i18next";
import { useMst } from "@/views/stores/RootStore";
import APIUtil from "@/util/APIUtil";

const currencyMap = {
  USD: "$",
  RMB: "¥",
};

function formatBalance(balance: number) {
  return Math.round(balance * 1000) / 1000;
}

function formatCurrency(balance: number | null, currency: string) {
  if (balance === null || balance === undefined) {
    return "";
  }
  return `${currencyMap[currency] || currency}${balance}`;
}

const links = {
  dev: "https://webtest.devchat.ai",
  prod: "https://web.devchat.ai",
};

export default function WechatTip() {
  const { config } = useMst();
  const [balance, setBalance] = useState<null | number>(null);
  const [currency, setCurrency] = useState("USD");
  const [accessKey, setAccessKey] = useState("");
  const [env, setEnv] = useState("prod");

  const [loading, setLoading] = useState(false);
  const platform = process.env.platform;

  const getBalance = () => {
    APIUtil.getBalance().then(org => {
      setLoading(true);
      setBalance(formatBalance(org?.balance));
      setCurrency(org?.currency);
    }).finally(() => {
      setLoading(false);
    })
  };

  useEffect(() => {
    if (env && accessKey) {
      getBalance();
    }
  }, [env, accessKey]);

  useEffect(() => {
    const accessKey = config.getUserKey();
    const apibase = config.getAPIBase();
    if (accessKey) {
      if (apibase.includes("api-test.devchat.ai")) {
        setEnv("dev");
      } else {
        setEnv("prod");
      }
      setAccessKey(accessKey);
    }
  }, []);

  const openLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    messageUtil.sendMessage({
      command: "openLink",
      url: links[env],
    });
  };

  const formatedCurrency = formatCurrency(balance, currency);

  if (balance === null || balance === undefined) {
    return null;
  }

  return (
    <HoverCard
      shadow="lg"
      position="left"
      width="200"
      withArrow={true}
      styles={{
        arrow: {
          borderColor: "var(--vscode-menu-border)",
        },
      }}
      zIndex={99999}
    >
      <HoverCard.Target>
        <div onMouseEnter={getBalance}>
          <ActionIcon size="sm">
            <IconWallet size="1.125rem" />
          </ActionIcon>
        </div>
      </HoverCard.Target>
      <HoverCard.Dropdown
        sx={{
          color: "var(--vscode-foreground)",
          borderColor: "var(--vscode-menu-border)",
          backgroundColor: "var(--vscode-menu-background)",
        }}
      >
        <Group style={{ width: "90%" }}>
          <Text size="sm">
            <Trans i18nKey="balance" formatedCurrency={formatedCurrency}>
              Your remaining credit is {{ formatedCurrency }}. Sign in to{" "}
              {platform === "idea" ? (
                <Text td="underline" c="blue" onClick={(e) => openLink(e)}>
                  web.devchat.ai{" "}
                </Text>
              ) : (
                <a href={links[env]} target="_blank">
                  web.devchat.ai{" "}
                </a>
              )}
              to purchase more tokens.
            </Trans>
          </Text>
          <LoadingOverlay visible={loading} />
        </Group>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
