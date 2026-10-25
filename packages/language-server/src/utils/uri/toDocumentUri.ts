import type { DocumentUri } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

export function toDocumentUri(path: DocumentUri): DocumentUri {
    if (path.startsWith('file://')) {
        return path;
    }

    return URI.file(path).toString();
}
