import { readFile } from 'fs/promises';
import Parser from 'web-tree-sitter';

let parser: Parser;

export async function parse(content: string): Promise<Parser.Tree> {
  if (!parser) {
    await Parser.init();
    parser = new Parser();
    parser.setLanguage(
      await Parser.Language.load(await readFile('./tree-sitter-twig.wasm'))
    );
  }

  return parser.parse(content);
}
