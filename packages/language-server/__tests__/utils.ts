import { Range } from 'vscode-languageserver';
import { Document } from '../src/documents/Document';
import { initializeParser } from '../src/utils/parser';
import * as path from 'path';

export const documentFromCode = (code: string, uri = 'test://test.html.twig') => {
    const document = new Document(uri);
    document.setText(code);
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

export const createRange = (start: number, end: number): Range => ({
    start: { character: start, line: 0 },
    end: { character: end, line: 0 },
});

export const createLengthRange = (start: number, length: number): Range => createRange(start, start + length);
