import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateTwigDocument } from './utils/validate-twig-document';
import * as completions from './completions';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize(() => {
  return {
    capabilities: {
      completionProvider: {
        resolveProvider: true,
      },
    },
  };
});

documents.onDidChangeContent((change) => {
  validateTwigDocument(change.document, connection);
});

for (const Klass of Object.values(completions)) {
  new Klass(connection);
}

documents.listen(connection);
connection.listen();
