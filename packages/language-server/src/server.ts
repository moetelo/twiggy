import type {
    Connection,
    DidChangeWatchedFilesParams,
    InitializeError,
    InitializeParams,
    InitializeResult,
    ServerCapabilities,
    WorkspaceFolder,
} from 'vscode-languageserver';
import {
    DidChangeWatchedFilesNotification,
    ErrorCodes,
    FileChangeType,
    ResponseError,
    TextDocuments,
    WatchKind,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DiagnosticProvider } from './diagnostics';
import { DocumentCache } from './documents';
import { HoverProvider } from './hovers/HoverProvider';
import { CompletionProvider } from './completions/CompletionProvider';
import { SignatureHelpProvider } from './signature-helps/SignatureHelpProvider';
import { semanticTokensLegend } from './semantic-tokens/tokens-provider';
import { SemanticTokensProvider } from './semantic-tokens/SemanticTokensProvider';
import { ConfigurationManager } from './configuration/ConfigurationManager';
import { DefinitionProvider } from './definitions';
import { SymbolProvider } from './symbols/SymbolProvider';
import { initializeParser } from './utils/parser';
import { IsInsideHtmlRegionCommandProvider } from './commands/IsInsideHtmlRegionCommandProvider';
import { BracketSpacesInsertionProvider } from './autoInsertions/BracketSpacesInsertionProvider';
import { InlayHintProvider } from './inlayHints/InlayHintProvider';
import { ReferenceProvider } from './references/ReferenceProvider';
import { RenameProvider } from './references/RenameProvider';
import { FormattingProvider } from 'formatting/FormattingProvider';

const capabilities: ServerCapabilities = {
    hoverProvider: true,
    definitionProvider: true,
    documentSymbolProvider: true,
    completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['<', '"', "'", '|', '.', '{', '\\'],
    },
    signatureHelpProvider: {
        triggerCharacters: ['(', ','],
    },
    semanticTokensProvider: {
        legend: semanticTokensLegend,
        full: true,
    },
    inlayHintProvider: true,
    referencesProvider: true,
    documentFormattingProvider: true,
    renameProvider: {
        prepareProvider: true,
    },
};

export class Server {
    readonly documents = new TextDocuments(TextDocument);
    documentCache!: DocumentCache;
    workspaceFolder!: WorkspaceFolder;
    #hasDynamicFileWatcherSupport = false;

    definitionProvider!: DefinitionProvider;
    completionProvider!: CompletionProvider;
    bracketSpacesInsertionProvider!: BracketSpacesInsertionProvider;
    inlayHintProvider!: InlayHintProvider;
    signatureHelpProvider!: SignatureHelpProvider;
    referenceProvider!: ReferenceProvider;
    renameProvider!: RenameProvider;
    diagnosticProvider!: DiagnosticProvider;
    formattingProvider!: FormattingProvider;
    semanticTokensProvider!: SemanticTokensProvider;
    symbolProvider!: SymbolProvider;
    hoverProvider!: HoverProvider;
    isInsideHtmlRegionCommandProvider!: IsInsideHtmlRegionCommandProvider;
    configurationManager!: ConfigurationManager;

    constructor(private readonly connection: Connection) {
        connection.onInitialize(this.#onInitialize.bind(this));

        connection.onInitialized(() => {
            void this.#onInitialized();
        });

        connection.onDidChangeWatchedFiles((params) => {
            void this.#onDidChangeWatchedFiles(params);
        });

        this.documents.onDidSave(async ({ document }) => {
            await this.diagnosticProvider.lint(document.uri);
        });

        this.documents.onDidChangeContent(async ({ document }) => {
            const doc = await this.documentCache.updateText(document.uri, document.getText());
            await this.diagnosticProvider.validateReport(doc);
        });
    }

    listen() {
        this.documents.listen(this.connection);
        this.connection.listen();
    }

    async #onInitialize(initializeParams: InitializeParams): Promise<InitializeResult | ResponseError<InitializeError>> {
        const workspaceFolder = initializeParams.workspaceFolders?.at(0);
        if (!workspaceFolder) {
            return new ResponseError(ErrorCodes.InvalidParams, 'Twiggy needs a workspace folder.', { retry: false });
        }

        const { connection } = this;
        this.workspaceFolder = workspaceFolder;
        this.#hasDynamicFileWatcherSupport =
            initializeParams.capabilities.workspace?.didChangeWatchedFiles?.dynamicRegistration ?? false;

        const documentCache = new DocumentCache(workspaceFolder);
        this.documentCache = documentCache;

        this.diagnosticProvider = new DiagnosticProvider(connection, documentCache);
        await initializeParser();

        this.semanticTokensProvider = new SemanticTokensProvider(connection, documentCache);
        this.symbolProvider = new SymbolProvider(connection, documentCache);
        this.hoverProvider = new HoverProvider(connection, documentCache);
        this.signatureHelpProvider = new SignatureHelpProvider(connection, documentCache);
        this.referenceProvider = new ReferenceProvider(connection, documentCache);
        this.renameProvider = new RenameProvider(connection, documentCache);
        this.definitionProvider = new DefinitionProvider(
            connection,
            documentCache,
            workspaceFolder,
        );
        this.completionProvider = new CompletionProvider(
            connection,
            documentCache,
            workspaceFolder,
        );
        this.inlayHintProvider = new InlayHintProvider(connection, documentCache);
        this.isInsideHtmlRegionCommandProvider = new IsInsideHtmlRegionCommandProvider(connection, documentCache);
        this.formattingProvider = new FormattingProvider(connection, this.diagnosticProvider);
        this.bracketSpacesInsertionProvider = new BracketSpacesInsertionProvider(
            connection,
            this.documents,
        );

        return {
            capabilities,
        };
    }

    async #onInitialized() {
        if (this.#hasDynamicFileWatcherSupport) {
            await this.connection.client.register(DidChangeWatchedFilesNotification.type, {
                watchers: [
                    {
                        globPattern: '**/*.twig',
                        // oxlint-disable-next-line no-bitwise -- WatchKind is a bit set.
                        kind: WatchKind.Create | WatchKind.Change | WatchKind.Delete,
                    },
                ],
            });
        }

        this.configurationManager = new ConfigurationManager(
            this.connection,
            this.definitionProvider,
            this.inlayHintProvider,
            this.bracketSpacesInsertionProvider,
            this.completionProvider,
            this.signatureHelpProvider,
            this.documentCache,
            this.workspaceFolder,
            this.diagnosticProvider,
            this.formattingProvider,
        );

        await this.diagnosticProvider.lintWorkspace();
    }

    async #onDidChangeWatchedFiles(params: DidChangeWatchedFilesParams) {
        for (const change of params.changes) {
            if (change.type === FileChangeType.Deleted) {
                this.documentCache.remove(change.uri);
            } else {
                await this.documentCache.refresh(change.uri);
            }
        }
    }
}
