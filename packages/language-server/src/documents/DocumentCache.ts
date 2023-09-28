import { URI } from 'vscode-uri';
import getTwigFiles from '../utils/getTwigFiles';
import { DocumentUri, WorkspaceFolder } from 'vscode-languageserver';
import { toDocumentUri } from '../utils/toDocumentUri';
import { Document } from './Document';

export class DocumentCache {
    workspaceFolder!: WorkspaceFolder;
    documents: Map<DocumentUri, Document> = new Map();

    constructor(workspaceFolder: WorkspaceFolder) {
        this.workspaceFolder = workspaceFolder;
    }

    async initDocuments() {
        const workspaceDir = URI.parse(this.workspaceFolder.uri).fsPath;
        const twigFiles = await getTwigFiles(workspaceDir);

        for (const filePath of twigFiles) {
            this.add(toDocumentUri(filePath));
        }
    }

    get(documentUri: DocumentUri) {
        return this.documents.get(documentUri);
    }

    getOrCreate(documentUri: DocumentUri) {
        const document = this.documents.get(documentUri);

        if (document) {
            return document;
        }

        return this.add(documentUri);
    }

    async updateText(documentUri: DocumentUri, text: string) {
        const document = this.getOrCreate(documentUri);
        await document.setText(text);

        return document;
    }

    private add(documentUri: DocumentUri) {
        documentUri = toDocumentUri(documentUri);

        const document = new Document(documentUri);
        this.documents.set(documentUri, document);
        return document;
    }
}
