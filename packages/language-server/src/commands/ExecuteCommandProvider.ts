import { Connection, DocumentUri, ExecuteCommandParams, Position } from 'vscode-languageserver';
import { isInsideHtmlRegion } from '../utils/node';
import { DocumentCache } from '../documents';

export enum Command {
    IsInsideHtmlRegion = 'twiggy.is-inside-html-region',
}

const commands = new Map([
    [Command.IsInsideHtmlRegion, isInsideHtmlRegion],
]);

export class ExecuteCommandProvider {
    constructor(
        connection: Connection,
        private readonly documentCache: DocumentCache,
    ) {
        connection.onExecuteCommand(
            this.onExecuteCommand.bind(this)
        );
    }

    async onExecuteCommand(params: ExecuteCommandParams) {
        const [ commandName ] = params.command.split('(');
        const command = commands.get(commandName as Command);

        if (!command || !params.arguments) {
            return;
        }

        const [uri, position] = params.arguments as [DocumentUri, Position];
        const document = this.documentCache.get(uri);

        if (!document) {
            return;
        }

        if (!document.text) {
            await this.documentCache.setText(document);
        }

        return command(document, position);
    }
}
