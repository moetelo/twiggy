import type { DocumentUri } from 'vscode-languageserver';
import { documentUriToFsPath } from '../utils/uri';

export class TreeNotParsedError extends Error {
    get message() {
        return `Document tree is not parsed yet. File: ${documentUriToFsPath(this.uri)}`;
    }

    constructor(readonly uri: DocumentUri) {
        super();
        this.name = 'TreeNotParsedError';
    }
}
