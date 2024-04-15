import {
    Connection,
    DidChangeConfigurationNotification,
    DidChangeConfigurationParams,
    WorkspaceFolder,
} from 'vscode-languageserver';
import { LanguageServerSettings, PhpFramework } from './LanguageServerSettings';
import { InlayHintProvider } from '../inlayHints/InlayHintProvider';
import { DocumentCache } from '../documents';
import { BracketSpacesInsertionProvider } from '../autoInsertions/BracketSpacesInsertionProvider';
import { CompletionProvider } from '../completions/CompletionProvider';
import { SignatureHelpProvider } from '../signature-helps/SignatureHelpProvider';
import { DefinitionProvider } from '../definitions';
import { documentUriToFsPath } from '../utils/uri';
import { PhpExecutor } from '../phpInterop/PhpExecutor';
import {
    IFrameworkTwigEnvironment,
    SymfonyTwigEnvironment,
    CraftTwigEnvironment,
    EmptyEnvironment,
} from '../twigEnvironment';

export class ConfigurationManager {
    readonly configurationSection = 'twiggy';

    readonly defaultSettings: LanguageServerSettings = {
        autoInsertSpaces: true,
        inlayHints: InlayHintProvider.defaultSettings,
        phpExecutable: 'php',
        symfonyConsolePath: './bin/console',
        framework: PhpFramework.Symfony,
    };

    constructor(
        connection: Connection,
        private readonly definitionProvider: DefinitionProvider,
        private readonly inlayHintProvider: InlayHintProvider,
        private readonly bracketSpacesInsertionProvider: BracketSpacesInsertionProvider,
        private readonly completionProvider: CompletionProvider,
        private readonly signatureHelpProvider: SignatureHelpProvider,
        private readonly documentCache: DocumentCache,
        private readonly workspaceFolder: WorkspaceFolder,
    ) {
        connection.client.register(DidChangeConfigurationNotification.type, { section: this.configurationSection });
        connection.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this));
    }

    async onDidChangeConfiguration({ settings }: DidChangeConfigurationParams) {
        const config: LanguageServerSettings = settings?.[this.configurationSection] || this.defaultSettings;

        this.inlayHintProvider.settings = config.inlayHints ?? InlayHintProvider.defaultSettings;
        this.bracketSpacesInsertionProvider.isEnabled = config.autoInsertSpaces ?? true;

        this.applySettings(EmptyEnvironment, null);

        if (config.phpBinConsoleCommand) {
            console.warn('`twiggy.phpBinConsoleCommand` does not work anymore. Use `twiggy.phpExecutable` and `twiggy.symfonyConsolePath` instead.');
        }

        if (config.framework === PhpFramework.Ignore) {
            return;
        }

        if (!config.framework) {
            console.warn('`twiggy.framework` is required.');
            return;
        }

        const workspaceDirectory = documentUriToFsPath(this.workspaceFolder.uri);

        const phpExecutor = new PhpExecutor(config.phpExecutable, workspaceDirectory);

        const twigEnvironment = config.framework === PhpFramework.Symfony
            ? new SymfonyTwigEnvironment(phpExecutor)
            : new CraftTwigEnvironment(phpExecutor);

        await twigEnvironment.refresh({
            symfonyConsolePath: config.symfonyConsolePath,
            workspaceDirectory,
        });

        this.applySettings(twigEnvironment, phpExecutor);
    }

    private applySettings(frameworkEnvironment: IFrameworkTwigEnvironment, phpExecutor: PhpExecutor | null) {
        this.definitionProvider.phpExecutor = phpExecutor;
        this.completionProvider.phpExecutor = phpExecutor;
        this.completionProvider.refresh(frameworkEnvironment);
        this.signatureHelpProvider.reindex(frameworkEnvironment);
        this.documentCache.configure(frameworkEnvironment);
    }
}
