import * as path from 'path';
import { initializeParser } from 'utils/parser';

export const initializeTestParser = async () => {
    const wasmPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'tree-sitter-twig',
        'tree-sitter-twig.wasm',
    );
    return await initializeParser(wasmPath);
};
