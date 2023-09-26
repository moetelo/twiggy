import { FunctionArgument, LocalSymbolInformation } from './types';
import { IWalkable } from '../types/IWalkable';
import { getNodeRange } from '../utils/getNodeRange';


export const collectLocals = (tree: IWalkable | null): LocalSymbolInformation => {
  const localSymbols: LocalSymbolInformation = {
    variables: [],
    macros: [],
    blocks: [],
  };

  if (!tree) {
    return localSymbols;
  }

  const cursor = tree.walk();
  cursor.gotoFirstChild();

  do {
    if (cursor.nodeType === 'block') {
      const blockNode = cursor.currentNode();
      const nameNode = blockNode.childForFieldName('name')!;
      const bodyNode = blockNode.childForFieldName('body');

      localSymbols.blocks.push({
        name: nameNode.text,
        range: getNodeRange(cursor),
        nameRange: getNodeRange(nameNode),
        symbols: collectLocals(bodyNode),
      });

      continue;
    }

    if (cursor.nodeType === 'set') {
      const setNode = cursor.currentNode();
      const variableNode = setNode.childForFieldName('variable')!;
      const valueNode = setNode.childForFieldName('value')!;

      localSymbols.variables.push({
        name: variableNode.text,
        nameRange: getNodeRange(variableNode),
        value: valueNode.text,
        range: getNodeRange(cursor),
      });

      continue;
    }

    if (cursor.nodeType === 'macro') {
      const macroNode = cursor.currentNode();

      const nameNode = macroNode.childForFieldName('name')!;
      const argumentsNode = macroNode.childForFieldName('arguments');
      const bodyNode = macroNode.childForFieldName('body');

      const args = argumentsNode?.descendantsOfType('argument')
        .map((argumentNode): FunctionArgument => {
          const argNameNode = argumentNode.childForFieldName('key') || argumentNode;
          const value = argumentNode.childForFieldName('value')?.text;

          return {
            name: argNameNode.text,
            nameRange: getNodeRange(argNameNode),
            value,
            range: getNodeRange(argumentNode),
          };
        }) || [];

      localSymbols.macros.push({
        name: nameNode.text,
        nameRange: getNodeRange(nameNode),
        args,
        range: getNodeRange(cursor),
        symbols: collectLocals(bodyNode),
      });

      continue;
    }
  } while (cursor.gotoNextSibling());

  return localSymbols;
};
