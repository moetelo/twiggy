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
import { ConfigurationManager } from './configuration/configuration-manager';
import { DefinitionProvider } from './definitions';
import { SymbolProvider } from './symbols/SymbolProvider';
import {
    Command,
    ExecuteCommandProvider,
} from './commands/ExecuteCommandProvider';

export class Server {
    readonly connection: Connection;
    readonly documents = new TextDocuments(TextDocument);
    readonly documentCache = new DocumentCache();
    workspaceFolder!: WorkspaceFolder;
    clientCapabilities!: ClientCapabilities;

    readonly definitionProvider: DefinitionProvider;
    readonly completionProvider: CompletionProvider;

    constructor(connection: Connection) {
        this.connection = connection;

        new SemanticTokensProvider(this);
        new SymbolProvider(this);
        new HoverProvider(this);
        new SignatureHelpProvider(this);
        this.completionProvider = new CompletionProvider(this);
        this.definitionProvider = new DefinitionProvider(this);
        new ExecuteCommandProvider(this);

        connection.onInitialize(async (initializeParams: InitializeParams) => {
            this.workspaceFolder = initializeParams.workspaceFolders![0];
            this.clientCapabilities = initializeParams.capabilities;

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
            const doc = await this.documentCache.updateText(document.uri, document.getText());
            validateTwigDocument(connection, doc);
        });
        this.documents.listen(connection);
    }
}
