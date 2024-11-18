import { Connection, DocumentUri, ExecuteCommandParams, Position } from 'vscode-languageserver';
import { isInsideHtmlRegion } from '../utils/node';
import { DocumentCache } from '../documents';

export enum Command {
    DebugCommand = 'twiggy.debug-command',
    IsInsideHtmlRegion = 'twiggy.is-inside-html-region',
}

export class ExecuteCommandProvider {
    private commands: Map<Command, (...args: any) => Promise<any>>;

    constructor(
        connection: Connection,
        private readonly documentCache: DocumentCache,
    ) {
        this.commands = new Map<Command, (...args: any) => Promise<any>>([
            [Command.DebugCommand, this.debugCommand],
            [Command.IsInsideHtmlRegion, this.isInsideHtmlRegionCommand],
        ]);

        connection.onExecuteCommand(
            this.onExecuteCommand.bind(this),
        );
    }

    async onExecuteCommand(params: ExecuteCommandParams) {
        const command = this.commands.get(params.command as Command);

        if (
            !command ||
            !params.arguments ||
            params.arguments.length < 1 ||
            'string' !== typeof params.arguments[0]
        ) {
            return;
        }

        const [ workspaceFolderPath, ...args ] = params.arguments as [string, ...any];
        if (workspaceFolderPath !== this.documentCache.workspaceFolderPath) {
            console.warn(
                `Attempt to call command ${params.command} from invalid workspace`,
                `expected ${this.documentCache.workspaceFolderPath}`,
                `got ${workspaceFolderPath}`,
            );
            return;
        }

        return command(...args);
    }

    private debugCommand = async (...args: any) =>
        console.info("Debug command is called:", args);

    private isInsideHtmlRegionCommand = async (
        uri: DocumentUri,
        position: Position,
    ) => {
        const document = await this.documentCache.get(uri);
        return isInsideHtmlRegion(document, position)
    };
}
