import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { Document } from '../documents';
import { FunctionArgument, TwigVariable } from '../symbols/types';
import { isEmptyEmbedded } from '../utils/node';
import { rangeContainsPosition, pointToPosition } from '../utils/position';

const toCompletionItem = (variable: TwigVariable | FunctionArgument): CompletionItem => ({
  label: variable.name,
  kind: CompletionItemKind.Variable,
  detail: variable.value,
});


export function localVariables(document: Document, cursorNode: SyntaxNode) {
  if (cursorNode.type !== 'variable' && !isEmptyEmbedded(cursorNode)) {
    return;
  }

  const cursorPosition = pointToPosition(cursorNode.startPosition);

  const blocks = document.locals.block.filter(x => rangeContainsPosition(x.range, cursorPosition));
  const macroses = document.locals.macro.filter(x => rangeContainsPosition(x.range, cursorPosition));

  const scopedVariables = [ ...macroses, ...blocks ].flatMap(x => x.symbols.variable);

  return [
    ...scopedVariables,
    ...macroses.flatMap(x => x.args),
    ...document.locals.variable,
  ].map(toCompletionItem);
}
