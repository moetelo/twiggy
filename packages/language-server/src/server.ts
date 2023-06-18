import { Connection, TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateTwigDocument } from './utils/validate-twig-document';
import { GlobalVariables } from './completions';

export class Server {
  connection: Connection;
  documents: TextDocuments<TextDocument>;

  constructor(connection: Connection) {
    this.connection = connection;
    this.documents = new TextDocuments(TextDocument);

    new GlobalVariables(this.connection);

    // Bindings
    connection.onInitialize(() => {
      return {
        capabilities: {
          completionProvider: {
            resolveProvider: true,
          },
        },
      };
    });

    this.documents.onDidChangeContent((change) => {
      validateTwigDocument(change.document, connection);
    });

    this.documents.listen(connection);
  }
}
