import { Connection, DocumentSymbol, DocumentSymbolParams, SymbolKind } from 'vscode-languageserver';
import { LocalSymbolInformation } from './types';
import { DocumentCache } from '../documents';

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
  constructor(
    private readonly connection: Connection,
    private readonly documentCache: DocumentCache,
  ) {
    this.connection.onDocumentSymbol(this.onDocumentSymbol.bind(this));
  }

  async onDocumentSymbol(params: DocumentSymbolParams): Promise<DocumentSymbol[]> {
    const uri = params.textDocument.uri;
    const document = this.documentCache.get(uri);

    if (!document) {
      return [];
    }

    return mapLocalsToSymbols(document.locals);
  }
}
