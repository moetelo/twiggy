import { TreeCursor } from 'web-tree-sitter';

export class PreOrderCursorIterator {
  protected cursor;

  constructor(cursor: TreeCursor) {
    this.cursor = cursor;
  }

  public *[Symbol.iterator](): Generator<TreeCursor> {
    const constructor = this.constructor as any;

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
