import type { DocumentUri, Position, WorkspaceFolder } from 'vscode-languageserver';
import { documentUriToFsPath, toDocumentUri } from '../utils/uri';
import { Document } from './Document';
import * as path from 'node:path';
import { resolveTemplate } from '../utils/files/resolveTemplate';
import type { IFrameworkTwigEnvironment } from '../twigEnvironment/IFrameworkTwigEnvironment';
import { EmptyEnvironment } from '../twigEnvironment/IFrameworkTwigEnvironment';
import { initializeParser } from '../utils/parser';
import { LocalSymbolCollector } from '../symbols/LocalSymbolCollector';
import type { ITypeResolver } from '../typing/ITypeResolver';
import { readFile } from 'node:fs/promises';

export class DocumentCache {
    #environment: IFrameworkTwigEnvironment = EmptyEnvironment;
    #typeResolver: ITypeResolver | null = null;

    readonly documents = new Map<DocumentUri, Document>();
    readonly workspaceFolderPath: string;

    constructor(workspaceFolder: WorkspaceFolder) {
        this.workspaceFolderPath = documentUriToFsPath(workspaceFolder.uri);
    }

    configure(frameworkEnvironment: IFrameworkTwigEnvironment, typeResolver: ITypeResolver | null) {
        this.#environment = frameworkEnvironment;
        this.#typeResolver = typeResolver;
    }

    async get(documentUri: DocumentUri, text?: string) {
        const document = this.documents.get(documentUri);

        if (!document) {
            return this.add(documentUri, text);
        }

        if (document.text === null || text !== undefined) {
            await this.setText(document, text);
        }

        return document;
    }

    async updateText(documentUri: DocumentUri, text?: string) {
        return this.get(documentUri, text);
    }

    async setText(document: Document, text?: string) {
        document.text = text ?? (await readFile(documentUriToFsPath(document.uri), 'utf8'));

        const parser = await initializeParser();
        document.tree = parser.parse(document.text);
        document.locals = await new LocalSymbolCollector(
            document.tree.rootNode,
            this.#typeResolver,
        ).collect();
    }

    async resolveByTwigPath(pathFromTwig: string) {
        for (const { namespace, directory } of this.#environment.templateMappings) {
            if (!pathFromTwig.startsWith(namespace)) {
                continue;
            }

            const includePath =
                namespace === ''
                    ? path.join(directory, pathFromTwig)
                    : pathFromTwig.replace(namespace, directory);

            const pathToTwig = path.resolve(this.workspaceFolderPath, includePath);
            const documentUri = toDocumentUri(pathToTwig);

            const cachedDocument = this.documents.get(documentUri);
            if (cachedDocument) {
                return cachedDocument;
            }

            const resolvedTemplate = await resolveTemplate(pathToTwig);
            if (resolvedTemplate) {
                const newDocument = await this.add(toDocumentUri(resolvedTemplate));
                return newDocument;
            }
        }

        return undefined;
    }

    async resolveImport(document: Document, variableName: string, pos?: Position) {
        if (variableName === '_self') return document;

        const { imports } = document.locals;
        if (pos !== undefined) {
            imports.push(...document.getScopeAt(pos).imports);
        }

        const twigImport = imports.find(imp => imp.name === variableName);

        if (!twigImport) return undefined;

        if (!twigImport.path) return document;

        return this.resolveByTwigPath(twigImport.path);
    }

    private async add(documentUri: DocumentUri, text?: string) {
        const normalizedUri = toDocumentUri(documentUri);

        const document = new Document(normalizedUri);
        await this.setText(document, text);
        this.documents.set(normalizedUri, document);
        return document;
    }

    remove(documentUri: DocumentUri) {
        this.documents.delete(toDocumentUri(documentUri));
    }

    async refresh(documentUri: DocumentUri) {
        const normalizedUri = toDocumentUri(documentUri);
        const document = this.documents.get(normalizedUri);
        if (document) {
            await this.setText(document);
        }
    }
}
