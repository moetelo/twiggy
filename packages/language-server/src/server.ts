import {
    Connection,
    DidChangeWatchedFilesNotification,
    FileChangeType,
    InitializeParams,
    ServerCapabilities,
    TextDocuments,
    WatchKind,
    WorkspaceFolder,
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

    constructor(connection: Connection) {
        connection.onInitialize(async (initializeParams: InitializeParams) => {
            this.workspaceFolder = initializeParams.workspaceFolders![0];
            this.#hasDynamicFileWatcherSupport =
                initializeParams.capabilities.workspace?.didChangeWatchedFiles?.dynamicRegistration ?? false;

            const documentCache = new DocumentCache(this.workspaceFolder);
            this.documentCache = documentCache;

            this.diagnosticProvider = new DiagnosticProvider(connection, documentCache);
            await initializeParser();

            new SemanticTokensProvider(connection, documentCache);
            new SymbolProvider(connection, documentCache);
            new HoverProvider(connection, documentCache);
            this.signatureHelpProvider = new SignatureHelpProvider(connection, documentCache);
            this.referenceProvider = new ReferenceProvider(connection, documentCache);
            this.renameProvider = new RenameProvider(connection, documentCache);
            this.definitionProvider = new DefinitionProvider(
                connection,
                documentCache,
                this.workspaceFolder,
            );
            this.completionProvider = new CompletionProvider(
                connection,
                documentCache,
                this.workspaceFolder,
            );
            this.inlayHintProvider = new InlayHintProvider(connection, documentCache);
            new IsInsideHtmlRegionCommandProvider(connection, documentCache);
            this.formattingProvider = new FormattingProvider(connection, this.diagnosticProvider);
            this.bracketSpacesInsertionProvider = new BracketSpacesInsertionProvider(
                connection,
                this.documents,
            );

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

            return {
                capabilities,
            };
        });

        connection.onInitialized(async () => {
            if (this.#hasDynamicFileWatcherSupport) {
                await connection.client.register(DidChangeWatchedFilesNotification.type, {
                    watchers: [
                        {
                            globPattern: '**/*.twig',
                            kind: WatchKind.Create | WatchKind.Change | WatchKind.Delete,
                        },
                    ],
                });
            }

            new ConfigurationManager(
                connection,
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
        });

        connection.onDidChangeWatchedFiles(async (params) => {
            for (const change of params.changes) {
                if (change.type === FileChangeType.Deleted) {
                    this.documentCache.remove(change.uri);
                } else {
                    await this.documentCache.refresh(change.uri);
                }
            }
        });

        this.documents.onDidSave(async ({ document }) => {
            await this.diagnosticProvider.lint(document.uri);
        });

        this.documents.onDidChangeContent(async ({ document }) => {
            const doc = await this.documentCache.updateText(document.uri, document.getText());
            await this.diagnosticProvider.validateReport(doc);
        });

        this.documents.listen(connection);
    }
}
