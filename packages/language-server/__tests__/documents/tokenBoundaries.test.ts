import { describe, test, beforeAll } from 'bun:test';
import * as assert from 'node:assert/strict';
import { documentFromCode } from '../__helpers__/documentFromCode';
import { documentWithCursor, offsetToPosition, parseCursor } from '../__helpers__/fixtures';
import { initializeTestParser } from '../__helpers__/parser';

describe('parseCursor / offsetToPosition', () => {
    test('single-line cursor', () => {
        const { text, position } = parseCursor(`{{ name$0 }}`);
        assert.equal(text, `{{ name }}`);
        assert.deepEqual(position, { line: 0, character: 7 });
    });

    test('multi-line cursor', () => {
        const { text, position } = parseCursor(`{% macro test() %}\n    {{ $0 }}\n{% endmacro %}`);
        assert.equal(text.split('\n')[1], `    {{  }}`);
        assert.deepEqual(position, { line: 1, character: 7 });
    });

    test('CRLF line endings produce correct line/character', () => {
        const { text, position } = parseCursor('{% if x %}\r\n  body$0\r\n{% endif %}');
        assert.equal(text, '{% if x %}\r\n  body\r\n{% endif %}');
        assert.deepEqual(position, { line: 1, character: 6 });
    });

    test('missing marker throws', () => {
        assert.throws(() => parseCursor(`{{ no marker here }}`), /missing/);
    });

    test('two markers throws (use parseRange)', () => {
        assert.throws(() => parseCursor(`$0{{ x }}$0`), /multiple/);
    });

    test('offsetToPosition at very start', () => {
        assert.deepEqual(offsetToPosition('abc', 0), { line: 0, character: 0 });
    });

    test('offsetToPosition at newline', () => {
        assert.deepEqual(offsetToPosition('a\nbc', 2), { line: 1, character: 0 });
    });
});

describe('Document.deepestAt — boundary positions', () => {
    beforeAll(initializeTestParser);

    test('cursor at start of document', async () => {
        const { cursorNode } = await documentWithCursor(`$0{{ hello }}`);
        assert.ok(cursorNode);
    });

    test('cursor at end of document', async () => {
        const { cursorNode } = await documentWithCursor(`{{ hello }}$0`);
        assert.ok(cursorNode);
    });

    test('cursor in whitespace between tags', async () => {
        const { cursorNode } = await documentWithCursor(`{{ a }}$0   {{ b }}`);
        assert.ok(cursorNode);
    });

    test('cursor past the last character does not throw', async () => {
        const document = await documentFromCode(`{{ x }}`);
        assert.doesNotThrow(() => document.deepestAt({ line: 0, character: 999 }));
    });

    test('cursor on a blank line does not throw', async () => {
        const document = await documentFromCode(`{{ a }}\n\n{{ b }}`);
        assert.doesNotThrow(() => document.deepestAt({ line: 1, character: 0 }));
    });
});
