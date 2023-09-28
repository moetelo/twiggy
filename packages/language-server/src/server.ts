import {
    ClientCapabilities,
    Connection,
    InitializeParams,
    ServerCapabilities,
    TextDocuments,
    WorkspaceFolder,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateTwigDocument } from './utils/validate-twig-document';
import { DocumentCache } from './document-cache';
import { HoverProvider } from './hovers/hover-provider';
import { CompletionProvider } from './completions/completion-provider';
import { SignatureHelpProvider } from './signature-helps/signature-help-provider';
import { semanticTokensLegend } from './semantic-tokens/tokens-provider';
import { SemanticTokensProvider } from './semantic-tokens/semantic-tokens-provider';
import { ConfigurationManager } from './configuration/configuration-manager';
import { DefinitionProvider } from './definitions/definition-provider';
import { SymbolProvider } from './symbols/symbol-provider';
import {
    Command,
    ExecuteCommandProvider,
} from './commands/ExecuteCommandProvider';

export class Server {
    readonly connection: Connection;
    readonly documents: TextDocuments<TextDocument>;
    documentCache!: DocumentCache;
    workspaceFolder!: WorkspaceFolder;

    definitionProvider: DefinitionProvider;

    clientCapabilities!: ClientCapabilities;
    completionProvider: CompletionProvider;

    constructor(connection: Connection) {
        this.connection = connection;
        this.documents = new TextDocuments(TextDocument);

        new SemanticTokensProvider(this);
        new SymbolProvider(this);
        new HoverProvider(this);
        new SignatureHelpProvider(this);
        this.completionProvider = new CompletionProvider(this);
        this.definitionProvider = new DefinitionProvider(this);
        new ExecuteCommandProvider(this);

        // Bindings
        connection.onInitialize((initializeParams: InitializeParams) => {
            this.workspaceFolder = initializeParams.workspaceFolders![0];
            this.documentCache = new DocumentCache(this.workspaceFolder);

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

        this.documents.onDidChangeContent((change) => {
            validateTwigDocument(change.document, connection);

            // Update text in documentCache
            this.documentCache
                .getDocument(change.document.uri)
                ?.setText(change.document.getText());
        });

        this.documents.listen(connection);
    }
}
