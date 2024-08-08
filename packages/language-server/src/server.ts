import {
    Connection,
    InitializeParams,
    ServerCapabilities,
    TextDocuments,
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
import {
    Command,
    ExecuteCommandProvider,
} from './commands/ExecuteCommandProvider';
import { initializeParser } from './utils/parser';
import { BracketSpacesInsertionProvider } from './autoInsertions/BracketSpacesInsertionProvider';
import { InlayHintProvider } from './inlayHints/InlayHintProvider';
import { ReferenceProvider } from './references/ReferenceProvider';
import { RenameProvider } from './references/RenameProvider';

export class Server {
    readonly documents = new TextDocuments(TextDocument);
    documentCache!: DocumentCache;
    workspaceFolder!: WorkspaceFolder;

    definitionProvider!: DefinitionProvider;
    completionProvider!: CompletionProvider;
    bracketSpacesInsertionProvider!: BracketSpacesInsertionProvider;
    inlayHintProvider!: InlayHintProvider;
    signatureHelpProvider!: SignatureHelpProvider;
    referenceProvider!: ReferenceProvider;
    renameProvider!: RenameProvider;
    diagnosticProvider: DiagnosticProvider;

    constructor(connection: Connection) {
        this.diagnosticProvider = new DiagnosticProvider(connection);

        connection.onInitialize(async (initializeParams: InitializeParams) => {
            this.workspaceFolder = initializeParams.workspaceFolders![0];

            const documentCache = new DocumentCache(this.workspaceFolder);
            this.documentCache = documentCache;

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
            new ExecuteCommandProvider(connection, documentCache);
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
                renameProvider: {
                    prepareProvider: true,
                },
                executeCommandProvider: {
                    commands: [
                        `${Command.IsInsideHtmlRegion}(${this.workspaceFolder.uri})`,
                    ],
                },
            };

            return {
                capabilities,
            };
        });

        connection.onInitialized(async () => {
            new ConfigurationManager(
                connection,
                this.definitionProvider,
                this.inlayHintProvider,
                this.bracketSpacesInsertionProvider,
                this.completionProvider,
                this.signatureHelpProvider,
                this.documentCache,
                this.workspaceFolder,
            );
        });

        this.documents.onDidChangeContent(async ({ document }) => {
            const doc = await this.documentCache.updateText(document.uri, document.getText());
            await this.diagnosticProvider.validate(doc);
        });
        this.documents.listen(connection);
    }
}
