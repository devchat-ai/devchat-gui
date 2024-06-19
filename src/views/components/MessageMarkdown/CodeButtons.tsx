import { Tooltip, ActionIcon, CopyButton, Flex } from "@mantine/core";
import { IconCheck, IconGitCommit, IconFileDiff, IconColumnInsertRight, IconReplace, IconCopy,IconFile } from "@tabler/icons-react";
import React, { useState } from "react";
import { useMst } from "@/views/stores/RootStore";

import messageUtil from '@/util/MessageUtil';
import APIUtil from "@/util/APIUtil";

const IconButton = ({ label, color = 'gray', onClick, children }) => (
    <Tooltip sx={{ padding: '3px', fontSize: 'var(--vscode-editor-font-size)' }} label={label} withArrow position="left" color="gray">
        <ActionIcon size='xs' color={color} onClick={onClick}>
            {children}
        </ActionIcon>
    </Tooltip>
);

const CodeCopyButton = ({ code, language, platform }) => {
    return (
        <CopyButton value={code} timeout={2000}>
            {({ copied, copy }) => (
                <IconButton label={copied ? 'Copied' : 'Copy'} color={copied ? 'teal' : 'gray'} onClick={() => {
                    copy();
                    APIUtil.createEvent({name: 'copy', value: 'copy', language: language, ide: platform})
                }}>
                    {copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
                </IconButton>
            )}
        </CopyButton>
    );
};

const DiffButton = ({ code, language, platform }) => {
    const handleClick = () => {
        const e = 'show_diff';
        messageUtil.sendMessage({
            command: e,
            content: code
        });
        APIUtil.createEvent({name: e, value: e, language: language, ide: platform})
    };
    return (
        <IconButton label='View Diff' onClick={handleClick}>
            <IconFileDiff size="1.125rem" />
        </IconButton>
    );
};

const CodeApplyButton = ({ code, language, platform }) => {
    const handleClick = () => {
        const e = 'code_apply';
        messageUtil.sendMessage({
            command: e,
            content: code
        });
        APIUtil.createEvent({name: e, value: e, language: language, ide: platform})
    };
    return (
        <IconButton label='Insert Code' onClick={handleClick}>
            <IconColumnInsertRight size="1.125rem" />
        </IconButton>
    );
};

const FileApplyButton = ({ code, language, platform }) => {
    const handleClick = () => {
        const e = 'code_file_apply';
        messageUtil.sendMessage({
            command: e,
            content: code
        });
        APIUtil.createEvent({name: e, value: e, language: language, ide: platform})
    };
    return (
        <IconButton label='Replace File' onClick={handleClick}>
            <IconReplace size="1.125rem" />
        </IconButton>
    );
};

// Add a new button to create new file
const NewFileButton = ({ code, language, platform }) => {
    const handleClick = () => {
        const e = 'code_new_file';
        messageUtil.sendMessage({
            command: e,
            language: language,
            content: code
        });
        APIUtil.createEvent({name: e, value: e, language: language, ide: platform})
    };
    return (
        <IconButton label='Create New File' onClick={handleClick}>
            <IconFile size="1.125rem" />
        </IconButton>
    );
};

// Similar changes can be made to DiffButton, CodeApplyButton, FileApplyButton, and CodeCopyButton
const CodeButtons = ({ platform, language, code }) => (
    <Flex
        gap="5px"
        justify="flex-start"
        align="flex-start"
        direction="row"
        wrap="wrap"
        style={{ position: 'absolute', top: 8, right: 10 }}
    >
        <CodeCopyButton code={code} language={language} platform={platform} />
        <>
            <DiffButton code={code} language={language} platform={platform} />
            <CodeApplyButton code={code} language={language} platform={platform} />
            <FileApplyButton code={code} language={language} platform={platform} />
            <NewFileButton code={code} language={language} platform={platform} />
        </>
    </Flex>
);

export default CodeButtons;