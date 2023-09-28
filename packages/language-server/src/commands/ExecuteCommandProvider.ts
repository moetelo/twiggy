import { ExecuteCommandParams, Position } from 'vscode-languageserver';
import { Server } from '../server';
import { isInsideHtmlRegion } from './isInsideHtmlRegion';

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
        const command = commands.get(params.command as Command);

        if (!command || !params.arguments) {
            return;
        }

        const [url, position] = params.arguments as [string, Position];
        const document = this.server.documentCache.getDocument(url);

        if (!document) {
            return;
        }

        return command(document, position);
    }
}
