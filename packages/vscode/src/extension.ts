import * as path from 'path';
import {
  workspace,
  ExtensionContext,
  window,
  WorkspaceFolder,
  FileSystemWatcher,
} from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

const outputChannel = window.createOutputChannel('Twig Language Server');
const clients = new Map<string, LanguageClient>();
const filePattern = `**/*.twig`;

export function activate(context: ExtensionContext) {
  const fileWatcher = workspace.createFileSystemWatcher(filePattern);

  context.subscriptions.push(fileWatcher);

  workspace.workspaceFolders?.forEach((folder) =>
    addWorkspaceFolder(folder, fileWatcher, context)
  );

  workspace.onDidChangeWorkspaceFolders(({ added, removed }) => {
    added.forEach((folder) => addWorkspaceFolder(folder, fileWatcher, context));
    removed.forEach((folder) => removeWorkspaceFolder(folder));
  });
}

export async function deactivate(): Promise<void> {
  for (const client of clients.values()) {
    await client.stop();
  }
}

async function addWorkspaceFolder(
  workspaceFolder: WorkspaceFolder,
  watcher: FileSystemWatcher,
  context: ExtensionContext
): Promise<void> {
  const folderPath = workspaceFolder.uri.fsPath;

  if (clients.has(folderPath)) {
    return;
  }

  const module = context.asAbsolutePath(
    path.join('..', 'language-server', 'out', 'index.js')
  );

  const serverOptions: ServerOptions = {
    run: { module, transport: TransportKind.ipc },
    debug: {
      module,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', `--inspect=6009`] },
    },
  };

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
    synchronize: {
      fileEvents: watcher,
    },
  };

  const client = new LanguageClient(
    'twig-language-server',
    'Twig Language Server',
    serverOptions,
    clientOptions
  );

  clients.set(folderPath, client);

  await client.start();
}

async function removeWorkspaceFolder(
  workspaceFolder: WorkspaceFolder
): Promise<void> {
  const folderPath = workspaceFolder.uri.fsPath;
  const client = clients.get(folderPath);

  if (client) {
    clients.delete(folderPath);

    await client.stop();
  }
}
