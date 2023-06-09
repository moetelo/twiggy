import { createRequire } from 'module';
import { join, resolve } from 'path';
import {
  ExtensionContext,
  FileSystemWatcher,
  WorkspaceFolder,
  window,
  workspace,
} from 'vscode';
import { LanguageClient, ServerOptions } from 'vscode-languageclient/node.js';

const outputChannel = window.createOutputChannel('Twig Language Server');
const clients = new Map<string, LanguageClient>();
const extensions = ['.twig', '.html.twig'];
const filePattern = `**/*{${extensions.join(',')}}`;
let client: LanguageClient;

export async function activate(context: ExtensionContext) {
  // let fileWatcher = workspace.createFileSystemWatcher(filePattern);

  const module = context.asAbsolutePath(
		join('..', 'twig-language-server', 'out', 'index.js')
	);

  let serverOptions: ServerOptions = { module };
  client = new LanguageClient(
    'twig-language-server',
    'Twig Language Server',
    serverOptions,
    {
      outputChannel,
      // initializationOptions: {},
      documentSelector: [{ scheme: 'file', language: 'twig' }],
      // synchronize: { fileEvents: watcher },
    }
  );

  // clients.set(folderPath, client);

  await client.start();

  console.log('client started');
}

export async function deactivate(): Promise<void> {
  // await Promise.all([...clients.values()].map((client) => client.stop()));
  if (!client) {
		return undefined;
	}
	return client.stop();
}

// function findLanguageServer(workspaceDir: string): string | null {
//   // TODO: fix dynamic path from dev to prod
//   try {
//     return '../twig-language-server/out/index1.js';
//   } catch {
//     outputChannel.appendLine(`twig-language-server not found`);
//     return null;
//   }
// }

// async function addWorkspaceFolder(
//   workspaceFolder: WorkspaceFolder,
//   watcher: FileSystemWatcher,
//   context: ExtensionContext
// ): Promise<void> {
//   let folderPath = workspaceFolder.uri.fsPath;

//   if (clients.has(folderPath)) {
//     return;
//   }

//   let module = context.asAbsolutePath(
//     join('..', 'twig-language-server', 'out', 'index.js')
//   );

//   console.log(`${folderPath}/${filePattern}`);

//   let serverOptions: ServerOptions = { module };
//   let client = new LanguageClient(
//     'twig-language-server',
//     'Twig Language Server',
//     serverOptions,
//     {
//       workspaceFolder,
//       outputChannel,
//       // initializationOptions: {},
//       documentSelector: [
//         { scheme: 'file', pattern: `${folderPath}/${filePattern}` },
//       ],
//       // synchronize: { fileEvents: watcher },
//     }
//   );

//   clients.set(folderPath, client);

//   await client.start();

//   console.log('client started');
// }

// async function removeWorkspaceFolder(
//   workspaceFolder: WorkspaceFolder
// ): Promise<void> {
//   let folderPath = workspaceFolder.uri.fsPath;
//   let client = clients.get(folderPath);

//   if (client) {
//     clients.delete(folderPath);
//     await client.stop();
//   }
// }
