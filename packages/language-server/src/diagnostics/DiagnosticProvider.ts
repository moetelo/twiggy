import { Connection, Diagnostic, DiagnosticSeverity, DiagnosticTag, DocumentUri, Range } from 'vscode-languageserver';
import { Document, DocumentCache } from 'documents';
import { PreOrderCursorIterator, getNodeRange, getStringNodeValue, isBlockIdentifier, isEmptyEmbedded, isPathInsideTemplateEmbedding } from 'utils/node';
import { SyntaxNode } from 'web-tree-sitter';
import { pointToPosition } from 'utils/position';
import { positionsEqual } from 'utils/position/comparePositions';
import { TwigCodeStyleFixer } from 'phpInterop/TwigCodeStyleFixer';

const createDiagnosticFromRange = (
    range: Range,
    message: string,
    severity: DiagnosticSeverity = DiagnosticSeverity.Warning,
): Diagnostic => ({
    severity,
    range,
    message,
});

const createDiagnostic = (
    node: SyntaxNode,
    message: string,
    severity: DiagnosticSeverity = DiagnosticSeverity.Warning,
): Diagnostic => createDiagnosticFromRange(
    getNodeRange(node),
    message,
    severity,
);


export class DiagnosticProvider {
    #twigCodeStyleFixer: TwigCodeStyleFixer | null = null;

    #lintMap = new Map<DocumentUri, Diagnostic[]>();

    constructor(
        private readonly connection: Connection,
        private readonly documentCache: DocumentCache,
    ) {
    }

    refresh(twigCodeStyleFixer: TwigCodeStyleFixer | null) {
        this.#twigCodeStyleFixer = twigCodeStyleFixer;
        this.#lintMap.clear();

        void this.lintWorkspace();
    }

    async validateNode(node: SyntaxNode, document: Document): Promise<Diagnostic | null> {
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


        if (isPathInsideTemplateEmbedding(node)) {
            const path = getStringNodeValue(node);
            const document = await this.documentCache.resolveByTwigPath(path);

            if (!document) {
                return createDiagnostic(node, `Template "${path}" not found`, DiagnosticSeverity.Error)
            }

            // found template, no errors
            return null;
        }

        if (isBlockIdentifier(node)) {
            if (node.parent?.type !== 'block') {
                let extendedDocument: Document | undefined = document;
                let documentName = "this document";

                const blockArgumentNode = node.parent!.namedChildren[0];
                const templateArgumentNode = node.parent!.namedChildren[1];

                if (templateArgumentNode) {
                    const path = getStringNodeValue(templateArgumentNode);
                    const document = await this.documentCache.resolveByTwigPath(path);

                    if (node.equals(templateArgumentNode)) {
                        if (!document) {
                            return createDiagnostic(templateArgumentNode, `Template "${path}" not found`, DiagnosticSeverity.Error)
                        }
                        // found template, no errors
                        // block existence will be checked in next pass
                        return null;
                    }

                    extendedDocument = document;
                    documentName = path;
                }

                const blockName = blockArgumentNode.type === 'string'
                    ? getStringNodeValue(blockArgumentNode)
                    : blockArgumentNode.text;

                let found = false;
                while (extendedDocument) {
                    const blockSymbol = extendedDocument.getBlock(blockName);
                    if (!blockSymbol || positionsEqual(blockSymbol.nameRange.start, getNodeRange(blockArgumentNode).start)) {
                        if (!extendedDocument.locals.extends) {
                            extendedDocument = void 0;
                        } else {
                            extendedDocument = await this.documentCache.resolveByTwigPath(extendedDocument.locals.extends);
                        }
                        continue;
                    }
                    found = true;
                    break;
                }
                if (!found) {
                    return createDiagnostic(blockArgumentNode, `Block "${blockName}" not found in ${documentName}`, DiagnosticSeverity.Error)
                }
            }
        }

        return null;
    }

    async validateTree(document: Document) {
        const { tree } = document;

        const diagnostics: Diagnostic[] = [];

        const cursor = tree.walk();

        for (const node of new PreOrderCursorIterator(cursor)) {
            const diagnostic = await this.validateNode(node.currentNode, document);

            if (!diagnostic) continue;

            diagnostics.push(diagnostic);
        }

        return diagnostics;
    }

    async validateReport(document: Document) {
        const diagnostics = await this.validate(document);
        const lints = this.#lintMap.get(document.uri) || [];

        await this.connection.sendDiagnostics({
            uri: document.uri,
            diagnostics: [
                ...diagnostics,
                ...lints,
            ],
        });
    }

    async validate(document: Document) {
        const syntaxDiagnostics = await this.validateTree(document);

        const blockScopedVariables = document.locals.block.flatMap(b => b.symbols.variable);
        const unusedVariables = [
            ...document.locals.variable,
            ...blockScopedVariables,
        ]
            .filter((variable) => variable.references.length === 0);

        const unusedVariablesDiagnostics = unusedVariables.map((variable): Diagnostic => ({
            severity: DiagnosticSeverity.Hint,
            range: variable.nameRange,
            message: `Unused variable`,
            tags: [ DiagnosticTag.Unnecessary ],
        }));

        return [
            ...syntaxDiagnostics,
            ...unusedVariablesDiagnostics,
        ];
    }

    async lint(uri: DocumentUri) {
        if (!this.#twigCodeStyleFixer) {
            return;
        }

        const lints = await this.#twigCodeStyleFixer.lint(uri) || [];

        if (!lints.length) {
            this.#lintMap.delete(uri);
        } else {
            this.#lintMap.set(uri, lints);
        }

        const document = await this.documentCache.get(uri);
        const diagnostics = await this.validate(document);

        await this.connection.sendDiagnostics({
            uri,
            diagnostics: [
                ...diagnostics,
                ...lints,
            ],
        });
    }

    async lintWorkspace() {
        if (!this.#twigCodeStyleFixer) {
            return;
        }

        const lints = await this.#twigCodeStyleFixer.lintWorkspace() || [];

        for (const { uri, diagnostics } of lints) {
            this.#lintMap.set(uri, diagnostics);

            await this.connection.sendDiagnostics({
                uri,
                diagnostics,
            });
        }
    }
}
