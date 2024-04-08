import { Command } from 'twiggy-language-server/src/commands/ExecuteCommandProvider';
import {
    workspace,
    ExtensionContext,
    window,
    WorkspaceFolder,
    RelativePattern,
    commands,
    CompletionList,
    Uri,
    ConfigurationTarget,
} from 'vscode';
import * as autoInsert from './autoInsert';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';
import { unwrapCompletionArray } from './utils/unwrapCompletionArray';

const outputChannel = window.createOutputChannel('Twiggy Language Server');
const clients = new Map<string, LanguageClient>();

export async function activate(context: ExtensionContext) {
    workspace.workspaceFolders?.forEach((folder) =>
        addWorkspaceFolder(folder, context)
    );

    workspace.onDidChangeWorkspaceFolders(({ added, removed }) => {
        added.forEach((folder) => addWorkspaceFolder(folder, context));
        removed.forEach((folder) => removeWorkspaceFolder(folder));
    });

    const config = workspace.getConfiguration('twiggy');
    if (!config.get('framework')) {
        const result = await window.showWarningMessage(
            'Please set the `twiggy.framework` configuration option.',
            'Open settings',
            'Ignore',
        );

        if (result === 'Open settings') {
            await commands.executeCommand('workbench.action.openWorkspaceSettingsFile', 'twiggy.framework');
        } else {
            await config.update('framework', 'ignore', ConfigurationTarget.Workspace);
        }
    }
}

export async function deactivate(): Promise<void> {
    for (const client of clients.values()) {
        await client.stop();
    }
}

async function addWorkspaceFolder(
    workspaceFolder: WorkspaceFolder,
    context: ExtensionContext
): Promise<void> {
    const folderPath = workspaceFolder.uri.fsPath;
    const fileEvents = workspace.createFileSystemWatcher(
        new RelativePattern(workspaceFolder, '*.twig')
    );

    context.subscriptions.push(fileEvents);

    if (clients.has(folderPath)) {
        return;
    }

    const module = require.resolve('./server');

    const serverOptions: ServerOptions = {
        run: { module, transport: TransportKind.ipc },
        debug: {
            module,
            transport: TransportKind.ipc,
            options: { execArgv: ['--nolazy', `--inspect=6009`] },
        },
    };

    const virtualDocumentContents = new Map<string, string>();

    workspace.registerTextDocumentContentProvider('embedded-content', {
        provideTextDocumentContent(uri) {
            const originalUri = uri.path.slice('/'.length, -'.html'.length);
            const decodedUri = decodeURIComponent(originalUri);
            return virtualDocumentContents.get(decodedUri);
        },
    });

    const workspaceUri = workspaceFolder.uri.toString(true);

    const clientOptions: LanguageClientOptions = {
        workspaceFolder,
        outputChannel,
        documentSelector: [
            {
                scheme: 'file',
                language: 'twig',
                pattern: `${folderPath}/**`,
            },
        ],
        synchronize: { fileEvents },
        middleware: {
            async provideCompletionItem(
                document,
                position,
                context,
                token,
                next,
            ) {
                const originalUri = document.uri.toString(true);

                const isInsideHtmlRegionCommand = `${Command.IsInsideHtmlRegion}(${workspaceUri})`;
                const isInsideHtmlRegion = await commands.executeCommand<boolean>(
                    isInsideHtmlRegionCommand,
                    originalUri,
                    position,
                );
                const result = await unwrapCompletionArray(next(document, position, context, token));

                if (!isInsideHtmlRegion) {
                    return result;
                }

                virtualDocumentContents.set(originalUri, document.getText());

                const encodedUri = encodeURIComponent(originalUri);
                const vdocUri = Uri.parse(`embedded-content://html/${encodedUri}.html`);
                const htmlCompletions = await commands.executeCommand<CompletionList>(
                    'vscode.executeCompletionItemProvider',
                    vdocUri,
                    position,
                    context.triggerCharacter,
                );

                return [
                    ...await unwrapCompletionArray(htmlCompletions),
                    ...result,
                ];
            },
        },
    };

    const client = new LanguageClient(
        'twiggy-language-server ' + workspaceUri,
        'Twiggy Language Server ' + workspaceUri,
        serverOptions,
        clientOptions
    );

    await autoInsert.activate(
        [client],
        (document) => document.uri.fsPath.startsWith(folderPath),
    );

    clients.set(folderPath, client);

    await client.start();

    outputChannel.appendLine('Language server started for: ' + folderPath);
}

async function removeWorkspaceFolder(
    workspaceFolder: WorkspaceFolder,
): Promise<void> {
    const folderPath = workspaceFolder.uri.fsPath;
    const client = clients.get(folderPath);

    if (client) {
        clients.delete(folderPath);

        await client.stop();
    }
}
