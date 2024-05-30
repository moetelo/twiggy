import { Range } from 'vscode-languageserver';
import { Document } from '../src/documents/Document';
import { initializeParser } from '../src/utils/parser';
import * as path from 'path';
import { LocalSymbolCollector } from '../src/symbols/LocalSymbolCollector';
import { MockPhpExecutor } from './mocks';
import { TypeResolver } from '../src/typing/TypeResolver';

export const documentFromCode = async (code: string, uri = 'test://test.html.twig') => {
    const typeResolver = new TypeResolver(new MockPhpExecutor());
    return documentFromCodeWithTypeResolver(code, typeResolver, uri);
};

export const documentFromCodeWithTypeResolver = async (code: string, typeResolver: TypeResolver, uri = 'test://test.html.twig') => {
    const document = new Document(uri);
    document.text = code;
    document.tree = (await initializeTestParser()).parse(document.text);
    document.locals = await new LocalSymbolCollector(
        document.tree.rootNode,
        typeResolver,
    ).collect();

    return document;
};

export const initializeTestParser = async () => {
    const wasmPath = path.join(
        require.main!.path,
        '..',
        '..',
        'tree-sitter-twig',
        'tree-sitter-twig.wasm',
    );
    return await initializeParser(wasmPath);
};

const createRange = (start: number, end: number): Range => ({
    start: { character: start, line: 0 },
    end: { character: end, line: 0 },
});

export const createLengthRange = (start: number, length: number): Range => createRange(start, start + length);
