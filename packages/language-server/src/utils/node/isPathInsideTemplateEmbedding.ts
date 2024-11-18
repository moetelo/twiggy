import { templateUsingFunctions, templateUsingStatements } from "constants/template-usage";
import { SyntaxNode } from "web-tree-sitter";
import { parseFunctionCall } from "./parseFunctionCall";

export const isPathInsideTemplateEmbedding = (node: SyntaxNode): boolean => {
	if (node.type !== 'string' || !node.parent) {
		return false;
	}

	const isInsideStatement = templateUsingStatements.includes(
		node.parent.type,
	);

	if (isInsideStatement) {
		return true;
	}

	const isInsideFunctionCall =
		node.parent?.type === 'arguments' &&
		templateUsingFunctions.some((func) =>
			parseFunctionCall(node.parent!.parent)?.name === func,
		);

	return isInsideFunctionCall;
};
