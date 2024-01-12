import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Text,
  Radio,
  Textarea,
  createStyles,
} from "@mantine/core";
import { useListState, useSetState } from "@mantine/hooks";
import { useMst } from "@/views/stores/RootStore";
import yaml from "js-yaml";

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
    fontSize: 'var(--vscode-editor-font-size)',
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

interface Wdiget {
  id: string;
  value: string;
  title?: string;
  type: "editor" | "checkbox" | "radio" | "button" | "text";
  submit?: string;
  cancel?: string;
}

const ChatMark = ({ children, value, messageDone, submit = 'Submit', cancel = 'Cancel' }) => {
  const { classes } = useStyles();
  const [widgets, widgetsHandlers] = useListState<Wdiget>();
  const { chat } = useMst();
  const [autoForm, setAutoForm] = useState(false); // if any widget is checkbox,radio or editor wdiget, the form is auto around them
  const values = value ? yaml.load(value) : {};
  const [disabled, setDisabled] = useState(messageDone || !!value);

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
  };

  const handleCancel = () => {
    chat.userInput({
      form: "canceled",
    });
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
  const allChecked = widgets.every((w) => w.type === "checkbox" ? w.value === "checked" : true);
  const indeterminate = widgets.some((w) => w.type === "checkbox" ? w.value === "checked" : false) && !allChecked;

  useEffect(() => {
    const lines = children.split("\n");
    let detectEditorId = "";
    let editorContentRecorder = "";

    const textRegex = /^([^>].*)/; // Text widget
    const buttonRegex = /^>\s*\((.*?)\)\s*(.*)/; // Button widget
    const checkboxRegex = /^>\s*\[([x ]*)\]\((.*?)\)\s*(.*)/; // Checkbox widget
    const radioRegex = /^>\s*-\s*\((.*?)\)\s*(.*)/; // Radio button widget
    const editorRegex = /^>\s*\|\s*\((.*?)\)/; // Editor widget
    const editorContentRegex = /^>\s*(.*)/; // Editor widget

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
        widgetsHandlers.append({
          id,
          title,
          type: "checkbox",
          value: value ? "unchecked" : status === "x" ? "checked" : "unchecked",
        });
        setAutoForm(true);
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
    });
    for (const key in values) {
      widgetsHandlers.apply((item) => {
        if (item.id === key) {
          item.value = values[key];
        }
        return item;
      });
    }
  }, []);
  // Render markdown widgets
  const renderWidgets = (widgets) => {
    let radioGroupTemp: any = [];
    let radioValuesTemp: any = [];
    let wdigetsTemp: any = [];
    let isFirstCheckbox = true; 
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
        if(isFirstCheckbox) {
          wdigetsTemp.push(<Checkbox
            classNames={{ root: classes.checkbox, label: classes.label }}
            disabled={disabled}
            key={"widget-all-" + index}
            label={"Select all"}
            size="xs"
            checked={allChecked}
            indeterminate={indeterminate}
            onChange={() =>
              widgetsHandlers.setState((current) =>
                current.map((w) => ( w.type==="checkbox" ? { ...w, value: allChecked ? "unchecked" : "checked" } : w ))
              )
            }
          />);
          isFirstCheckbox = false;
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
      }
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
