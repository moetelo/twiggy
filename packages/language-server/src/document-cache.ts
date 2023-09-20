import { URI } from 'vscode-uri';
import readDir from './utils/read-dir';
import { parseTwig } from './utils/parse-twig';
import { readFile } from 'fs/promises';
import { DocumentUri, WorkspaceFolder } from 'vscode-languageserver';
import { fsPathToDocumentUri } from './utils/fs-path-to-document-uri';
import Parser from 'web-tree-sitter';

export class Document {
  filePath: string;
  text: string | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
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
}

export class DocumentCache {
  workspaceFolder!: WorkspaceFolder;
  documents: Map<DocumentUri, Document> = new Map();

  constructor(workspaceFolder: WorkspaceFolder) {
    this.workspaceFolder = workspaceFolder;

    this.initDocuments();
  }

  async initDocuments() {
    const iterator = readDir(URI.parse(this.workspaceFolder.uri).fsPath);
    const reIsTwig = /.twig$/i;

    for await (const filePath of iterator) {
      if (reIsTwig.test(filePath)) {
        this.documents.set(
          fsPathToDocumentUri(filePath),
          new Document(filePath)
        );
      }
    }
  }

  getDocument(documentUri: DocumentUri) {
    return this.documents.get(documentUri);
  }
}
