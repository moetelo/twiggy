import * as path from 'node:path';
import {
    workspace,
    ExtensionContext,
    window,
    WorkspaceFolder,
    commands,
    CompletionList,
    Uri,
    CompletionItem,
} from 'vscode';
import * as autoInsert from './autoInsert';
import {
    LanguageClient,
    LanguageClientOptions,
    MarkupKind,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';
import { unwrapCompletionArray } from './utils/unwrapCompletionArray';
import ProtocolCompletionItem from 'vscode-languageclient/lib/common/protocolCompletionItem';
import { IsInsideHtmlRegionRequest } from 'twiggy-language-server/src/customRequests/IsInsideHtmlRegionRequest';

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

    context.subscriptions.push(
        commands.registerCommand('twiggy.restartLanguageServer', restartLanguageServers),
    );
}

export async function deactivate(): Promise<void> {
    for (const client of clients.values()) {
        await client.stop();
    }
}

async function restartLanguageServers(): Promise<void> {
    if (clients.size === 0) {
        window.showInformationMessage('Twiggy: no active language server to restart.');
        return;
    }

    try {
        await Promise.all(
            [...clients.entries()].map(async ([folderPath, client]) => {
                await client.restart();
                outputChannel.appendLine('Language server restarted for: ' + folderPath);
            }),
        );
        window.showInformationMessage('Twiggy: language server restarted.');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        outputChannel.appendLine('Failed to restart language server: ' + message);
        window.showErrorMessage('Twiggy: failed to restart language server: ' + message);
    }
}

async function addWorkspaceFolder(
    workspaceFolder: WorkspaceFolder,
    context: ExtensionContext
): Promise<void> {
    const folderPath = workspaceFolder.uri.fsPath;

    if (clients.has(folderPath)) {
        return;
    }

    const module = path.join(__dirname, 'server.js');

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
        middleware: {
            async provideCompletionItem(
                document,
                position,
                context,
                token,
                next,
            ) {
                const originalUri = document.uri.toString(true);

                const isInsideHtmlRegion = await client.sendRequest<IsInsideHtmlRegionRequest.ResponseType>(IsInsideHtmlRegionRequest.type, {
                    textDocument: { uri: originalUri },
                    position,
                } as IsInsideHtmlRegionRequest.ParamsType);

                const result = await unwrapCompletionArray(next(document, position, context, token)) as ProtocolCompletionItem[];

                if (!isInsideHtmlRegion) {
                    return result;
                }

                virtualDocumentContents.set(originalUri, document.getText());

                const encodedUri = encodeURIComponent(originalUri);
                const vdocUri = Uri.parse(`embedded-content://html/${encodedUri}.html`);
                const htmlCompletionList = await commands.executeCommand<CompletionList<CompletionItem>>(
                    'vscode.executeCompletionItemProvider',
                    vdocUri,
                    position,
                    context.triggerCharacter,
                );

                const htmlItems = htmlCompletionList
                    .items
                    .map(item => {
                        const protoItem = Object.assign(
                            new ProtocolCompletionItem(item.label),
                            item,
                        );

                        protoItem.documentationFormat = MarkupKind.Markdown;

                        return protoItem;
                    });

                return [
                    ...htmlItems,
                    ...result,
                ];
            },
        },
    };

    const client = new LanguageClient(
        'twiggy-language-server ' + workspaceUri,
        'Twiggy Language Server ' + workspaceUri,
        serverOptions,
        clientOptions,
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
