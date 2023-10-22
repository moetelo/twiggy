import { DidChangeConfigurationNotification, DidChangeConfigurationParams } from 'vscode-languageserver';
import { Server } from '../server';
import { LanguageServerSettings } from './LanguageServerSettings';
import { InlayHintProvider } from '../inlayHints/InlayHintProvider';
import { TemplatePathMapping, generateDebugTwigCommand, getSectionsFromPhpDebugTwig } from '../completions/debug-twig';

export class ConfigurationManager {
    readonly configurationSection = 'twiggy';
    readonly defaultMappings: TemplatePathMapping[] = [
        { namespace: '', directory: 'templates' },
    ];

    server: Server;

    constructor(server: Server) {
        this.server = server;

        this.server.connection.client.register(DidChangeConfigurationNotification.type, { section: this.configurationSection });
        this.server.connection.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this));
    }

    async onDidChangeConfiguration({ settings }: DidChangeConfigurationParams) {
        const config: LanguageServerSettings | undefined = settings?.[this.configurationSection];

        this.server.inlayHintProvider.settings = config?.inlayHints ?? InlayHintProvider.defaultSettings;
        this.server.bracketSpacesInsertionProvider.isEnabled = config?.autoInsertSpaces ?? true;

        const phpBinConsoleCommand = config?.phpBinConsoleCommand?.trim();
        const debugTwigCommand = generateDebugTwigCommand(phpBinConsoleCommand);

        const twigInfo = debugTwigCommand
            ? await getSectionsFromPhpDebugTwig(debugTwigCommand)
            : undefined;

        if (twigInfo) {
            console.info(`Collected information from the output of '${debugTwigCommand}'.`);
            console.info(
                `Detected ${twigInfo.Functions.length} functions, ${twigInfo.Filters.length} filters,`
                + ` ${twigInfo.Globals.length} globals and ${twigInfo.LoaderPaths.length} loader paths.`,
            );
        } else if (!debugTwigCommand) {
            console.info(
                'The `twiggy.phpBinConsoleCommand` setting is empty.'
                + ' If your project uses Symfony, please set it in the extension settings for better language server features.',
            );
        } else {
            console.error(
                `Could not collect any information from the output of the '${debugTwigCommand}'.`
                + ` Either the project doesn't use Symfony or the command is not correct.`,
            );
        }

        this.server.completionProvider.twigInfo = twigInfo;
        this.server.documentCache.templateMappings = twigInfo?.LoaderPaths || [];
    }
}
