import { DidChangeConfigurationNotification, DidChangeConfigurationParams } from 'vscode-languageserver';
import { Server } from '../server';
import { LanguageServerSettings } from './language-server-settings';

export class ConfigurationManager {
  readonly configurationSection = 'twiggy';
  server: Server;

  private readonly defaultTemplatesDirectory = 'templates';

  constructor(server: Server) {
    this.server = server;

    this.server.connection.client.register(DidChangeConfigurationNotification.type, { section: this.configurationSection });
    this.server.connection.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this));
  }

  async onDidChangeConfiguration({ settings }: DidChangeConfigurationParams) {
    const config: LanguageServerSettings | undefined = settings?.[this.configurationSection];

    const templatesDirectory = config?.definition?.templatesDirectory?.trim() || this.defaultTemplatesDirectory;
    this.server.definitionProvider.templatesDirectory = templatesDirectory;
    this.server.completionProvider.templatesDirectory = templatesDirectory;

    const phpBinConsoleCommand = config?.completion?.phpBinConsoleCommand?.trim();
    await this.server.completionProvider.initializeGlobalsFromCommand(phpBinConsoleCommand);
  }
}
