import { DocumentUri } from 'vscode-languageserver';
import { toDocumentUri } from '../utils/toDocumentUri';
import { Document } from './Document';

export class DocumentCache {
    documents: Map<DocumentUri, Document> = new Map();

    get(documentUri: DocumentUri) {
        return this.getOrCreate(documentUri);
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
