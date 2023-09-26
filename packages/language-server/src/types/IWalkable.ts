import type { TreeCursor } from 'web-tree-sitter';

export type IWalkable = {
  walk(): TreeCursor;
};
