import { SyntaxNode } from 'web-tree-sitter';
import { onHoverHandlerReturn } from './hover-provider';
import { collectLocals } from '../symbols/locals';
import { closestByPredicate } from '../utils/closestByPredicate';

export function localVariables(cursorNode: SyntaxNode): onHoverHandlerReturn {
  if (cursorNode.type !== 'variable') {
    return;
  }

  const templateFragmentNode = closestByPredicate(cursorNode, (node) => ['macro', 'block', 'template'].includes(node.type));
  const bodyNode = templateFragmentNode?.childForFieldName('body') || templateFragmentNode;
  const locals = collectLocals(bodyNode);

  const result = locals.variables.find(({ name }) => name === cursorNode.text);
  return result
    ? { contents: result.value }
    : null;
}
