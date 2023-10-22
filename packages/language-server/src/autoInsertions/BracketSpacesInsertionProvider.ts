import { Connection, TextDocuments } from 'vscode-languageserver';
import { AutoInsertRequest } from '../customRequests/AutoInsertRequest';
import { TextDocument } from 'vscode-languageserver-textdocument';

export class BracketSpacesInsertionProvider {
    isEnabled = true;

    readonly changeTriggers = new Map([
        ['%%', '{%%}'],
        ['{}', '{{}}'],
    ]);

    constructor(
        connection: Connection,
        private readonly documents: TextDocuments<TextDocument>,
    ) {
        connection.onRequest(AutoInsertRequest.type, this.onAutoInsert.bind(this));
    }

    async onAutoInsert({ textDocument, options }: AutoInsertRequest.ParamsType): Promise<AutoInsertRequest.ResponseType> {
        if (!this.isEnabled) return;

        const document = this.documents.get(textDocument.uri);

        if (!document) return;

        const { lastChange } = options;

        const fullTrigger = this.changeTriggers.get(lastChange.text);

        if (!fullTrigger) return;

        const textSurround = document.getText({
            start: { line: lastChange.range.start.line, character: lastChange.range.start.character - '{'.length },
            end: { line: lastChange.range.start.line, character: lastChange.range.start.character + '{}}'.length }
        });

        if (textSurround !== fullTrigger) return;

        return {
            newText: ` $0 `,
            range: {
                start: { line: lastChange.range.start.line, character: lastChange.range.start.character + 1 },
                end: { line: lastChange.range.start.line, character: lastChange.range.start.character + 1 }
            },
        };
    }
}
