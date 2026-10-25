import type { TreeCursor } from 'web-tree-sitter';

export class PreOrderCursorIterator {
    constructor(private readonly cursor: TreeCursor) {}

    *[Symbol.iterator](): Generator<TreeCursor> {
        yield this.cursor;

        if (this.cursor.gotoFirstChild()) {
            yield* new PreOrderCursorIterator(this.cursor);

            while (this.cursor.gotoNextSibling()) {
                yield* new PreOrderCursorIterator(this.cursor);
            }

            this.cursor.gotoParent();
        }
    }
}
