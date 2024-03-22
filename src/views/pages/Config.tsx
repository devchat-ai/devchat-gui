import React, { useEffect, useState } from "react";
import {
  Title,
  Box,
  TextInput,
  Tabs,
  PasswordInput,
  Radio,
  Group,
  Stack,
  Select,
  Button,
  Drawer,
  NumberInput,
  LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRouter } from "@/views/router";
import MessageUtil from "@/util/MessageUtil";
import { useMst } from "@/views/stores/RootStore";
import getModelShowName from "@/util/getModelShowName";
import isEqual from "lodash.isequal";
import cloneDeep from "lodash.clonedeep";
import { useTranslation } from "react-i18next";
import { useDisclosure } from "@mantine/hooks";
import { observer } from "mobx-react-lite";

const commonInputStyle = {
  label: {
    color: "var(--vscode-editor-foreground)",
    fontSize: "var(--vscode-editor-font-size)",
  },
  input: {
    fontSize: "var(--vscode-editor-font-size)",
    backgroundColor: "var(--vscode-sideBar-background)",
    borderColor: "var(--vscode-editor-foreground)",
    color: "var(--vscode-editor-foreground)",
    "&[data-disabled]": {
      color: "var(--vscode-disabledForeground)",
    },
  },
  dropdown: {
    backgroundColor: "var(--vscode-sideBar-background)",
    borderColor: "var(--vscode-input-border)",
  },
};

const selectStyle = {
  dropdown: {
    backgroundColor: "var(--vscode-sideBar-background)",
    borderColor: "var(--vscode-input-border)",
  },
  item: {
    color: "var(--vscode-editor-foreground)",
    "&:hover,&[data-hovered=true], &[data-selected=true], &[data-selected=true]:hover":
      {
        color: "var(--vscode-editor-foreground)",
        borderColor: "var(--vscode-commandCenter-border)",
        backgroundColor: "var(--vscode-commandCenter-activeBackground)",
      },
  },
};

const Config = function () {
  const [loading, { open: startLoading, close: closeLoading }] =
    useDisclosure(false);
  const { config } = useMst();
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const form = useForm({
    initialValues: {
      providers: {},
      models: {},
      ...cloneDeep(config.config),
    },
    validate: {
      providers: {
        devchat: {
          // api_key: (value) =>
          //   value.length > 0 ? null : "Please enter access key",
          api_base: (value) =>
            value.length > 0 ? null : "Please enter api base",
        },
      },
    },
  });

  const [models, setModels] = useState<any[]>([]);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    MessageUtil.registerHandler("updateSetting", (data) => {
      // 保存后的回调
      MessageUtil.sendMessage({ command: "readConfig" });
    });
    if (router.currentRoute !== "config") return;
    const modelName = config.getModelList();

    const modelArray = modelName.map((item) => ({
      value: item,
      label: getModelShowName(item),
    }));
    setModels(modelArray);
    setCurrent(modelArray[0].value);
  }, [router.currentRoute]);

  useEffect(() => {
    if (router.currentRoute !== "config") return;
    const cloneConfig = cloneDeep(config.config);
    form.setValues(cloneConfig);
    if (config.settle && loading) {
      setTimeout(() => {
        router.updateRoute("chat");
        closeLoading();
      }, 1000);
    }
  }, [config.settle]);

  const onSave = (values) => {
    config.updateSettle(false);
    startLoading();
    MessageUtil.sendMessage({
      command: "writeConfig",
      value: values,
      key: "",
    });
    MessageUtil.sendMessage({ command: "readConfig", key: "" });
  };

  const changeModelDetail = (key: string, value: number | string) => {
    const newModel = { ...form.values.models[current], [key]: value };
    form.setFieldValue("models", {
      ...form.values.models,
      [current]: newModel,
    });
  };

  const languageChange = (value: string) => {
    i18n.changeLanguage(value);
    form.setFieldValue("language", value);
  };

  const disabledSubmit = isEqual(form.values, config.config);

  return (
    <Drawer
      opened={router.currentRoute === "config"}
      onClose={() => {
        router.updateRoute("chat");
      }}
      position="right"
      size="100%"
      transitionProps={{
        duration: 0,
      }}
      sx={{
        height: "100%",
        "& .mantine-Paper-root": {
          color: "var(--vscode-editor-foreground)",
          background: "var(--vscode-sideBar-background)",
        },
        "& .mantine-Drawer-inner": {
          top: 40,
          paddingBottom: 57,
        },
        "& section": {
          flex: 1,
        },
      }}
      withCloseButton={false}
      withOverlay={false}
    >
      <LoadingOverlay visible={loading} overlayBlur={2} />
      <Title order={2} mb={20}>
        {t("Config")}
      </Title>
      <form
        onSubmit={form.onSubmit((values) => {
          onSave(values);
        })}
      >
        <Stack>
          <Tabs
            defaultValue="Devchat"
            variant="outline"
            sx={{
              ".mantine-UnstyledButton-root::before": {
                backgroundColor: "var(--vscode-sideBar-background)!important",
              },
            }}
          >
            <Tabs.List>
              <Tabs.Tab
                value="Devchat"
                sx={{
                  color: "var(--vscode-editor-foreground)",
                }}
              >
                Devchat
              </Tabs.Tab>
              <Tabs.Tab
                value="OpenAI"
                sx={{
                  color: "var(--vscode-editor-foreground)",
                }}
              >
                OpenAI
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel
              value="Devchat"
              pt="xs"
              p={10}
              sx={{
                border: "1px solid #ced4da",
                borderTop: "none",
                borderRadius: "0 0 4px 4px",
              }}
            >
              <Stack>
                <TextInput
                  styles={commonInputStyle}
                  placeholder="https://xxxx.xx"
                  label={t("API Base of Devchat")}
                  withAsterisk
                  description={t("the base URL for the API")}
                  {...form.getInputProps("providers.devchat.api_base")}
                />

                <PasswordInput
                  styles={commonInputStyle}
                  sx={{
                    "& .mantine-PasswordInput-innerInput": {
                      fontSize: "var(--vscode-editor-font-size)",
                      color: "var(--vscode-editor-foreground)",
                    },
                  }}
                  withAsterisk
                  label={t("Access Key of Devchat")}
                  placeholder={t("Your Access Key")}
                  description={t("please keep this secret")}
                  {...form.getInputProps("providers.devchat.api_key")}
                />
              </Stack>
            </Tabs.Panel>
            <Tabs.Panel
              value="OpenAI"
              pt="xs"
              p={10}
              sx={{
                border: "1px solid #ced4da",
                borderTop: "none",
                borderRadius: "4px",
              }}
            >
              <Stack>
                <TextInput
                  styles={commonInputStyle}
                  placeholder={t("API Base of OpenAI")}
                  label={t("API Base of OpenAI")}
                  withAsterisk
                  description={t("the base URL for the API")}
                  {...form.getInputProps("providers.openai.api_base")}
                />
                <PasswordInput
                  styles={commonInputStyle}
                  withAsterisk
                  label="Access Key of OpenAI"
                  placeholder="Your Access Key"
                  description="please keep this secret"
                  {...form.getInputProps("providers.openai.api_key")}
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>
          <Box
            sx={{
              border: "1px solid #ced4da",
              borderRadius: "4px",
            }}
            p={10}
          >
            <Select
              label="Current model"
              placeholder="Pick one"
              description="Leave it blank if you won't use this llm model"
              withAsterisk
              styles={{
                ...commonInputStyle,
                ...selectStyle,
              }}
              data={models}
              value={current}
              onChange={(value: string) => setCurrent(value)}
            />
            <NumberInput
              label="Max input tokens"
              description="the maximum number of tokens that can be used in the input"
              styles={commonInputStyle}
              value={form.values?.models[current]?.max_input_tokens}
              onChange={(value) => changeModelDetail("max_input_tokens", value)}
            />
            {current.toLowerCase().startsWith("gpt") && (
              <Select
                label="Provider"
                placeholder="Pick one"
                description="select the provider for the model"
                styles={{
                  ...commonInputStyle,
                  ...selectStyle,
                }}
                data={[
                  { value: "devchat", label: "Devchat" },
                  { value: "openai", label: "OpenAI" },
                ]}
                value={form.values?.models[current]?.provider}
                onChange={(value) =>
                  changeModelDetail("provider", value as string)
                }
              />
            )}
          </Box>
          <Radio.Group
            label="Language"
            description="Select your preferred language"
            withAsterisk
            styles={commonInputStyle}
            sx={{
              label: {
                color: "var(--vscode-editor-foreground)",
                fontSize: "var(--vscode-editor-font-size)",
              },
            }}
            {...form.getInputProps("language")}
            onChange={languageChange}
          >
            <Group mt="xs">
              <Radio value="en" label="EN" />
              <Radio value="zh" label="中文" />
            </Group>
          </Radio.Group>
          <TextInput
            styles={commonInputStyle}
            label="Python for chat"
            placeholder="/xxx/xxx"
            description="Please enter the path of your python"
            {...form.getInputProps("python_for_chat")}
          />
          <TextInput
            styles={commonInputStyle}
            label="Python for commands"
            placeholder="/xxx/xxx"
            description="Please enter the path of your python"
            {...form.getInputProps("python_for_commands")}
          />
        </Stack>
        <Group
          grow
          p={10}
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: "1px solid #ced4da",
            background: "var(--vscode-sideBar-background)",
          }}
        >
          <Button type="submit" disabled={disabledSubmit}>
            Save
          </Button>
          <Button
            variant="outline"
            color="gray"
            onClick={() => {
              router.updateRoute("chat");
            }}
          >
            Cancel
          </Button>
        </Group>
      </form>
    </Drawer>
  );
};

export default observer(Config);
