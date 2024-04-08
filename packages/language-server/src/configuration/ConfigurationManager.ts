import {
    Connection,
    DidChangeConfigurationNotification,
    DidChangeConfigurationParams,
} from 'vscode-languageserver';
import { LanguageServerSettings } from './LanguageServerSettings';
import { InlayHintProvider } from '../inlayHints/InlayHintProvider';
import { TemplatePathMapping, TwigEnvironment } from '../twigEnvironment/types';
import { DocumentCache } from '../documents';
import { BracketSpacesInsertionProvider } from '../autoInsertions/BracketSpacesInsertionProvider';
import { CompletionProvider } from '../completions/CompletionProvider';
import * as symfony from '../twigEnvironment/symfony';
import { fileStat } from '../utils/files/fileStat';
import { SignatureHelpProvider } from '../signature-helps/SignatureHelpProvider';

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
    };

    constructor(
        connection: Connection,
        private readonly inlayHintProvider: InlayHintProvider,
        private readonly bracketSpacesInsertionProvider: BracketSpacesInsertionProvider,
        private readonly completionProvider: CompletionProvider,
        private readonly signatureHelpProvider: SignatureHelpProvider,
        private readonly documentCache: DocumentCache,
    ) {
        connection.client.register(DidChangeConfigurationNotification.type, { section: this.configurationSection });
        connection.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this));
    }

    async onDidChangeConfiguration({ settings }: DidChangeConfigurationParams) {
        const config: LanguageServerSettings = settings?.[this.configurationSection] || this.defaultSettings;

        this.inlayHintProvider.settings = config.inlayHints ?? InlayHintProvider.defaultSettings;
        this.bracketSpacesInsertionProvider.isEnabled = config.autoInsertSpaces ?? true;

        if (config.phpBinConsoleCommand) {
            console.warn('`twiggy.phpBinConsoleCommand` does not work anymore. Use `twiggy.phpExecutable` and `twiggy.symfonyConsolePath` instead.');
        }

        if (!config.phpExecutable || !config.symfonyConsolePath) {
            this.applySettings(undefined, []);
            console.warn('`twiggy.phpExecutable` or `twiggy.symfonyConsolePath` not configured. Some features will be disabled.');
            return;
        }

        if (!await fileStat(config.symfonyConsolePath)) {
            this.applySettings(undefined, []);
            console.warn(
                `Symfony console file not found at ${config.symfonyConsolePath}.\n`
                + 'For Symfony project, set `twiggy.phpExecutable` and `twiggy.symfonyConsolePath`.\n'
                + 'Ignore this warning if you are not using Symfony.');
            return;
        }

        const twigEnvironment = await symfony.getTwigEnvironment(config.phpExecutable, config.symfonyConsolePath);
        const routeNameToPath = await symfony.getRoutes(config.phpExecutable, config.symfonyConsolePath);
        const routeNames = routeNameToPath ? Object.keys(routeNameToPath) : [];

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
