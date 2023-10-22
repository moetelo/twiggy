import { Position } from 'vscode-languageserver';
import { findNodeByPosition } from './findNodeByPosition';
import { Document } from '../../documents';

export async function isInsideHtmlRegion(
    document: Document,
    position: Position,
): Promise<boolean> {
    await document.ensureParsed();
    const node = findNodeByPosition(document.tree.rootNode, position);
    return node?.type === 'content';
}
