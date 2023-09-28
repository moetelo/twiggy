import { Position, Range } from 'vscode-languageserver';
import { SyntaxNode } from 'web-tree-sitter';
import { rangeContainsPosition } from './range-contains-position';
import { pointToPosition } from './point-to-position';
import { isEmptyEmbedded } from './is-empty-embedded';
import { comparePositions } from './compare-positions';
import { getNodeRange } from './node';

export function findNodeByPosition(
    node: SyntaxNode,
    position: Position,
): SyntaxNode | undefined {
    const range = getNodeRange(node);

    if (!rangeContainsPosition(range, position)) {
        // Cursor inside of empty embedded: {{ | }}
        if (isEmptyEmbedded(node)) {
            const rangeInsideEmptyEmbedded = Range.create(
                pointToPosition(node.endPosition),
                pointToPosition(node.nextSibling!.startPosition),
            );

            if (rangeContainsPosition(rangeInsideEmptyEmbedded, position)) {
                return node;
            }
        }

        return;
    }

    if (!node.childCount) {
        return node;
    }

    // Cursor right after embedded_begin: {{| }}
    if (
        isEmptyEmbedded(node) &&
        comparePositions(pointToPosition(node.endPosition), position) === 0
    ) {
        return node;
    }

    for (const child of node.children) {
        const foundNode = findNodeByPosition(child, position);

        if (foundNode) {
            return foundNode;
        }
    }
}
