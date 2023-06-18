import { URI } from 'vscode-uri';
import { Server } from './server';
import readDir from './utils/read-dir';

class Document {
  filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }
}

export class DocumentCache {
  server: Server;
  documents: Map<string, Document> = new Map();

  constructor(server: Server) {
    this.server = server;

    this.initDocuments();
  }

  async initDocuments() {
    const iterator = readDir(URI.parse(this.server.workspaceFolder.uri).fsPath);
    const reIsTwig = /.twig$/i;

    for await (const filePath of iterator) {
      if (reIsTwig.test(filePath)) {
        this.documents.set(filePath, new Document(filePath));
      }
    }
  }
}
