import { Position, Range } from 'vscode-languageserver';
import { SyntaxNode } from 'web-tree-sitter';
import { rangeContainsPosition, comparePositions, pointToPosition } from '../position';
import { isEmptyEmbedded } from './isEmptyEmbedded';
import { getNodeRange } from '.';

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

        // node is the last child of its parent
        // or there are no more siblings at the same level after it
        if (
            !node.nextSibling
            && (
                !node.parent?.parent?.nextSibling
                || !findNodeByPosition(node.parent.parent.nextSibling, position)
            )
        ) {
            return node;
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
