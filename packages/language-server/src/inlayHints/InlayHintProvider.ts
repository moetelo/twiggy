import type { Connection, InlayHint, InlayHintParams } from 'vscode-languageserver';
import { InlayHintKind } from 'vscode-languageserver';
import { PreOrderCursorIterator, getNodeRange } from '../utils/node';
import { parseFunctionCall } from '../utils/node/parseFunctionCall';
import type { SyntaxNode } from 'web-tree-sitter';
import type { InlayHintSettings } from '../configuration/LanguageServerSettings';
import type { DocumentCache } from '../documents';

const toInlayHint = (node: SyntaxNode): InlayHint | undefined => {
    const range = getNodeRange(node);
    const nameNode = node.childForFieldName('name');
    if (!nameNode) return undefined;

    return {
        position: range.end,
        label: `{% ${node.type} ${nameNode.text} %}`,
        paddingLeft: true,
        kind: InlayHintKind.Type,
    };
};

export class InlayHintProvider {
    static readonly defaultSettings: InlayHintSettings = {
        macro: true,
        block: true,
        macroArguments: true,
    };

    settings = InlayHintProvider.defaultSettings;

    constructor(
        connection: Connection,
        private readonly documentCache: DocumentCache,
    ) {
        connection.languages.inlayHint.on(this.onInlayHint.bind(this));
    }

    async onInlayHint(params: InlayHintParams): Promise<InlayHint[] | undefined> {
        const { block, macro, macroArguments } = this.settings;
        if (!block && !macro && !macroArguments) return undefined;

        const document = await this.documentCache.get(params.textDocument.uri);

        const inlayHints: InlayHint[] = [];

        const nodes = new PreOrderCursorIterator(document.tree.walk());
        for (const node of nodes) {
            if (macroArguments && node.nodeType === 'call_expression') {
                const calledFunc = parseFunctionCall(node.currentNode);
                if (!calledFunc?.object || calledFunc.args.length === 0) continue;

                const importedDocument = await this.documentCache.resolveImport(
                    document,
                    calledFunc.object,
                );
                if (!importedDocument) continue;

                const calledMacro = importedDocument.locals.macro.find(
                    candidate => candidate.name === calledFunc.name,
                );
                if (!calledMacro) continue;

                const hints = calledFunc.args
                    .slice(0, calledMacro.args.length)
                    .map((arg, i): InlayHint => ({
                        position: arg.range.start,
                        label: `${calledMacro.args[i].name}:`,
                        kind: InlayHintKind.Parameter,
                        paddingRight: true,
                    }));

                inlayHints.push(...hints);
            }

            if (
                ((block && node.nodeType === 'block') || (macro && node.nodeType === 'macro')) &&
                node.startPosition.row !== node.endPosition.row
            ) {
                const hint = toInlayHint(node.currentNode);
                if (hint) inlayHints.push(hint);
            }
        }

        return inlayHints;
    }
}
