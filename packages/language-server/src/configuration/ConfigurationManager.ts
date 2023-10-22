import { DidChangeConfigurationNotification, DidChangeConfigurationParams } from 'vscode-languageserver';
import { Server } from '../server';
import { LanguageServerSettings } from './LanguageServerSettings';
import { InlayHintProvider } from '../inlayHints/InlayHintProvider';
import { TemplatePathMapping, getSectionsFromPhpDebugTwig } from '../completions/debug-twig';

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

        const twigInfo = phpBinConsoleCommand
            ? await getSectionsFromPhpDebugTwig(phpBinConsoleCommand)
            : undefined;

        if (twigInfo) {
            console.info('Twig info initialized.');
            console.info(
                `Detected ${twigInfo.Functions.length} functions, ${twigInfo.Filters.length} filters and ${twigInfo.Globals.length} globals.`,
            );
            console.info('Loader paths:');
            console.info(twigInfo.LoaderPaths.map(({ namespace, directory }) => `  ${namespace} => ${directory}`).join('\n'));
        } else {
            console.error('Twig info not initialized.');
        }

        this.server.completionProvider.twigInfo = twigInfo;
        this.server.documentCache.templateMappings = twigInfo?.LoaderPaths || [];
    }
}
