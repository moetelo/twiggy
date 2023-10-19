import { DocumentUri, ExecuteCommandParams, Position } from 'vscode-languageserver';
import { Server } from '../server';
import { isInsideHtmlRegion } from '../utils/node';

export enum Command {
    IsInsideHtmlRegion = 'twiggy.is-inside-html-region',
}

const commands = new Map([
    [Command.IsInsideHtmlRegion, isInsideHtmlRegion],
]);

export class ExecuteCommandProvider {
    server: Server;

    constructor(server: Server) {
        this.server = server;

        this.server.connection.onExecuteCommand(
            this.onExecuteCommand.bind(this)
        );
    }

    onExecuteCommand(params: ExecuteCommandParams) {
        const [ commandName ] = params.command.split('(');
        const command = commands.get(commandName as Command);

        if (!command || !params.arguments) {
            return;
        }

        const [uri, position] = params.arguments as [DocumentUri, Position];
        const document = this.server.documentCache.get(uri);

        if (!document) {
            return;
        }

        return command(document, position);
    }
}
