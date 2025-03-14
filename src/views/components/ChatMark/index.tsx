import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Text,
  Radio,
  Textarea,
  createStyles,
  MultiSelect
} from "@mantine/core";
import { useListState, useSetState } from "@mantine/hooks";
import { useMst } from "@/views/stores/RootStore";
import yaml from "js-yaml";
import IDEServiceUtil from "@/util/IDEServiceUtil";
import APIUtil from "@/util/APIUtil";

const useStyles = createStyles((theme) => ({
  container: {
    padding: 0,
    margin: 0,
  },
  submit: {
    marginTop: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  cancel: {},
  button: {
    marginTop: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  checkbox: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  label: {
    color: "var(--vscode-editor-foreground)",
    fontFamily: "var(--vscode-editor-font-family)",
    fontSize: "var(--vscode-editor-font-size)",
  },
  radio: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  editor: {
    backgroundColor: "var(--vscode-input-background)",
    borderColor: "var(--vscode-input-border)",
    color: "var(--vscode-input-foreground)",
  },
  editorWrapper: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
}));

interface IWdiget {
  id: string;
  value: string;
  title?: string;
  type: "editor" | "checkbox" | "radio" | "button" | "text"| "multiSelect";
  submit?: string;
  cancel?: string;
}

const ChatMark = ({
  children,
  value,
  messageDone,
  submit = "Submit",
  cancel = "Cancel",
}) => {
  const { classes } = useStyles();
  const [widgets, widgetsHandlers] = useListState<IWdiget>();
  const { chat } = useMst();
  const [autoForm, setAutoForm] = useState(false); // if any widget is checkbox,radio or editor wdiget, the form is auto around them
  const values = value ? yaml.load(value) : {};
  const [disabled, setDisabled] = useState(messageDone || !!value);
  const [checkboxArray, setcheckboxArray] = useState<any>([]);
  const platform = process.env.platform === "idea" ? "intellij" : process.env.platform;

  const handleSubmit = () => {
    let formData = {};
    widgets.forEach((widget) => {
      if (
        widget.type === "text" ||
        widget.type === "button" ||
        (widget.type === "radio" && widget.value === "unchecked") ||
        (widget.type === "checkbox" && widget.value === "unchecked")
      ) {
        // ignore
        return;
      }
      formData[widget.id] = widget.value;
    });
    chat.userInput(formData);

    IDEServiceUtil.getCurrentFileInfo().then(info => APIUtil.createEvent({
      name: "submit",
      value: JSON.stringify(formData),
      ide: platform,
      language: info?.extension || info?.path?.split('.').pop()
    }));
  };

  const handleCancel = () => {
    chat.userInput({
      form: "canceled",
    });
    IDEServiceUtil.getCurrentFileInfo().then(info => APIUtil.createEvent({
      name: "cancel",
      ide: platform,
      language: info?.extension || info?.path?.split('.').pop()
    }));
  };

  const handleButtonClick = ({ event, index }) => {
    const widget = widgets[index];
    widget["value"] = event.currentTarget.value;
    widgetsHandlers.setItem(index, widget);
    chat.userInput({
      [widget["id"]]: "clicked",
    });
  };

  const handleCheckboxChange = ({ event, index }) => {
    const widget = widgets[index];
    widget["value"] = event.currentTarget.checked ? "checked" : "unchecked";
    widgetsHandlers.setItem(index, widget);

    const checkboxIndex = checkboxArray.findIndex((detail) => {
      return detail.group.find((item) => item.id === widget.id);
    });
    const allChecked = checkboxArray[checkboxIndex].group.every(
      (checkBoxItem) => {
        const widgetIndex = widgets.findIndex(
          (widget) => widget.id === checkBoxItem.id
        );
        return widgets[widgetIndex].value === "checked";
      }
    );
    const indeterminate =
      !allChecked &&
      checkboxArray[checkboxIndex].group.some((checkBoxItem) => {
        const widgetIndex = widgets.findIndex(
          (widget) => widget.id === checkBoxItem.id
        );
        return widgets[widgetIndex].value === "checked";
      });
    checkboxArray[checkboxIndex].check = allChecked;
    checkboxArray[checkboxIndex].indeterminate = indeterminate;
  };
  const handleRadioChange = ({ event, allValues }) => {
    widgetsHandlers.apply((item, index) => {
      if (allValues.includes(item.id)) {
        if (item.id === event) {
          item.value = "checked";
        } else {
          item.value = "unchecked";
        }
      }
      return item;
    });
  };
  const handleEditorChange = ({ event, index }) => {
    const widget = widgets[index];
    widget["value"] = event.currentTarget.value;
    widgetsHandlers.setItem(index, widget);
  };
  const handleSelectChange = (values:string[],allValues:string[]) => {
    widgetsHandlers.apply((item) => {
      if (allValues.includes(item.id)) {
        if(!values.length){
          item.value='unchecked';
          return item;
        }
        item.value = "unchecked";
        values.forEach(el=>{
          if(item.id==el){
            item.value = "checked";
          }
        })
      }
      return item;
    });
  };

  useEffect(() => {
    const lines = children.split("\n");
    let detectEditorId = "";
    let editorContentRecorder = "";

    const textRegex = /^([^>].*)/; // Text widget
    const buttonRegex = /^>\s*\((.*?)\)\s*(.*)/; // Button widget
    const checkboxRegex = /^>\s*\[([x ]*)\]\((.*?)\)\s*(.*)/; // Checkbox widget
    const selectRegex = /^>\s*\{([x ]*)\}\((.*?)\)\s*(.*)/; //MultiSelect widget
    const radioRegex = /^>\s*-\s*\((.*?)\)\s*(.*)/; // Radio button widget
    const editorRegex = /^>\s*\|\s*\((.*?)\)/; // Editor widget
    const editorContentRegex = /^>\s*(.*)/; // Editor widget

    const checkArrayTemp: any = [];
    let prevIsCheckbox = false;
    lines.forEach((line, index) => {
      let match;

      if ((match = line.match(textRegex))) {
        widgetsHandlers.append({
          id: `text${index}`,
          type: "text",
          value: line,
        });
      } else if ((match = line.match(buttonRegex))) {
        const [id, title] = match.slice(1);
        widgetsHandlers.append({
          id,
          title,
          type: "button",
          value: id,
        });
      } else if ((match = line.match(checkboxRegex))) {
        const [status, id, title] = match.slice(1);
        const check = value
          ? "unchecked"
          : status === "x"
          ? "checked"
          : "unchecked";
        widgetsHandlers.append({
          id,
          title,
          type: "checkbox",
          value: check,
        });
        setAutoForm(true);
        let currentCheckboxData: any = prevIsCheckbox
          ? checkArrayTemp[checkArrayTemp.length - 1]
          : {};

        if (prevIsCheckbox) {
          currentCheckboxData.group.push({
            id: id,
            // 只记录初始化时的状态，后续状态变化不会更新
            check: check,
          });
        } else {
          currentCheckboxData = {
            id: `select-all-${id}`,
            allChecked: false,
            indeterminate: false,
            check: false,
            group: [{ id: id, check: check }],
          };
          checkArrayTemp.push(currentCheckboxData);
        }
      }else if ((match = line.match(selectRegex))) {
        const [status, id, title] = match.slice(1);
        const check = value
          ? "unchecked"
          : status === "x"
          ? "checked"
          : "unchecked";
        widgetsHandlers.append({
          id,
          title,
          type: "multiSelect",
          value: check,
        });
        setAutoForm(true);
        let currentCheckboxData: any = prevIsCheckbox
          ? checkArrayTemp[checkArrayTemp.length - 1]
          : {};

        if (prevIsCheckbox) {
          currentCheckboxData.group.push({
            id: id,
            // 只记录初始化时的状态，后续状态变化不会更新
            check: check,
          });
        } else {
          currentCheckboxData = {
            id: `select-all-${id}`,
            allChecked: false,
            indeterminate: false,
            check: false,
            group: [{ id: id, check: check }],
          };
          checkArrayTemp.push(currentCheckboxData);
        }
      } else if ((match = line.match(radioRegex))) {
        const [id, title] = match.slice(1);
        widgetsHandlers.append({
          id,
          title,
          type: "radio",
          value: "unchecked",
        });
        setAutoForm(true);
      } else if ((match = line.match(editorRegex))) {
        const [id] = match.slice(1);
        detectEditorId = id;
        widgetsHandlers.append({
          id,
          type: "editor",
          value: "",
        });
        setAutoForm(true);
      } else if ((match = line.match(editorContentRegex))) {
        const [content] = match.slice(1);
        editorContentRecorder += content + "\n";
      }
      // if next line is not editor, then end current editor
      const nextLine = index + 1 < lines.length ? lines[index + 1] : null;
      if (detectEditorId && (!nextLine || !nextLine.startsWith(">"))) {
        // remove last \n
        editorContentRecorder = editorContentRecorder.substring(
          0,
          editorContentRecorder.length - 1
        );
        // apply editor content to widget
        ((editorId, editorContent) =>
          widgetsHandlers.apply((item) => {
            if (item.id === editorId && !(item.id in values)) {
              item.value = editorContent;
            }
            return item;
          }))(detectEditorId, editorContentRecorder);
        // reset editor
        detectEditorId = "";
        editorContentRecorder = "";
      }
      prevIsCheckbox = line.match(checkboxRegex);
    });
    for (const key in values) {
      widgetsHandlers.apply((item) => {
        if (item.id === key) {
          item.value = values[key];
        }
        return item;
      });
    }

    const checkRes = checkArrayTemp.map((item) => {
      const allChecked = item.group.every((item) => item.check === "checked");
      const indeterminate =
        !allChecked && item.group.some((item) => item.check === "checked");
      return {
        ...item,
        check: allChecked,
        indeterminate: indeterminate,
      };
    });
    setcheckboxArray(checkRes);
  }, []);
  // Render markdown widgets
  const renderWidgets = (widgets: IWdiget[]) => {
    let radioGroupTemp: any = [];
    let radioValuesTemp: any = [];
    let wdigetsTemp: any = [];
    let prevIsCheckbox = false;
    let groupTemp: any = [];
    let valuesTemp: any = [];
    let selectValues: any = [];
    widgets.map((widget, index) => {
      if (widget.type === "text") {
        wdigetsTemp.push(<Text key={index}>{widget.value}</Text>);
      } else if (widget.type === "button") {
        wdigetsTemp.push(
          <Button
            className={classes.button}
            disabled={disabled}
            key={"widget" + index}
            size="xs"
            value={widget.value}
            onClick={(event) => handleButtonClick({ event, index })}
          >
            {values[widget.id] === "clicked"
              ? "[x] " + widget.title
              : widget.title}
          </Button>
        );
      } else if (widget.type === "checkbox") {
        if (!prevIsCheckbox) {
          const index = checkboxArray.findIndex((detail) => {
            return detail.group.find((item) => item.id === widget.id);
          });
          wdigetsTemp.push(
            <Checkbox
              classNames={{ root: classes.checkbox, label: classes.label }}
              disabled={disabled}
              key={"widget-all-" + index}
              label={"Select all"}
              size="xs"
              checked={checkboxArray[index].check}
              indeterminate={checkboxArray[index].indeterminate}
              onChange={(e) => {
                const currentCheck = checkboxArray[index].check;

                checkboxArray[index].group.map((item) => {
                  const widgetIndex = widgets.findIndex(
                    (widget) => widget.id === item.id
                  );
                  widgetsHandlers.setItem(widgetIndex, {
                    ...widgets[widgetIndex],
                    value: currentCheck ? "unchecked" : "checked",
                  });
                });
                checkboxArray[index].check = !checkboxArray[index].check;
                checkboxArray[index].indeterminate = false;
              }}
            />
          );
        }
        wdigetsTemp.push(
          <Checkbox
            classNames={{ root: classes.checkbox, label: classes.label }}
            disabled={disabled}
            key={"widget" + index}
            label={widget.title}
            checked={widget.value === "checked"}
            size="xs"
            onChange={(event) => handleCheckboxChange({ event, index })}
          />
        );
      } else if (widget.type === "radio") {
        radioValuesTemp.push(widget.id);
        radioGroupTemp.push(
          <Radio
            classNames={{ root: classes.radio, label: classes.label }}
            disabled={disabled}
            key={"widget" + index}
            label={widget.title}
            value={widget.id}
            size="xs"
          />
        );
        // if next widget is not radio, then end current group
        const nextWidget =
          index + 1 < widgets.length ? widgets[index + 1] : null;
        if (!nextWidget || nextWidget.type !== "radio") {
          const radioGroup = ((radios, allValues) => {
            const filteredValues = allValues.filter(
              (value) => values[value] === "checked"
            );
            return (
              <Radio.Group
                key={`radio-group-${index}`}
                value={
                  filteredValues.length > 0 ? filteredValues[0] : undefined
                }
                onChange={(event) =>
                  handleRadioChange({
                    event,
                    allValues,
                  })
                }
              >
                {radios}
              </Radio.Group>
            );
          })(radioGroupTemp, radioValuesTemp);
          radioGroupTemp = [];
          radioValuesTemp = [];
          wdigetsTemp.push(radioGroup);
        }
      } else if (widget.type === "editor") {
        wdigetsTemp.push(
          <Textarea
            disabled={disabled}
            autosize
            classNames={{
              wrapper: classes.editorWrapper,
              input: classes.editor,
            }}
            key={"widget" + index}
            defaultValue={widget.value}
            maxRows={10}
            onChange={(event) => handleEditorChange({ event, index })}
          />
        );
      }else if(widget.type === "multiSelect"){
        if(widget.value==="checked")selectValues.push(widget.id);
        groupTemp.push({label:widget.title,value:widget.id});
        valuesTemp.push(widget.id);
        // if next widget is not radio, then end current group
        const nextWidget =
          index + 1 < widgets.length ? widgets[index + 1] : null;
        if (!nextWidget || nextWidget.type !== "multiSelect") {
          const multiSelect = ((data, allValues) => {
            return (
              <MultiSelect
                disabled={disabled}
                styles={{searchInput:{outline:'none !important'}}}
                data={data}
                disableSelectedItemFiltering
                label=""
                nothingFound="暂无数据"
                placeholder="请选择您的task编号"
                searchable
                value={selectValues}
                onChange={(values)=>handleSelectChange(values,allValues)}
              />);
          })(groupTemp, valuesTemp);
          groupTemp = [];
          valuesTemp = [];
          selectValues = [];
          wdigetsTemp.push(multiSelect);
        }
      }

      prevIsCheckbox = widget.type === "checkbox";
    });
    return wdigetsTemp;
  };

  return (
    <Box className={classes.container}>
      {autoForm && !disabled ? (
        <form>
          {renderWidgets(widgets)}
          <Box>
            <Button className={classes.submit} size="xs" onClick={handleSubmit}>
              {submit}
            </Button>
            <Button className={classes.cancel} size="xs" onClick={handleCancel}>
              {cancel}
            </Button>
          </Box>
        </form>
      ) : (
        renderWidgets(widgets)
      )}
    </Box>
  );
};

export default ChatMark;
