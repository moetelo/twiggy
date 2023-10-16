import { InlayHint, InlayHintKind, InlayHintParams } from 'vscode-languageserver';
import { Server } from '../server';
import { PreOrderCursorIterator, getNodeRange } from '../utils/node';
import { parseFunctionCall } from '../utils/node/parseFunctionCall';
import { SyntaxNode } from 'web-tree-sitter';
import { InlayHintSettings } from '../configuration/LanguageServerSettings';

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

    readonly server: Server;
    settings = InlayHintProvider.defaultSettings;

    constructor(server: Server) {
        this.server = server;

        this.server.connection.languages.inlayHint.on(
            this.onInlayHint.bind(this),
        );
    }

    async onInlayHint(params: InlayHintParams): Promise<InlayHint[] | undefined> {
        const { block, macro, macroArguments } = this.settings;
        if (!block && !macro && !macroArguments) return;

        const document = this.server.documentCache.get(params.textDocument.uri);

        if (!document) {
            return;
        }

        const inlayHints: InlayHint[] = [];

        const nodes = new PreOrderCursorIterator(document.tree.walk());
        for (const node of nodes) {
            if (macroArguments && node.nodeType === 'call_expression') {
                const currentNode = node.currentNode();

                const calledFunc = parseFunctionCall(currentNode);
                if (!calledFunc || !calledFunc.object || !calledFunc.args.length) continue;

                const importedDocument = await this.server.documentCache.resolveImport(document, calledFunc.object);
                if (!importedDocument) continue;

                await importedDocument.ensureParsed();

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
                const hint = toInlayHint(node.currentNode());
                inlayHints.push(hint);
            }
        }

        return inlayHints;
    }
}
