import { Position } from 'vscode-languageserver';
import { findNodeByPosition } from '../utils/findElementByPosition';
import { Document } from '../documents';

export async function isInsideHtmlRegion(
    { tree }: Document,
    position: Position,
): Promise<boolean> {
    const node = findNodeByPosition(tree.rootNode, position);
    return node?.type === 'content';
}
