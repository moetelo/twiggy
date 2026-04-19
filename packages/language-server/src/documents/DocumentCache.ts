import { DocumentUri, Position, WorkspaceFolder } from 'vscode-languageserver';
import { documentUriToFsPath, toDocumentUri } from '../utils/uri';
import { Document } from './Document';
import * as path from 'path';
import { resolveTemplate } from '../utils/files/resolveTemplate';
import { EmptyEnvironment, IFrameworkTwigEnvironment } from '../twigEnvironment/IFrameworkTwigEnvironment';
import { parser } from '../utils/parser';
import { LocalSymbolCollector } from '../symbols/LocalSymbolCollector';
import { ITypeResolver } from '../typing/ITypeResolver';
import { readFile } from 'fs/promises';
import { TemplatePathMapping } from '../twigEnvironment/types';
import { normalizeDirectoryPath } from '../utils/paths/normalizeTemplatePath';

export class DocumentCache {
    #environment: IFrameworkTwigEnvironment = EmptyEnvironment;
    #typeResolver: ITypeResolver | null = null;
    #composerRoot: string | undefined;
    #additionalMappings: TemplatePathMapping[] = [];
    #normalizedMappingsCache: TemplatePathMapping[] | null = null;

    readonly documents: Map<DocumentUri, Document> = new Map();
    readonly workspaceFolderPath: string;

    constructor(workspaceFolder: WorkspaceFolder) {
        this.workspaceFolderPath = documentUriToFsPath(workspaceFolder.uri);
    }

    configure(
        frameworkEnvironment: IFrameworkTwigEnvironment,
        typeResolver: ITypeResolver | null,
        composerRoot?: string,
        additionalMappings?: TemplatePathMapping[],
    ) {
        this.#environment = frameworkEnvironment;
        this.#typeResolver = typeResolver;
        this.#composerRoot = composerRoot;
        this.#additionalMappings = additionalMappings || [];
        this.#normalizedMappingsCache = null; // Clear cache when configuration changes
    }

    /**
     * Gets the effective template mappings with normalized paths.
     * Combines framework mappings with additional user-configured mappings.
     */
    get #effectiveTemplateMappings(): TemplatePathMapping[] {
        if (this.#normalizedMappingsCache) {
            return this.#normalizedMappingsCache;
        }

        const frameworkMappings = this.#environment.templateMappings;
        const allMappings = [...frameworkMappings, ...this.#additionalMappings];

        // Normalize all directory paths
        this.#normalizedMappingsCache = allMappings.map(({ namespace, directory }) => ({
            namespace,
            directory: normalizeDirectoryPath(
                directory,
                this.workspaceFolderPath,
                this.#composerRoot,
            ),
        }));

        return this.#normalizedMappingsCache;
    }

    async get(documentUri: DocumentUri, text?: string) {
        const document = this.documents.get(documentUri);

        if (!document) {
            return await this.add(documentUri, text);
        }

        if (document.text === null || text !== undefined) {
            await this.setText(document, text);
        }

        return document;
    }

    async updateText(documentUri: DocumentUri, text?: string) {
        return await this.get(documentUri, text);
    }

    async setText(document: Document, text?: string) {
        if (typeof text === 'string') {
            document.text = text;
        } else {
            const fsPath = documentUriToFsPath(document.uri);
            const text = await readFile(fsPath, 'utf-8');
            document.text = text;
        }

        document.tree = parser.parse(document.text);
        document.locals = await new LocalSymbolCollector(document.tree.rootNode, this.#typeResolver).collect();
    }

    async resolveByTwigPath(pathFromTwig: string) {
        for (const { namespace, directory } of this.#effectiveTemplateMappings) {
            if (!pathFromTwig.startsWith(namespace)) {
                continue;
            }

            const includePath = namespace === ''
                ? path.join(directory, pathFromTwig)
                : pathFromTwig.replace(namespace, directory);

            // Try resolving relative to workspace first
            let pathToTwig = path.resolve(this.workspaceFolderPath, includePath);
            let documentUri = toDocumentUri(pathToTwig);

            if (this.documents.has(documentUri)) {
                return this.documents.get(documentUri)!;
            }

            let resolvedTemplate = await resolveTemplate(pathToTwig);

            // If not found and we have a composer root, try resolving relative to it
            if (!resolvedTemplate && this.#composerRoot) {
                pathToTwig = path.resolve(this.workspaceFolderPath, this.#composerRoot, includePath);
                documentUri = toDocumentUri(pathToTwig);

                if (this.documents.has(documentUri)) {
                    return this.documents.get(documentUri)!;
                }

                resolvedTemplate = await resolveTemplate(pathToTwig);
            }

            if (resolvedTemplate) {
                const newDocument = await this.add(toDocumentUri(resolvedTemplate));
                return newDocument;
            }
        }

        return undefined;
    }

    async resolveImport(document: Document, variableName: string, pos?: Position) {
        if (variableName === '_self') return document;

        const imports = document.locals.imports;
        if (pos !== undefined) {
            const scopedImports = document.getScopeAt(pos)?.imports;
            if (scopedImports) {
                imports.push(...scopedImports);
            }
        }

        const twigImport = imports?.find(imp => imp.name === variableName);

        if (!twigImport) return;

        if (!twigImport.path) return document;

        return await this.resolveByTwigPath(twigImport.path)!;
    }

    private async add(documentUri: DocumentUri, text?: string) {
        documentUri = toDocumentUri(documentUri);

        const document = new Document(documentUri);
        await this.setText(document, text);
        this.documents.set(documentUri, document);
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
