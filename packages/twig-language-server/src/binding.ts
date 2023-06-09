import {
  Connection,
  InitializeParams,
  ServerCapabilities,
  TextDocumentSyncKind,
  TextDocuments,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateTwig } from './utils/validate-twig';

export const capabilities: ServerCapabilities = {
  textDocumentSync: TextDocumentSyncKind.Full,
};

export type BindingArgs = {
  openDocuments: TextDocuments<TextDocument>;
  connection: Connection;
};

export function bindLanguageServer(arg: BindingArgs): void {
  const { connection, openDocuments } = arg;

  connection.onInitialize((config: InitializeParams) => {
    return { capabilities };
  });

  openDocuments.onDidChangeContent((event) => {
    connection.console.log('onDidChangeContent1');
    console.log('onDidChangeContent2');
    // validateTwig(event.document);
  });
}
