import {
  Connection,
  InitializeParams,
  ServerCapabilities,
  TextDocuments,
  WorkspaceFolder,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateTwigDocument } from './utils/validate-twig-document';
import { DocumentCache } from './document-cache';
import { HoverProvider } from './hovers/hover-provider';
import { CompletionProvider } from './completions/completion-provider';
import { SignatureHelpProvider } from './signature-helps/signature-help-provider';
import { semanticTokensLegend } from './semantic-tokens/tokens-provider';
import { SemanticTokensProvider } from './semantic-tokens/semantic-tokens-provider';

export class Server {
  connection: Connection;
  documents: TextDocuments<TextDocument>;
  documentCache!: DocumentCache;
  workspaceFolder!: WorkspaceFolder;

  constructor(connection: Connection) {
    this.connection = connection;
    this.documents = new TextDocuments(TextDocument);

    new HoverProvider(this);
    new CompletionProvider(this);
    new SignatureHelpProvider(this);
    new SemanticTokensProvider(this);

    // Bindings
    connection.onInitialize((initializeParams: InitializeParams) => {
      this.workspaceFolder = initializeParams.workspaceFolders![0];
      this.documentCache = new DocumentCache(this);

      const capabilities: ServerCapabilities = {
        hoverProvider: true,
        completionProvider: {
          resolveProvider: true,
          triggerCharacters: ['"', "'", '|', '.', '{'],
        },
        signatureHelpProvider: {
          triggerCharacters: ['(', ','],
        },
        semanticTokensProvider: {
          legend: semanticTokensLegend,
          full: true,
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
