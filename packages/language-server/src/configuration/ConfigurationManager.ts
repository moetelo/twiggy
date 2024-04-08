import {
    Connection,
    DidChangeConfigurationNotification,
    DidChangeConfigurationParams,
    WorkspaceFolder,
} from 'vscode-languageserver';
import { LanguageServerSettings, PhpFramework } from './LanguageServerSettings';
import { InlayHintProvider } from '../inlayHints/InlayHintProvider';
import { TemplatePathMapping, TwigEnvironment } from '../twigEnvironment/types';
import { DocumentCache } from '../documents';
import { BracketSpacesInsertionProvider } from '../autoInsertions/BracketSpacesInsertionProvider';
import { CompletionProvider } from '../completions/CompletionProvider';
import { fileStat } from '../utils/files/fileStat';
import { SignatureHelpProvider } from '../signature-helps/SignatureHelpProvider';
import { getRoutes, getTwigEnvironment } from '../twigEnvironment';
import { documentUriToFsPath } from '../utils/uri';

export class ConfigurationManager {
    readonly configurationSection = 'twiggy';
    readonly defaultMappings: TemplatePathMapping[] = [
        { namespace: '', directory: 'templates' },
    ];

    readonly defaultSettings: LanguageServerSettings = {
        autoInsertSpaces: true,
        inlayHints: InlayHintProvider.defaultSettings,
        phpExecutable: 'php',
        symfonyConsolePath: './bin/console',
        framework: PhpFramework.Symfony,
    };

    constructor(
        connection: Connection,
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

        this.applySettings(undefined, []);

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

        if (!config.phpExecutable) {
            console.warn('`twiggy.phpExecutable` is not configured. Some features will be disabled.');
            return;
        }

        if (
            config.framework === PhpFramework.Symfony
            && (!config.symfonyConsolePath || !await fileStat(config.symfonyConsolePath))
        ) {
            console.warn(
                `Symfony console file not found at ${config.symfonyConsolePath}.\n`
                + 'For Symfony project, set `twiggy.phpExecutable` and `twiggy.symfonyConsolePath`.');
            return;
        }

        const twigEnvironmentArgs = {
            phpExecutable: config.phpExecutable,
            symfonyConsolePath: config.symfonyConsolePath,
            workspaceDirectory: documentUriToFsPath(this.workspaceFolder.uri),
            framework: config.framework,
        };

        const twigEnvironment = await getTwigEnvironment(twigEnvironmentArgs);
        const routeNameToPath = await getRoutes(twigEnvironmentArgs);
        const routeNames = Object.keys(routeNameToPath);

        if (twigEnvironment) {
            console.info(
                `Collected`
                + ` ${twigEnvironment.Functions.length} functions,`
                + ` ${twigEnvironment.Filters.length} filters,`
                + ` ${twigEnvironment.Globals.length} globals and ${twigEnvironment.LoaderPaths.length} loader paths.`,
            );
        }

        if (routeNames.length) {
            console.info(`Collected ${routeNames.length} routes.`);
        }

        this.applySettings(twigEnvironment, routeNames);
    }

    private applySettings(
        twigEnvironment: TwigEnvironment | undefined,
        symfonyRouteNames: string[],
    ) {
        const templateMappings = twigEnvironment?.LoaderPaths?.length
            ? twigEnvironment.LoaderPaths
            : this.defaultMappings;

        this.completionProvider.twigEnvironment = twigEnvironment;
        this.completionProvider.templateMappings = templateMappings;
        this.completionProvider.symfonyRouteNames = symfonyRouteNames;

        this.signatureHelpProvider.initialize(twigEnvironment);

        this.documentCache.templateMappings = templateMappings?.length
            ? templateMappings
            : this.defaultMappings;
    }
}
