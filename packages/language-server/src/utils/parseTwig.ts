import { readFile } from 'fs/promises';
import Parser from 'web-tree-sitter';

let parser: Parser;

export async function parseTwig(content: string, previousTree?: Parser.Tree): Promise<Parser.Tree> {
  if (!parser) {
    const wasmPath = require.resolve('./tree-sitter-twig.wasm');

    await Parser.init();
    parser = new Parser();
    parser.setLanguage(await Parser.Language.load(await readFile(wasmPath)));
  }

  return parser.parse(content, previousTree);
}
