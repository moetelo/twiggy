import { Command } from 'vscode-languageserver/node';

export const triggerParameterHints = Command.create(
    'Trigger parameter hints',
    'editor.action.triggerParameterHints',
);
