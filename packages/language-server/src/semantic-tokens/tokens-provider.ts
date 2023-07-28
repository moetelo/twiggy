import { SemanticTokensLegend } from 'vscode-languageserver';

export const semanticTokensLegend: SemanticTokensLegend = {
  tokenTypes: [
    'parameter',
    'variable',
    'property',
    'function',
    'method',
    'keyword',
    'comment',
    'string',
    'number',
    'operator',
    'embedded_begin',
    'embedded_end',
    'null',
    'boolean',
  ],
  tokenModifiers: [],
};
