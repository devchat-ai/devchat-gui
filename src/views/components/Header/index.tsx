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
import { IconSettings, IconLanguage, IconMessages } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
// @ts-ignore
import SvgAvatarDevChat from "../MessageAvatar/avatar_devchat.svg";
import messageUtil from "@/util/MessageUtil";
import { useRouter } from "@/views/router";
import { useMst } from "@/views/stores/RootStore";

const useStyles = createStyles((theme) => ({
  logoName: {
    color: "var(--vscode-foreground)",
  },
}));

export default function Head() {
  const router = useRouter();
  const { classes } = useStyles();
  const { i18n } = useTranslation();
  const { config } = useMst();

  useEffect(() => {
    if (config.file.language && config.file.language.toLocaleLowerCase() === "en") {
      i18n.changeLanguage("en");
    } else {
      i18n.changeLanguage("zh");
    }
  }, []);

  const openSetting = () => {
    if (router.currentRoute === "config") {return;}
    router.updateRoute("config");
  };

  const openChat = () => {
    if (router.currentRoute === "chat") {return;}
    router.updateRoute("chat");
  };

  const switchLang = () => {
    const currentLang = i18n.language;
    const newLang = currentLang === "en" ? "zh" : "en";
    i18n.changeLanguage(newLang);

    config.setConfigValue("language", newLang);
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
            <ActionIcon
              size="sm"
              onClick={openChat}
              color={router.currentRoute === "chat" ? "merico" : "gray"}
              variant={router.currentRoute === "chat" ? "filled" : "subtle"}
            >
              <IconMessages size="1.125rem" />
            </ActionIcon>
          </div>
          <div>
            <ActionIcon
              size="sm"
              onClick={openSetting}
              color={router.currentRoute === "config" ? "merico" : "gray"}
              variant={router.currentRoute === "config" ? "filled" : "subtle"}
            >
              <IconSettings size="1.125rem" />
            </ActionIcon>
          </div>
          {/* <div>
            <ActionIcon size="sm" onClick={switchLang}>
              <IconLanguage size="1.125rem" />
            </ActionIcon>
          </div> */}
          <div>
            <BalanceTip />
          </div>
        </Flex>
      </Flex>
    </Header>
  );
}
