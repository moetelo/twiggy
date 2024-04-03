import { Connection, DidChangeConfigurationNotification, DidChangeConfigurationParams } from 'vscode-languageserver';
import { LanguageServerSettings } from './LanguageServerSettings';
import { InlayHintProvider } from '../inlayHints/InlayHintProvider';
import {
    TemplatePathMapping,
    getRoutesFromSymfonyDebugRouter,
    getSectionsFromSymfonyDebugTwig,
} from '../completions/debug-twig';
import { DocumentCache } from '../documents';
import { BracketSpacesInsertionProvider } from '../autoInsertions/BracketSpacesInsertionProvider';
import { CompletionProvider } from '../completions/CompletionProvider';

export class ConfigurationManager {
    readonly configurationSection = 'twiggy';
    readonly defaultMappings: TemplatePathMapping[] = [
        { namespace: '', directory: 'templates' },
    ];

    constructor(
        connection: Connection,
        private readonly inlayHintProvider: InlayHintProvider,
        private readonly bracketSpacesInsertionProvider: BracketSpacesInsertionProvider,
        private readonly completionProvider: CompletionProvider,
        private readonly documentCache: DocumentCache,
    ) {
        connection.client.register(DidChangeConfigurationNotification.type, { section: this.configurationSection });
        connection.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this));
    }

    async onDidChangeConfiguration({ settings }: DidChangeConfigurationParams) {
        const config: LanguageServerSettings | undefined = settings?.[this.configurationSection];

        this.inlayHintProvider.settings = config?.inlayHints ?? InlayHintProvider.defaultSettings;
        this.bracketSpacesInsertionProvider.isEnabled = config?.autoInsertSpaces ?? true;

        const phpBinConsoleCommand = config?.phpBinConsoleCommand?.trim();
        const debugTwigResult = await getSectionsFromSymfonyDebugTwig(phpBinConsoleCommand);
        const debugRouterResult = await getRoutesFromSymfonyDebugRouter(phpBinConsoleCommand);

        if (debugTwigResult) {
            console.info(`Collected information from the output of Symfony.`);
            console.info(
                `Detected ${debugTwigResult.Functions.length} functions, ${debugTwigResult.Filters.length} filters,`
                + ` ${debugTwigResult.Globals.length} globals and ${debugTwigResult.LoaderPaths.length} loader paths.`,
            );
        } else if (!phpBinConsoleCommand) {
            console.info(
                'The `twiggy.phpBinConsoleCommand` setting is empty.'
                + ' If your project uses Symfony, please set it in the extension settings for better language server features.',
            );
        } else {
            console.error(
                `Could not collect any information from the output of Symfony.`
                + ` Either the project doesn't use Symfony or the command is not correct.`,
            );
        }

        this.completionProvider.twigInfo = debugTwigResult;
        this.completionProvider.symfonyPathNames = debugRouterResult
            ? Object.keys(debugRouterResult)
            : [];

        this.documentCache.templateMappings = debugTwigResult?.LoaderPaths || [];
    }
}
