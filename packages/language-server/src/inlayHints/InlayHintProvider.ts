import { InlayHint, InlayHintKind, InlayHintParams } from 'vscode-languageserver';
import { Server } from '../server';
import { PreOrderCursorIterator } from '../utils/node';
import { parseFunctionCall } from '../utils/node/parseFunctionCall';

export class InlayHintProvider {
    readonly server: Server;
    isEnabled = true;

    constructor(server: Server) {
        this.server = server;

        this.server.connection.languages.inlayHint.on(
            this.onInlayHint.bind(this),
        );
    }

    async onInlayHint(params: InlayHintParams): Promise<InlayHint[] | undefined> {
        if (!this.isEnabled) return;

        const document = this.server.documentCache.get(params.textDocument.uri);

        if (!document) {
            return;
        }

        const inlayHints: InlayHint[] = [];

        const nodes = new PreOrderCursorIterator(document.tree.walk());
        for (const node of nodes) {
            if (node.nodeType === 'call_expression') {
                const currentNode = node.currentNode();

                const calledFunc = parseFunctionCall(currentNode);
                if (!calledFunc || !calledFunc.object || !calledFunc.args.length) return;

                const importedDocument = await this.server.documentCache.resolveImport(document, calledFunc.object);
                if (!importedDocument) return;

                await importedDocument.ensureParsed();

                const macro = importedDocument.locals.macro.find(macro => macro.name === calledFunc.name);
                if (!macro) return;

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
        }

        return inlayHints;
    }
}
