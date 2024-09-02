import React, { useEffect, useState, forwardRef } from "react";
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
  Switch,
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

const Config = observer(() => {
  const [loading, { open: startLoading, close: closeLoading }] =
    useDisclosure(false);
  const { config } = useMst();
  const router = useRouter();
  const { i18n, t } = useTranslation();

  const apiSelection = [
    {
      value: "https://api.devchat.ai/v1",
      label: t("Singapore Node"),
    },
    {
      value: "https://api.devchat-ai.cn/v1",
      label: t("China Node"),
    },
    {
      value: "custom",
      label: t("Custom"),
    },
  ];

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
          cumstom_api_base: (value, values) =>
            values.providers?.devchat?.api_base === "custom" && value?.length <= 0
              ? "Please enter custom api base"
              : null,
        },
      },
    },
  });

  const [models, setModels] = useState<any[]>([]);
  const [codeModels, setCodeModels] = useState<any[]>([]);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    if (router.currentRoute !== "config") {return;}
    const modelArray = config.modelsTemplate.map((item) => ({
      value: item.name,
      label: getModelShowName(item.name),
    }));
    setModels(modelArray);
    const codeModelArray = config.modelsTemplate.filter(model => model.category === "code").map((item) => ({
      value: item.name,
      label: getModelShowName(item.name),
    }));
    setCodeModels(codeModelArray);
    if (modelArray.length > 0) {
      setCurrent(modelArray[0].value);
    }
  }, [router.currentRoute]);
  useEffect(() => {
    const cloneConfig = cloneDeep(config.config);
    form.setValues(cloneConfig);
    if (router.currentRoute !== "config") {return;}
    if (config.settle && loading) {
      setTimeout(() => {
        router.updateRoute("chat");
        closeLoading();
      }, 1000);
    }
  }, [config.config]);

  const onSave = (values) => {
    config.updateSettle(false);
    startLoading();
    const writeConfig = cloneDeep(values);
    if (
      writeConfig.providers.devchat.api_base === "custom" &&
      writeConfig.providers.devchat.cumstom_api_base
    ) {
      writeConfig.providers.devchat.api_base =
        writeConfig.providers.devchat.cumstom_api_base;
    }
    delete writeConfig.providers.devchat.cumstom_api_base;
    MessageUtil.sendMessage({
      command: "writeConfig",
      value: writeConfig,
      key: "",
    });
    setTimeout(() => {
      MessageUtil.handleMessage({ command: "reloadConfig" });
    }, 1000);
  };

  const handleSync = () => {
    config.updateSettle(false);
    startLoading();
    // 调用 Local Service 更新工作流，更新、重载命令列表
    MessageUtil.handleMessage({ command: "reloadConfig" });
  };

  const handleReload = () => {
    config.updateSettle(false);
    startLoading();
    // update workflow list
    config.updateWorkflowList().then(() => {
      config.updateSettle(true);
      router.updateRoute("chat");
      closeLoading();
    });
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
  const showProvider =
    current.toLowerCase().startsWith("gpt") &&
    form.values.providers?.openai?.api_key;

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
      zIndex={99}
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
                <Select
                  data={apiSelection}
                  styles={{
                    ...commonInputStyle,
                    ...selectStyle,
                  }}
                  placeholder="https://xxxx.xx"
                  label={t("API Base of Devchat")}
                  withAsterisk
                  description={t("the base URL for the API")}
                  {...form.getInputProps("providers.devchat.api_base")}
                />
                {form.values.providers?.devchat?.api_base === "custom" && (
                  <TextInput
                    styles={commonInputStyle}
                    label={t("Custom API Base of Devchat")}
                    withAsterisk
                    description={t("the base URL for the API")}
                    {...form.getInputProps(
                      "providers.devchat.cumstom_api_base"
                    )}
                  />
                )}

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
                  placeholder={t("https://api.openai.com/v1")}
                  label={t("API Base of OpenAI")}
                  withAsterisk
                  description={t("the base URL for the API")}
                  {...form.getInputProps("providers.openai.api_base")}
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
                  label={t("Access Key of OpenAI")}
                  description={t("please keep this secret")}
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
              label={t("Model Config")}
              description={t("Leave it blank if you won't use this llm model")}
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
              label={t("Max input tokens")}
              description={t(
                "the maximum number of tokens that can be used in the input"
              )}
              styles={commonInputStyle}
              value={form.values?.models[current]?.max_input_tokens}
              onChange={(value) => changeModelDetail("max_input_tokens", value)}
            />
            <NumberInput
              label={t("Max output tokens")}
              description={t(
                "the maximum number of tokens output"
              )}
              styles={commonInputStyle}
              value={form.values?.models[current]?.max_tokens}
              onChange={(value) => changeModelDetail("max_tokens", value)}
            />
            {showProvider && (
              <Select
                label={t("Provider")}
                description={t("select the provider for the model")}
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
            label={t("Language")}
            description={t("Select your preferred language")}
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
            label={t("Python for chat")}
            placeholder="/xxx/xxx"
            description={t("Please enter the path of your python")}
            {...form.getInputProps("python_for_chat")}
          />
          <TextInput
            styles={commonInputStyle}
            label={t("Proxy setting")}
            placeholder="http://127.0.0.1:7890"
            description={t("Please enter the proxy url and port")}
            {...form.getInputProps("DEVCHAT_PROXY")}
          />
          {codeModels.length > 0 && (
          <>
            <Switch
              styles={commonInputStyle}
              label={t("Code Completion Enable")}
              {...form.getInputProps('complete_enable', { type: 'checkbox' })}
            />
            <Switch
              styles={commonInputStyle}
              label={t("Codebase Index Enable")}
              {...form.getInputProps('complete_index_enable', { type: 'checkbox' })}
            />
            <TextInput
              styles={commonInputStyle}
              label={t("Completion Context Length")}
              placeholder="5000"
              description={t("The maximum number of tokens to use as context for the model")}
              {...form.getInputProps("complete_context_limit")}
            />
            <Select
              styles={{
                ...commonInputStyle,
                ...selectStyle,
              }}
              label={t("Code Completion Model")}
              placeholder={t("Select a model")}
              data={codeModels}
              {...form.getInputProps('complete_model')}
              disabled={!form.values.complete_enable}
            />
          </>
          )}
          <Button 
            onClick={handleSync} 
            variant="outline"
            color="gray">
            {t("Sync settings from cloud")}
          </Button>
          <Button 
            onClick={handleReload} 
            variant="outline"
            color="gray">
            {t("Reload built-in & custom workflows")}
          </Button>
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
            {t("Save")}
          </Button>
          <Button
            variant="outline"
            color="gray"
            onClick={() => {
              form.reset();
              router.updateRoute("chat");
            }}
          >
            {t("Cancel")}
          </Button>
        </Group>
      </form>
    </Drawer>
  );
});

export default Config;
