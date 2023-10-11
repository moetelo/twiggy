import {
    ClientCapabilities,
    Connection,
    InitializeParams,
    ServerCapabilities,
    TextDocuments,
    WorkspaceFolder,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateTwigDocument } from './diagnostics';
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

export class Server {
    readonly connection: Connection;
    readonly documents = new TextDocuments(TextDocument);
    documentCache!: DocumentCache;
    workspaceFolder!: WorkspaceFolder;
    clientCapabilities!: ClientCapabilities;

    readonly definitionProvider: DefinitionProvider;
    readonly completionProvider: CompletionProvider;
    readonly bracketSpacesInsertionProvider: BracketSpacesInsertionProvider;
    readonly inlayHintProvider: InlayHintProvider;

    constructor(connection: Connection) {
        this.connection = connection;

        new SemanticTokensProvider(this);
        new SymbolProvider(this);
        new HoverProvider(this);
        new SignatureHelpProvider(this);
        this.completionProvider = new CompletionProvider(this);
        this.definitionProvider = new DefinitionProvider(this);
        this.bracketSpacesInsertionProvider =new BracketSpacesInsertionProvider(this);
        this.inlayHintProvider = new InlayHintProvider(this);
        new ExecuteCommandProvider(this);

        connection.onInitialize(async (initializeParams: InitializeParams) => {
            this.workspaceFolder = initializeParams.workspaceFolders![0];
            this.clientCapabilities = initializeParams.capabilities;

            this.documentCache = new DocumentCache(this.workspaceFolder);
            await initializeParser();

            const capabilities: ServerCapabilities = {
                hoverProvider: true,
                definitionProvider: true,
                documentSymbolProvider: true,
                completionProvider: {
                    resolveProvider: true,
                    triggerCharacters: ['"', "'", '|', '.', '{'],
                },
                signatureHelpProvider: {
                    triggerCharacters: ['(', ','],
                },
                semanticTokensProvider: {
                    legend: semanticTokensLegend,
                    full: true,
                },
                inlayHintProvider: true,
                executeCommandProvider: {
                    commands: Object.values(Command),
                },
            };

            return { capabilities };
        });

        this.connection.onInitialized(async () => {
            if (this.clientCapabilities.workspace?.didChangeConfiguration) {
                new ConfigurationManager(this);
            }
        });

        this.documents.onDidChangeContent(async ({ document }) => {
            const doc = this.documentCache.updateText(document.uri, document.getText());
            await validateTwigDocument(connection, doc);
        });
        this.documents.listen(connection);
    }
}
