import { TreeCursor } from 'web-tree-sitter';

export class PreOrderCursorIterator {
  constructor(private readonly cursor: TreeCursor) {
  }

  public *[Symbol.iterator](): Generator<TreeCursor> {
    const constructor = this.constructor as typeof PreOrderCursorIterator;

    yield this.cursor;

    if (this.cursor.gotoFirstChild()) {
      yield* new constructor(this.cursor);

      while (this.cursor.gotoNextSibling()) {
        yield* new constructor(this.cursor);
      }

      this.cursor.gotoParent();
    }
  }
}
