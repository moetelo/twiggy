import { CompletionParams, Connection, WorkspaceFolder } from 'vscode-languageserver/node';
import { findNodeByPosition } from '../utils/node';
import { templatePaths } from './template-paths';
import { globalVariables } from './global-variables';
import { localVariables } from './local-variables';
import { functions } from './functions';
import { filters } from './filters';
import { forLoop } from './for-loop';
import { TwigEnvironment } from '../twigEnvironment/types';
import { variableProperties } from './variableProperties';
import { snippets } from './snippets';
import { keywords } from './keywords';
import { DocumentCache } from '../documents';
import { symfonyPathNames } from './symfonyPaths';

export class CompletionProvider {
    twigInfo?: TwigEnvironment;
    symfonyPathNames: string[] = [];

    constructor(
        private readonly connection: Connection,
        private readonly documentCache: DocumentCache,
        private readonly workspaceFolder: WorkspaceFolder,
    ) {
        this.connection.onCompletion(this.onCompletion.bind(this));
        this.connection.onCompletionResolve(item => item);
    }

    async onCompletion(params: CompletionParams) {
        const uri = params.textDocument.uri;
        const document = this.documentCache.get(uri);

        if (!document) {
            return;
        }

        const cursorNode = findNodeByPosition(document.tree.rootNode, params.position);

        if (!cursorNode) {
            return;
        }

        return [
            ...snippets(cursorNode),
            ...keywords(cursorNode),
            ...localVariables(document, cursorNode),
            ...forLoop(cursorNode),
            ...globalVariables(cursorNode, this.twigInfo?.Globals || []),
            ...functions(cursorNode, this.twigInfo?.Functions || []),
            ...filters(cursorNode, this.twigInfo?.Filters || []),
            ...symfonyPathNames(cursorNode, this.symfonyPathNames),
            ...await variableProperties(document, this.documentCache, cursorNode),
            ...await templatePaths(
                cursorNode,
                this.workspaceFolder.uri,
                this.twigInfo?.LoaderPaths || [],
            ),
        ];
    }
}
