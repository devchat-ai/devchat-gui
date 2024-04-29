import React, { useEffect, useState } from "react";
import axios from "axios";
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

const envMap = {
  dev: {
    requestUrl: "https://apptest.devchat.ai",
    link: "https://webtest.devchat.ai",
  },
  prod: {
    requestUrl: "https://app.devchat.ai",
    link: "https://web.devchat.ai",
  },
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
    if (!envMap[env].requestUrl || !accessKey) {
      return;
    }
    setLoading(true);
    axios
      .get(`${envMap[env].requestUrl}/api/v1/users/profile`, {
        headers: { Authorization: `Bearer ${accessKey}` },
      })
      .then((res) => {
        if (res?.data?.organization?.balance) {
          setBalance(formatBalance(res?.data?.organization?.balance));
          setCurrency(res?.data?.organization?.currency);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (env && accessKey) {
      getBalance();
    }
  }, [env, accessKey]);

  useEffect(() => {
    const provider = config.getProvider();
    if (provider.apiKey) {
      if (provider.apiBase.includes("api-test.devchat.ai")) {
        setEnv("dev");
      } else {
        setEnv("prod");
      }
      setAccessKey(provider.apiKey);
    }
  }, []);

  const openLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    messageUtil.sendMessage({
      command: "openLink",
      url: envMap[env].link,
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
                <a href={envMap[env].link} target="_blank">
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
