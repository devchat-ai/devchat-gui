import { Tooltip, ActionIcon, CopyButton, Flex } from "@mantine/core";
import { IconCheck, IconGitCommit, IconFileDiff, IconColumnInsertRight, IconReplace, IconCopy,IconFile } from "@tabler/icons-react";
import React, { useState } from "react";
import { useMst } from "@/views/stores/RootStore";

import messageUtil from '@/util/MessageUtil';
import language from "react-syntax-highlighter/dist/esm/languages/hljs/1c";
import { use } from "chai";
import APIUtil from "@/util/APIUtil";

const IconButton = ({ label, color = 'gray', onClick, children }) => (
    <Tooltip sx={{ padding: '3px', fontSize: 'var(--vscode-editor-font-size)' }} label={label} withArrow position="left" color="gray">
        <ActionIcon size='xs' color={color} onClick={onClick}>
            {children}
        </ActionIcon>
    </Tooltip>
);

const CommitButton = ({ code }) => {
    const [commited, setCommited] = useState(false);
    const handleClick = () => {
        messageUtil.sendMessage({
            command: 'doCommit',
            content: code
        });
        setCommited(true);
        setTimeout(() => { setCommited(false); }, 2000);
    };
    return (
        <IconButton label={commited ? 'Committing' : 'Commit'} color={commited ? 'teal' : 'gray'} onClick={handleClick}>
            {commited ? <IconCheck size="1rem" /> : <IconGitCommit size="1rem" />}
        </IconButton>
    );
};

const CodeCopyButton = ({ code }) => {
    const {config} = useMst();
    return (
        <CopyButton value={code} timeout={2000}>
            {({ copied, copy }) => (
                <IconButton label={copied ? 'Copied' : 'Copy'} color={copied ? 'teal' : 'gray'} onClick={() => {
                    copy();
                    APIUtil.createEvent(config.getAppURL(), config.getUserKey(), {name: 'copy', value: 'copy'})
                }}>
                    {copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
                </IconButton>
            )}
        </CopyButton>
    );
};

const DiffButton = ({ code }) => {
    const {config} = useMst();
    const handleClick = () => {
        const e = 'show_diff';
        messageUtil.sendMessage({
            command: e,
            content: code
        });
        APIUtil.createEvent(config.getAppURL(), config.getUserKey(), {name: e, value: e})
    };
    return (
        <IconButton label='View Diff' onClick={handleClick}>
            <IconFileDiff size="1.125rem" />
        </IconButton>
    );
};

const CodeApplyButton = ({ code }) => {
    const {config} = useMst();
    const handleClick = () => {
        const e = 'code_apply';
        messageUtil.sendMessage({
            command: e,
            content: code
        });
        APIUtil.createEvent(config.getAppURL(), config.getUserKey(), {name: e, value: e})
    };
    return (
        <IconButton label='Insert Code' onClick={handleClick}>
            <IconColumnInsertRight size="1.125rem" />
        </IconButton>
    );
};

const FileApplyButton = ({ code }) => {
    const {config} = useMst();
    const handleClick = () => {
        const e = 'code_file_apply';
        messageUtil.sendMessage({
            command: e,
            content: code
        });
        APIUtil.createEvent(config.getAppURL(), config.getUserKey(), {name: e, value: e})
    };
    return (
        <IconButton label='Replace File' onClick={handleClick}>
            <IconReplace size="1.125rem" />
        </IconButton>
    );
};

// Add a new button to create new file
const NewFileButton = ({ language,code }) => {
    const {config} = useMst();
    const handleClick = () => {
        const e = 'code_new_file';
        messageUtil.sendMessage({
            command: e,
            language: language,
            content: code
        });
        APIUtil.createEvent(config.getAppURL(), config.getUserKey(), {name: e, value: e})
    };
    return (
        <IconButton label='Create New File' onClick={handleClick}>
            <IconFile size="1.125rem" />
        </IconButton>
    );
};

// Similar changes can be made to DiffButton, CodeApplyButton, FileApplyButton, and CodeCopyButton
const CodeButtons = ({ language, code }) => (
    <Flex
        gap="5px"
        justify="flex-start"
        align="flex-start"
        direction="row"
        wrap="wrap"
        style={{ position: 'absolute', top: 8, right: 10 }}
    >
        <CodeCopyButton code={code} />
        {language && language === 'commitmsg'
            ? <CommitButton code={code} />
            : (
                <>
                    <DiffButton code={code} />
                    <CodeApplyButton code={code} />
                    <FileApplyButton code={code} />
                    <NewFileButton code={code} language={language} />
                </>
            )}
    </Flex>
);

export default CodeButtons;