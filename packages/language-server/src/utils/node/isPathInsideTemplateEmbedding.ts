import { templateUsingFunctions, templateUsingStatements } from 'constants/template-usage';
import type { SyntaxNode } from 'web-tree-sitter';
import { parseFunctionCall } from './parseFunctionCall';

export const isPathInsideTemplateEmbedding = (node: SyntaxNode): boolean => {
    const { parent } = node;
    if (node.type !== 'string' || !parent) {
        return false;
    }

    const isInsideStatement = templateUsingStatements.includes(
        parent.type,
    );

    if (isInsideStatement) {
        return true;
    }

    const isInsideFunctionCall =
        parent.type === 'arguments' &&
        templateUsingFunctions.some((func) =>
            parseFunctionCall(parent.parent)?.name === func,
        );

    return isInsideFunctionCall;
};
