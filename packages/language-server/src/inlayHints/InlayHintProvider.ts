import { Connection, InlayHint, InlayHintKind, InlayHintParams } from 'vscode-languageserver';
import { PreOrderCursorIterator, getNodeRange } from '../utils/node';
import { parseFunctionCall } from '../utils/node/parseFunctionCall';
import { SyntaxNode } from 'web-tree-sitter';
import { InlayHintSettings } from '../configuration/LanguageServerSettings';
import { DocumentCache } from '../documents';

const toInlayHint = (node: SyntaxNode): InlayHint => {
    const range = getNodeRange(node);
    const nameNode = node.childForFieldName('name')!;

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
        connection.languages.inlayHint.on(
            this.onInlayHint.bind(this),
        );
    }

    async onInlayHint(params: InlayHintParams): Promise<InlayHint[] | undefined> {
        const { block, macro, macroArguments } = this.settings;
        if (!block && !macro && !macroArguments) return;

        const document = this.documentCache.get(params.textDocument.uri);

        if (!document) {
            return;
        }

        const inlayHints: InlayHint[] = [];

        const nodes = new PreOrderCursorIterator(document.tree.walk());
        for (const node of nodes) {
            if (macroArguments && node.nodeType === 'call_expression') {
                const calledFunc = parseFunctionCall(node.currentNode);
                if (!calledFunc || !calledFunc.object || !calledFunc.args.length) continue;

                const importedDocument = await this.documentCache.resolveImport(document, calledFunc.object);
                if (!importedDocument) continue;

                const macro = importedDocument.locals.macro.find(macro => macro.name === calledFunc.name);
                if (!macro) continue;

                const hints = calledFunc.args
                    .slice(0, macro.args.length)
                    .map((arg, i): InlayHint => ({
                        position: arg.range.start,
                        label: `${macro.args[i].name}:`,
                        kind: InlayHintKind.Parameter,
                        paddingRight: true,
                    }));

                inlayHints.push(...hints);
            }

            if (
                (block && node.nodeType === 'block' || macro && node.nodeType === 'macro')
                && node.startPosition.row !== node.endPosition.row
            ) {
                const hint = toInlayHint(node.currentNode);
                inlayHints.push(hint);
            }
        }

        return inlayHints;
    }
}
