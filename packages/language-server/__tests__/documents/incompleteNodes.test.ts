import { describe, test, beforeAll } from 'bun:test';
import * as assert from 'node:assert/strict';
import type { SyntaxNode } from 'web-tree-sitter';
import { documentWithCursor } from '../__helpers__/fixtures';
import { initializeTestParser } from '../__helpers__/parser';

const ancestorTypes = (node: SyntaxNode): string[] => {
    const types: string[] = [];
    let n: SyntaxNode | null = node;
    while (n) {
        types.push(n.type);
        n = n.parent;
    }
    return types;
};

const assertAncestor = (node: SyntaxNode, expected: string, message?: string) => {
    assert.ok(
        ancestorTypes(node).includes(expected),
        message ?? `expected ancestor ${expected}, got chain: ${ancestorTypes(node).join(' > ')}`,
    );
};

describe('Document.deepestAt — incomplete output expressions', () => {
    beforeAll(initializeTestParser);

    test('empty output', async () => {
        const { cursorNode, document } = await documentWithCursor(`{{ $0 }}`);
        assertAncestor(cursorNode, 'output');
        assert.doesNotThrow(() => document.locals);
    });

    // Parser does NOT recover gracefully for these cases — the whole `{{ …$0 }}`
    // becomes an `ERROR` node. These tests document that and guarantee the LS does
    // not throw when walking / collecting locals on them.
    test('dangling member access lands in ERROR node (no throw)', async () => {
        const { cursorNode, document } = await documentWithCursor(`{{ user.$0 }}`);
        assertAncestor(cursorNode, 'ERROR');
        assert.doesNotThrow(() => document.locals);
    });

    test('deep dangling member access lands in ERROR node (no throw)', async () => {
        const { cursorNode, document } = await documentWithCursor(`{{ user.getFoo().$0 }}`);
        assertAncestor(cursorNode, 'ERROR');
        assert.doesNotThrow(() => document.locals);
    });

    test('in-flight filter slot lands in ERROR node (no throw)', async () => {
        const { cursorNode, document } = await documentWithCursor(`{{ name|$0 }}`);
        assertAncestor(cursorNode, 'ERROR');
        assert.doesNotThrow(() => document.locals);
    });

    test('chained in-flight filter slot lands in ERROR node (no throw)', async () => {
        const { cursorNode, document } = await documentWithCursor(`{{ name|upper|$0 }}`);
        assertAncestor(cursorNode, 'ERROR');
        assert.doesNotThrow(() => document.locals);
    });
});

describe('Document.deepestAt — incomplete tag headers', () => {
    beforeAll(initializeTestParser);

    test('{% set $0 %}', async () => {
        const { document, position } = await documentWithCursor(`{% set $0 %}`);
        assert.doesNotThrow(() => document.deepestAt(position));
    });

    test('{% set x = $0 %}', async () => {
        const { document, position } = await documentWithCursor(`{% set x = $0 %}`);
        assert.doesNotThrow(() => document.deepestAt(position));
    });

    test('{% if $0 %}{% endif %}', async () => {
        const { cursorNode } = await documentWithCursor(`{% if $0 %}{% endif %}`);
        assertAncestor(cursorNode, 'if');
    });

    test('{% for $0 %}', async () => {
        const { document, position } = await documentWithCursor(`{% for $0 %}{% endfor %}`);
        assert.doesNotThrow(() => document.deepestAt(position));
    });

    test('{% for u in $0 %}', async () => {
        const { document, position } = await documentWithCursor(`{% for u in $0 %}{% endfor %}`);
        assert.doesNotThrow(() => document.deepestAt(position));
    });

    test("{% import '...' as $0 %}", async () => {
        const { document, position } = await documentWithCursor(`{% import 'components.html.twig' as $0 %}`);
        assert.doesNotThrow(() => document.deepestAt(position));
    });
});

describe('Document.deepestAt — unclosed constructs', () => {
    beforeAll(initializeTestParser);

    test('unterminated output expression', async () => {
        const { document, position } = await documentWithCursor(`{{ foo$0`);
        assert.doesNotThrow(() => document.deepestAt(position));
        assert.doesNotThrow(() => document.locals);
    });

    test('if with no endif', async () => {
        const { document, position } = await documentWithCursor(`{% if cond %}body$0`);
        assert.doesNotThrow(() => document.deepestAt(position));
        assert.doesNotThrow(() => document.locals);
    });

    test('cursor inside unterminated block', async () => {
        const { document, position } = await documentWithCursor(`{% block name %}$0`);
        assert.doesNotThrow(() => document.deepestAt(position));
        assert.doesNotThrow(() => document.locals);
    });
});

describe('Document.deepestAt — comments, text, object/array literals', () => {
    beforeAll(initializeTestParser);

    test('cursor inside comment', async () => {
        const { cursorNode } = await documentWithCursor(`{# hello $0 world #}`);
        assertAncestor(cursorNode, 'comment');
    });

    test('cursor inside raw text between tags', async () => {
        const { document, position } = await documentWithCursor(`<div>hello $0 world</div>{{ x }}`);
        assert.doesNotThrow(() => document.deepestAt(position));
    });

    test('cursor in object literal value slot', async () => {
        const { document, position } = await documentWithCursor(`{% set x = { key: $0 } %}`);
        assert.doesNotThrow(() => document.deepestAt(position));
    });

    test('cursor in array literal slot', async () => {
        const { document, position } = await documentWithCursor(`{% set x = [ $0 ] %}`);
        assert.doesNotThrow(() => document.deepestAt(position));
    });
});
