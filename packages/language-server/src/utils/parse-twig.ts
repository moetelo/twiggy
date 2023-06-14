import { readFile } from 'fs/promises';
import { resolve } from 'path';
import Parser from 'web-tree-sitter';

let parser: Parser;

export async function parseTwig(content: string): Promise<Parser.Tree> {
  if (!parser) {
    const wasmPath = resolve(__dirname, '..', 'tree-sitter-twig.wasm');

    await Parser.init();
    parser = new Parser();
    parser.setLanguage(await Parser.Language.load(await readFile(wasmPath)));
  }

  return parser.parse(content);
}
