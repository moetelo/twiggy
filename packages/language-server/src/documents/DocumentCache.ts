import { DocumentUri, WorkspaceFolder } from 'vscode-languageserver';
import { documentUriToFsPath, toDocumentUri } from '../utils/uri';
import { Document } from './Document';
import * as path from 'path';
import { fileStat } from '../utils/files/fileStat';
import { EmptyEnvironment, IFrameworkTwigEnvironment } from '../twigEnvironment';

export class DocumentCache {
    #environment: IFrameworkTwigEnvironment = EmptyEnvironment;
    readonly documents: Map<DocumentUri, Document> = new Map();
    readonly workspaceFolderPath: string;

    constructor(workspaceFolder: WorkspaceFolder) {
        this.workspaceFolderPath = documentUriToFsPath(workspaceFolder.uri);
    }

    configure(frameworkEnvironment: IFrameworkTwigEnvironment) {
        this.#environment = frameworkEnvironment;
    }

    get(documentUri: DocumentUri) {
        const document = this.documents.get(documentUri);

        if (document) {
            return document;
        }

        return this.add(documentUri);
    }

    updateText(documentUri: DocumentUri, text: string) {
        const document = this.get(documentUri);
        document.setText(text);

        return document;
    }

    async resolveByTwigPath(pathFromTwig: string) {
        for (const { namespace, directory } of this.#environment.templateMappings) {
            if (!pathFromTwig.startsWith(namespace)) {
                continue;
            }

            const includePath = namespace === ''
                ? path.join(directory, pathFromTwig)
                : pathFromTwig.replace(namespace, directory);

            const pathToTwig = path.resolve(this.workspaceFolderPath, includePath);

            const stats = await fileStat(pathToTwig);
            if (stats) {
                const documentUri = toDocumentUri(pathToTwig);
                return this.get(documentUri);
            }
        }

        return undefined;
    }

    async resolveImport(document: Document, variableName: string) {
        if (variableName === '_self') return document;

        const twigImport = document.locals.imports.find(imp => imp.name === variableName);
        if (!twigImport) return;

        if (!twigImport.path) return document;

        return await this.resolveByTwigPath(twigImport.path)!;
    }

    private add(documentUri: DocumentUri) {
        documentUri = toDocumentUri(documentUri);

        const document = new Document(documentUri);
        this.documents.set(documentUri, document);
        return document;
    }
}
