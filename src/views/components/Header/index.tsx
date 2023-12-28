import React, { useEffect } from "react";
import {
  Header,
  Avatar,
  Flex,
  Text,
  ActionIcon,
  createStyles,
} from "@mantine/core";
import BalanceTip from "@/views/components/BalanceTip";
import { IconSettings, IconLanguage } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
// @ts-ignore
import SvgAvatarDevChat from "../MessageAvatar/avatar_devchat.svg";
import messageUtil from "@/util/MessageUtil";

const useStyles = createStyles((theme) => ({
  logoName: {
    color: "var(--vscode-foreground)",
  },
}));

export default function Head() {
  const { classes } = useStyles();
  const { i18n } = useTranslation();

  useEffect(() => {
    messageUtil.sendMessage({
      command: "getSetting",
      key1: "DevChat",
      key2: "Language",
    });
    messageUtil.registerHandler(
      "getSetting",
      (data: { key2: string; value: string }) => {
        if (data.key2 === "Language") {
          if (data.value && data.value.toLocaleLowerCase() === "en") {
            i18n.changeLanguage("en");
          } else {
            i18n.changeLanguage("zh");
          }
        }
      }
    );
  }, []);

  const openSetting = () => {
    messageUtil.sendMessage({
      command: "doCommand",
      content: ["workbench.action.openSettings", "DevChat"],
    });
  };

  const switchLang = () => {
    const currentLang = i18n.language;
    const newLang = currentLang === "en" ? "zh" : "en";
    i18n.changeLanguage(newLang);

    messageUtil.sendMessage({
      command: "updateSetting",
      key1: "DevChat",
      key2: "Language",
      value: newLang,
    });
  };

  return (
    <Header
      height={40}
      style={{
        backgroundColor: "var(--vscode-sideBar-background)",
        borderBottom: "1px solid #ced4da",
      }}
    >
      <Flex justify="space-between" align="center" sx={{ padding: "0 10px" }}>
        <Flex
          gap="sm"
          justify="flex-start"
          align="center"
          style={{
            height: 40,
          }}
        >
          <Avatar color="indigo" size={25} radius="xl" src={SvgAvatarDevChat} />
          <Text weight="bold" className={classes.logoName}>
            DevChat
          </Text>
        </Flex>
        <Flex align="center" gap="xs" sx={{ paddingRight: 10 }}>
          <div>
            <BalanceTip />
          </div>
          <div>
            <ActionIcon size="sm" onClick={openSetting}>
              <IconSettings size="1.125rem" />
            </ActionIcon>
          </div>
          <div>
            <ActionIcon size="sm" onClick={switchLang}>
              <IconLanguage size="1.125rem" />
            </ActionIcon>
          </div>
        </Flex>
      </Flex>
    </Header>
  );
}
