import { DocumentSymbol, DocumentSymbolParams, SymbolKind } from 'vscode-languageserver';
import { Server } from '../server';
import { LocalSymbolInformation } from './types';

const mapLocalsToSymbols = (locals: LocalSymbolInformation): DocumentSymbol[] => {
  return [
    ...locals.variable.map((item): DocumentSymbol => ({
      name: item.name,
      kind: SymbolKind.Variable,
      range: item.range,
      selectionRange: item.nameRange,
    })),
    ...locals.macro.map((item): DocumentSymbol => ({
      name: 'macro ' + item.name,
      kind: SymbolKind.Function,
      range: item.range,
      selectionRange: item.nameRange,
      children: mapLocalsToSymbols(item.symbols),
    })),
    ...locals.block.map((item): DocumentSymbol => ({
      name: 'block ' + item.name,
      kind: SymbolKind.Property,
      range: item.range,
      selectionRange: item.nameRange,
      children: mapLocalsToSymbols(item.symbols),
    })),
  ];
};

export class SymbolProvider {
  server: Server;

  constructor(server: Server) {
    this.server = server;

    this.server.connection.onDocumentSymbol(this.onDocumentSymbol.bind(this));
  }

  async onDocumentSymbol(params: DocumentSymbolParams): Promise<DocumentSymbol[]> {
    const uri = params.textDocument.uri;
    const document = this.server.documentCache.get(uri);

    if (!document) {
      return [];
    }

    return mapLocalsToSymbols(document.locals);
  }
}
