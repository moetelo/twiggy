import type { Position } from 'vscode-languageserver';
import type { Document } from '../../documents';

export async function isInsideHtmlRegion(
    document: Document,
    position: Position,
): Promise<boolean> {
    const node = document.deepestAt(position);
    return node?.type === 'content';
}
