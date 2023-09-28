import { Position } from 'vscode-languageserver';
import { findNodeByPosition } from '../utils/find-element-by-position';
import { Document } from '../document-cache';

export async function isInsideHtmlRegion(
    document: Document,
    position: Position,
): Promise<boolean | undefined> {
    const cst = await document.cst();
    const cursorNode = findNodeByPosition(cst.rootNode, position);

    if (!cursorNode) {
        return;
    }

    return cursorNode.type === 'content';
}
