import {
  Connection,
  InitializeParams,
  ServerCapabilities,
  TextDocuments,
  WorkspaceFolder,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateTwigDocument } from './utils/validate-twig-document';
import { GlobalVariables } from './completions/global-variables';
import { DocumentCache } from './document-cache';
import { TemplateName } from './completions/template-name';
import { Variables } from './completions/local-variables';
import { Hovers } from './hovers';

export class Server {
  connection: Connection;
  documents: TextDocuments<TextDocument>;
  documentCache!: DocumentCache;
  workspaceFolder!: WorkspaceFolder;

  constructor(connection: Connection) {
    this.connection = connection;
    this.documents = new TextDocuments(TextDocument);

    // Completions
    new GlobalVariables(this);
    new TemplateName(this);
    new Variables(this);

    new Hovers(this);

    // Bindings
    connection.onInitialize((initializeParams: InitializeParams) => {
      this.workspaceFolder = initializeParams.workspaceFolders![0];
      this.documentCache = new DocumentCache(this);

      const capabilities: ServerCapabilities = {
        hoverProvider: true,
        completionProvider: {
          resolveProvider: true,
          triggerCharacters: ['"', "'"],
        },
      };

      return { capabilities };
    });

    this.documents.onDidChangeContent((change) => {
      validateTwigDocument(change.document, connection);

      // Update text in documentCache
      this.documentCache
        .getDocument(change.document.uri)
        ?.setText(change.document.getText());
    });

    this.documents.listen(connection);
  }
}
