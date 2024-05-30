import { CompletionParams, Connection, WorkspaceFolder } from 'vscode-languageserver/node';
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
import { phpClasses } from './phpClasses';
import { documentUriToFsPath } from '../utils/uri';
import { IPhpExecutor } from '../phpInterop/IPhpExecutor';
import { ExpressionTypeResolver } from '../typing/ExpressionTypeResolver';
import { ITypeResolver } from '../typing/ITypeResolver';
import { IExpressionTypeResolver } from '../typing/IExpressionTypeResolver';

export class CompletionProvider {
    #symfonyRouteNames: string[] = [];
    #environment: IFrameworkTwigEnvironment = EmptyEnvironment;
    workspaceFolderPath: string;
    #phpExecutor: IPhpExecutor | null = null;
    #expressionTypeResolver: IExpressionTypeResolver | null = null;

    constructor(
        private readonly connection: Connection,
        private readonly documentCache: DocumentCache,
        workspaceFolder: WorkspaceFolder,
    ) {
        this.connection.onCompletion(this.onCompletion.bind(this));
        this.connection.onCompletionResolve(item => item);
        this.workspaceFolderPath = documentUriToFsPath(workspaceFolder.uri);
    }

    refresh(
        environment: IFrameworkTwigEnvironment,
        phpExecutor: IPhpExecutor | null,
        typeResolver: ITypeResolver | null,
    ) {
        this.#environment = environment;
        this.#symfonyRouteNames = Object.keys(environment.routes);
        this.#phpExecutor = phpExecutor;
        this.#expressionTypeResolver = typeResolver ? new ExpressionTypeResolver(typeResolver) : null;
    }

    async onCompletion(params: CompletionParams) {
        const document = this.documentCache.get(params.textDocument.uri);
        if (!document) {
            return;
        }

        const cursorNode = document.deepestAt(params.position);
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
            ...await phpClasses(cursorNode, this.#phpExecutor),
            ...await variableProperties(document, this.documentCache, cursorNode, this.#expressionTypeResolver, params.position),
            ...await templatePaths(
                cursorNode,
                this.workspaceFolderPath,
                this.#environment.templateMappings,
            ),
        ];
    }
}
