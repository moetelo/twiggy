import { InlayHint, InlayHintKind, InlayHintParams } from 'vscode-languageserver';
import { Server } from '../server';
import { PreOrderCursorIterator } from '../utils/node';
import { pointToPosition } from '../utils/position';

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

                const argNodes = currentNode.childForFieldName('arguments')?.namedChildren;
                if (!argNodes?.length) continue;

                const calledFunc = currentNode.childForFieldName('name')!.text;
                if (!calledFunc.includes('.')) continue;

                const [ importName, funcName ] = calledFunc.split('.');

                const importedDocument = await this.server.documentCache.resolveImport(document, importName);
                if (!importedDocument) return;

                await importedDocument.ensureParsed();

                const macro = importedDocument.locals.macro.find(macro => macro.name === funcName);
                if (!macro) return;

                const hints = argNodes
                    .slice(0, macro.args.length)
                    .map((arg, i): InlayHint => ({
                        position: pointToPosition(arg.startPosition),
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
