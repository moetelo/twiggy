import { Connection, Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { Document } from '../documents';
import { PreOrderCursorIterator, getNodeRange, isEmptyEmbedded } from '../utils/node';
import { SyntaxNode, Tree } from 'web-tree-sitter';

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
