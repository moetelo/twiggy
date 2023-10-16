import { DidChangeConfigurationNotification, DidChangeConfigurationParams } from 'vscode-languageserver';
import { Server } from '../server';
import { LanguageServerSettings } from './LanguageServerSettings';
import { TemplatePathMapping, getTemplatePathMappingsFromSymfony } from '../utils/symfony/twigConfig';
import { InlayHintProvider } from '../inlayHints/InlayHintProvider';

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
        await this.server.completionProvider.initializeGlobalsFromCommand(phpBinConsoleCommand);

        const mappings = phpBinConsoleCommand
            ? await getTemplatePathMappingsFromSymfony(phpBinConsoleCommand)
            : this.defaultMappings;

        this.server.documentCache.templateMappings = mappings;
        this.server.completionProvider.templateMappings = mappings;
    }
}
