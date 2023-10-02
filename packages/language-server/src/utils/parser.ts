import { readFile } from 'fs/promises';
import Parser from 'web-tree-sitter';

export let parser!: Parser;

export const initializeParser = async () => {
    await Parser.init();
    parser = new Parser();

    const wasmPath = require.resolve('./tree-sitter-twig.wasm');
    parser.setLanguage(await Parser.Language.load(await readFile(wasmPath)));
};
