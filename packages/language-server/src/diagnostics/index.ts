import {
    Connection,
    Diagnostic,
    DiagnosticSeverity,
} from 'vscode-languageserver';
import { getNodeRange, PreOrderCursorIterator } from '../utils/node';
import { Document } from '../documents';

// TODO: DiagnosticProvider
export async function validateTwigDocument(
    connection: Connection,
    { tree, uri }: Document,
): Promise<void> {
    if (!tree.rootNode.hasError()) {
        await connection.sendDiagnostics({ uri, diagnostics: [] });
        return;
    }

    const cursor = tree.walk();
    const nodes = new PreOrderCursorIterator(cursor);
    const diagnostics: Diagnostic[] = [];

    for (const node of nodes) {
        if (node.nodeType === 'ERROR') {
            const diagnostic: Diagnostic = {
                severity: DiagnosticSeverity.Warning,
                range: getNodeRange(node),
                message: `Unexpected syntax`,
            };

            diagnostics.push(diagnostic);
        }
    }

    await connection.sendDiagnostics({ uri, diagnostics });
}
