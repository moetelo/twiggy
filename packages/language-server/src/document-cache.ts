import { URI } from 'vscode-uri';
import readDir from './utils/read-dir';
import { parseTwig } from './utils/parse-twig';
import { readFile } from 'fs/promises';
import { DocumentUri, WorkspaceFolder } from 'vscode-languageserver';
import { fsPathToDocumentUri } from './utils/fs-path-to-document-uri';
import Parser from 'web-tree-sitter';
import { collectLocals } from './symbols/locals';
import { LocalSymbol, LocalSymbolInformation } from './symbols/types';

export class Document {
  filePath: string;
  text: string | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  get uri(): DocumentUri {
    return fsPathToDocumentUri(this.filePath);
  }

  async setText(text: string) {
    this.text = text;
  }

  async getText() {
    if (this.text) {
      return Promise.resolve(this.text);
    }

    return await readFile(this.filePath, 'utf-8');
  }

  async cst(): Promise<Parser.Tree> {
    const text = await this.getText();

    return await parseTwig(text);
  }

  async locals(): Promise<LocalSymbolInformation> {
    const cst = await this.cst();
    return collectLocals(cst);
  }

  async getSymbolByName(name: string, symbolType: keyof LocalSymbolInformation): Promise<LocalSymbol | undefined> {
    const locals = await this.locals();

    const symbol = locals[symbolType].find(s => s.name === name);
    if (symbol) return symbol;

    if (symbolType === 'block') {
      return locals.block.flatMap(b => b.symbols.block).find(s => s.name === name);
    }
  }
}

export class DocumentCache {
  workspaceFolder!: WorkspaceFolder;
  documents: Map<DocumentUri, Document> = new Map();

  constructor(workspaceFolder: WorkspaceFolder) {
    this.workspaceFolder = workspaceFolder;

    this.initDocuments();
  }

  async initDocuments() {
    const workspaceDir = URI.parse(this.workspaceFolder.uri).fsPath;

    for await (const filePath of readDir(workspaceDir)) {
      if (!filePath.endsWith('.twig')) {
        continue;
      }

      this.documents.set(
        fsPathToDocumentUri(filePath),
        new Document(filePath),
      );
    }
  }

  getDocument(documentUri: DocumentUri) {
    return this.documents.get(documentUri);
  }
}
