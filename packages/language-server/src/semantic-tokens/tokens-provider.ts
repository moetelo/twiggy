import { SemanticTokenTypes, SemanticTokensLegend } from 'vscode-languageserver';

export const semanticTokensLegend: SemanticTokensLegend = {
  tokenTypes: [
    SemanticTokenTypes.parameter,
    SemanticTokenTypes.variable,
    SemanticTokenTypes.property,
    SemanticTokenTypes.function,
    SemanticTokenTypes.method,
    SemanticTokenTypes.keyword,
    SemanticTokenTypes.comment,
    SemanticTokenTypes.string,
    SemanticTokenTypes.number,
    SemanticTokenTypes.operator,
    SemanticTokenTypes.macro,
    SemanticTokenTypes.type,
    'embedded_begin',
    'embedded_end',
    'null',
    'boolean',
  ],
  tokenModifiers: [],
};
