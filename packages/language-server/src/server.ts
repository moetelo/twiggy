import {
  Connection,
  InitializeParams,
  ServerCapabilities,
  TextDocuments,
  WorkspaceFolder,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateTwigDocument } from './utils/validate-twig-document';
import { GlobalVariables } from './completions';
import { DocumentCache } from './document-cache';

export class Server {
  connection: Connection;
  documents: TextDocuments<TextDocument>;
  documentCache!: DocumentCache;
  workspaceFolder!: WorkspaceFolder;

  constructor(connection: Connection) {
    this.connection = connection;
    this.documents = new TextDocuments(TextDocument);

    new GlobalVariables(this.connection);

    // Bindings
    connection.onInitialize((initializeParams: InitializeParams) => {
      this.workspaceFolder = initializeParams.workspaceFolders![0];
      this.documentCache = new DocumentCache(this);

      const capabilities: ServerCapabilities = {
        completionProvider: {
          resolveProvider: true,
        },
      };

      return { capabilities };
    });

    this.documents.onDidChangeContent((change) => {
      validateTwigDocument(change.document, connection);
    });

    this.documents.listen(connection);
  }
}
