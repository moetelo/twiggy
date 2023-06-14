import {
  Connection,
  Diagnostic,
  DiagnosticSeverity,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { parseTwig } from './parse-twig';
import { PreOrderCursorIterator } from './pre-order-cursor-iterator';
import { pointToPosition } from './point-to-position';

export async function validateTwigDocument(
  document: TextDocument,
  connection: Connection
): Promise<void> {
  const text = document.getText();
  const diagnostics: Diagnostic[] = [];
  const cst = await parseTwig(text);

  if (cst.rootNode.hasError()) {
    const cursor = cst.walk();
    const nodes = new PreOrderCursorIterator(cursor);

    for (const node of nodes) {
      if (node.nodeType === 'ERROR') {
        const diagnostic: Diagnostic = {
          severity: DiagnosticSeverity.Warning,
          range: {
            start: pointToPosition(node.startPosition),
            end: pointToPosition(node.endPosition),
          },
          message: `Unexpected syntax`,
        };

        diagnostics.push(diagnostic);
      }
    }
  }

  connection.sendDiagnostics({ uri: document.uri, diagnostics });
}
