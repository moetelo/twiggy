import { CompletionParams, Connection, WorkspaceFolder } from 'vscode-languageserver/node';
import { findNodeByPosition } from '../utils/node';
import { templatePaths } from './template-paths';
import { globalVariables } from './global-variables';
import { localVariables } from './local-variables';
import { functions } from './functions';
import { filters } from './filters';
import { forLoop } from './for-loop';
import { EmptyEnvironment, IFrameworkTwigEnvironment } from '../twigEnvironment';
import { variableProperties } from './variableProperties';
import { snippets } from './snippets';
import { keywords } from './keywords';
import { DocumentCache } from '../documents';
import { symfonyRouteNames } from './routes';

export class CompletionProvider {
    #symfonyRouteNames: string[] = [];
    #environment: IFrameworkTwigEnvironment = EmptyEnvironment;

    constructor(
        private readonly connection: Connection,
        private readonly documentCache: DocumentCache,
        private readonly workspaceFolder: WorkspaceFolder,
    ) {
        this.connection.onCompletion(this.onCompletion.bind(this));
        this.connection.onCompletionResolve(item => item);
    }

    refresh(environment: IFrameworkTwigEnvironment) {
        this.#environment = environment;
        this.#symfonyRouteNames = Object.keys(environment.routes);
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

        const { environment } = this.#environment;

        return [
            ...snippets(cursorNode),
            ...keywords(cursorNode),
            ...localVariables(document, cursorNode),
            ...forLoop(cursorNode),
            ...globalVariables(cursorNode, environment?.Globals || []),
            ...functions(cursorNode, environment?.Functions || []),
            ...filters(cursorNode, environment?.Filters || []),
            ...symfonyRouteNames(cursorNode, this.#symfonyRouteNames),
            ...await variableProperties(document, this.documentCache, cursorNode),
            ...await templatePaths(
                cursorNode,
                this.workspaceFolder.uri,
                this.#environment.templateMappings,
            ),
        ];
    }
}
