import { DidChangeConfigurationNotification, DidChangeConfigurationParams } from 'vscode-languageserver';
import { Server } from '../server';
import { LanguageServerSettings } from './language-server-settings';

export class ConfigurationManager {
  readonly configurationSection = 'modernTwig';
  server: Server;

  constructor(server: Server) {
    this.server = server;

    this.server.connection.client.register(DidChangeConfigurationNotification.type, { section: this.configurationSection });
    this.server.connection.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this));
  }

  async onDidChangeConfiguration({ settings }: DidChangeConfigurationParams) {
    const config: LanguageServerSettings | undefined = settings?.[this.configurationSection];
  }
}
