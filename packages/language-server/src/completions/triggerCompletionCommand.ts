import { Command } from 'vscode-languageserver';

export const triggerCompletion = Command.create(
    'Trigger completion',
    'editor.action.triggerSuggest',
);
