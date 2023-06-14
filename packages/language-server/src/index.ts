import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateTwigDocument } from './utils/validate-twig-document';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize(() => {
  return {
    capabilities: {},
  };
});

documents.onDidChangeContent((change) => {
  validateTwigDocument(change.document, connection);
});

documents.listen(connection);
connection.listen();
