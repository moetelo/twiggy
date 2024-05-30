import { DocumentUri, Position, WorkspaceFolder } from 'vscode-languageserver';
import { documentUriToFsPath, toDocumentUri } from '../utils/uri';
import { Document } from './Document';
import * as path from 'path';
import { resolveTemplate } from '../utils/files/resolveTemplate';
import { EmptyEnvironment, IFrameworkTwigEnvironment } from '../twigEnvironment/IFrameworkTwigEnvironment';

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
            const documentUri = toDocumentUri(pathToTwig);

            if (this.documents.has(documentUri)) {
                return this.documents.get(documentUri);
            }

            const resolvedTemplate = await resolveTemplate(pathToTwig);

            if (resolvedTemplate) {
                return this.add(toDocumentUri(resolvedTemplate));
            }
        }

        return undefined;
    }

    async resolveImport(document: Document, variableName: string, pos?: Position) {
        if (variableName === '_self') return document;

        const scopedImports = pos
            ? document.getScopeAt(pos)?.imports
            : document.locals.imports

        const twigImport = scopedImports?.find(imp => imp.name === variableName);

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
