import { Server } from '../server';
import type { Connection } from 'vscode-languageserver';

type onHandler = Parameters<Connection['onHover']>[0];

export abstract class BasicHover {
  server: Server;

  constructor(server: Server) {
    this.server = server;

    this.server.connection.onHover(this.onHover.bind(this));
  }

  abstract onHover(...args: Parameters<onHandler>): ReturnType<onHandler>;
}
