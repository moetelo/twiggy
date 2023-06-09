import {
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticSeverity,
  InitializeParams,
  ProposedFeatures,
  ServerCapabilities,
  TextDocumentSyncKind,
  TextDocuments,
  createConnection,
} from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
// import { bindLanguageServer } from './binding.js';

const connection = createConnection(ProposedFeatures.all);
const openDocuments = new TextDocuments(TextDocument);
const capabilities: ServerCapabilities = {
  textDocumentSync: TextDocumentSyncKind.Full,
};

connection.onInitialize((config: InitializeParams) => {
  return { capabilities };
});

// openDocuments.onDidChangeContent(({ document }) => {
//   const diagnostics: Diagnostic[] = [];
//   const { errors } = parse(document.getText());

//   for (const error in errors) {
//     const diagnostic: Diagnostic = {
//       severity: DiagnosticSeverity.Warning,
//       range: {
//         start: document.positionAt(0),
//         end: document.positionAt(10),
//       },
//       message: error,
//       source: 'twig',
//     };

//     diagnostics.push(diagnostic);
//   }

//   connection.sendDiagnostics({ uri: document.uri, diagnostics });
// });

openDocuments.listen(connection);
connection.listen();

connection.console.log('server started');
