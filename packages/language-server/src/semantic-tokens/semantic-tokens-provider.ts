import { SemanticTokensParams, SemanticTokens } from 'vscode-languageserver';
import { Server } from '../server';

export class SemanticTokensProvider {
  server: Server;

  constructor(server: Server) {
    this.server = server;

    this.server.connection.languages.semanticTokens.on(
      this.serverRequestHandler.bind(this)
    );
  }

  serverRequestHandler(params: SemanticTokensParams) {
    const semanticTokens: SemanticTokens = { data: [] };

    return semanticTokens;
  }
}
