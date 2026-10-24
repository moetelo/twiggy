import * as path from 'node:path';
import Parser from 'web-tree-sitter';

let parserPromise: Promise<Parser> | null = null;

const loadParser = async (wasmPath: string): Promise<Parser> => {
    await Parser.init();
    const parser = new Parser();
    parser.setLanguage(await Parser.Language.load(wasmPath));
    return parser;
};

/**
 * Loads the Twig grammar once; later calls return the same parser.
 * @param wasmPath Path to `tree-sitter-twig.wasm`. Only the first call's path is used.
 * @returns The shared parser.
 */
export const initializeParser = async (
    wasmPath = path.join(__dirname, 'tree-sitter-twig.wasm'),
): Promise<Parser> => {
    parserPromise ??= loadParser(wasmPath);
    return parserPromise;
};
