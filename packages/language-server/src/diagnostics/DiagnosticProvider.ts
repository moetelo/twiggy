import { Connection, Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { Document } from '../documents';
import { PreOrderCursorIterator, getNodeRange, isEmptyEmbedded } from '../utils/node';
import { SyntaxNode, Tree } from 'web-tree-sitter';
import { pointToPosition } from '../utils/position';

const createDiagnostic = (node: SyntaxNode, message: string): Diagnostic => ({
    severity: DiagnosticSeverity.Warning,
    range: getNodeRange(node),
    message,
});

export class DiagnosticProvider {
    constructor(
        private readonly connection: Connection,
    ) {
    }

    validateNode(node: SyntaxNode): Diagnostic | null {
        if (node.type === 'ERROR') {
            return createDiagnostic(node, 'Unexpected syntax');
        }

        if (node.type === 'if' && !node.childForFieldName('expr')) {
            const diag = createDiagnostic(node, 'Empty if condition');

            // {% if %}
            //        ^
            const ifEmbeddedEnd = node.descendantsOfType('embedded_end')[0];
            diag.range.end = pointToPosition(ifEmbeddedEnd.endPosition);
            return diag;
        }

        if (isEmptyEmbedded(node)) {
            return createDiagnostic(node, `Empty ${node.type} block`);
        }

        return null;
    }

    validateTree(tree: Tree) {
        const diagnostics: Diagnostic[] = [];

        const cursor = tree.walk();

        for (const node of new PreOrderCursorIterator(cursor)) {
            const diagnostic = this.validateNode(node.currentNode);

            if (!diagnostic) continue;

            diagnostics.push(diagnostic);
        }

        return diagnostics;
    }

    async validate(document: Document) {
        const diagnostics = this.validateTree(document.tree);
        await this.connection.sendDiagnostics({
            uri: document.uri,
            diagnostics,
        });
    }

}
