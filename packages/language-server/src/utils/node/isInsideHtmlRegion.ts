import { Position } from 'vscode-languageserver';
import { Document } from '../../documents';

export async function isInsideHtmlRegion(
    document: Document,
    position: Position,
): Promise<boolean> {
    const node = document.deepestAt(position);
    return node?.type === 'content';
}
