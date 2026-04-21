import { Document } from 'documents/Document';
import { DocumentCache } from 'documents/DocumentCache';
import { LocalSymbolCollector } from 'symbols/LocalSymbolCollector';
import { TypeResolver } from 'typing/TypeResolver';
import { MockPhpExecutor } from './mocks';
import { initializeTestParser } from './parser';

export type DocumentWithText = Document & { text: string };

export const documentFromCode = async (code: string, uri = 'test://test.html.twig') => {
    const typeResolver = new TypeResolver(new MockPhpExecutor());
    return documentFromCodeWithTypeResolver(code, typeResolver, uri);
};

export const documentFromCodeWithTypeResolver = async (
    code: string,
    typeResolver: TypeResolver,
    uri = 'test://test.html.twig',
): Promise<DocumentWithText> => {
    const document = new Document(uri);
    document.text = code;
    document.tree = (await initializeTestParser()).parse(document.text);
    document.locals = await new LocalSymbolCollector(
        document.tree.rootNode,
        typeResolver,
    ).collect();

    return document as DocumentWithText;
};

export const createDocumentCache = () => new DocumentCache({ name: '', uri: 'file:///' });
