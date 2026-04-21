import { describe, test, beforeAll } from 'bun:test';
import * as assert from 'node:assert/strict';
import { documentFromCode } from '../__helpers__/documentFromCode';
import { documentWithCursor } from '../__helpers__/fixtures';
import { initializeTestParser } from '../__helpers__/parser';

describe('Document.deepestAt', () => {
    beforeAll(initializeTestParser);

    test('cursor between nodes takes the node before the cursor', async () => {
        const { cursorNode } = await documentWithCursor(`{{hello}}$0{{world}}`);

        assert.equal(cursorNode.type, 'embedded_end');
    });

    test('cursor after the space char takes the next node because its startIndex is eq to space idx', async () => {
        const { cursorNode, position } = await documentWithCursor(`{{ $0hello }}`);

        assert.equal(cursorNode.type, 'variable');
        assert.equal(cursorNode.startIndex, position.character);
    });

    test('iterate tokens', async () => {
        const document = await documentFromCode(`{%set variable = 123%}{{variable}}`);
        const expectedNodes = [
            { type: 'embedded_begin', start: 0, nodeText: '{%' },
            { type: 'keyword', start: 3, nodeText: 'set' },
            { type: 'variable', start: 7, nodeText: 'variable' },
            { type: '=', start: 16, nodeText: '=' },
            { type: 'number', start: 18, nodeText: '123' },
            { type: 'embedded_end', start: 21, nodeText: '%}' },

            { type: 'embedded_begin', start: 23, nodeText: '{{' },
            { type: 'variable', start: 25, nodeText: 'variable' },
            { type: 'embedded_end', start: 33, nodeText: '}}' },
        ] as const;

        for (const { type, start, nodeText } of expectedNodes) {
            const end = start + nodeText.length;

            for (let character = start; character < end; character++) {
                const node = document.deepestAt({ line: 0, character });
                assert.equal(node.type, type);
                assert.equal(node.text, nodeText);
            }
        }
    });
});


describe('Document.deepestAt for incomplete nodes', () => {
    beforeAll(initializeTestParser);

    test('empty output', async () => {
        const { cursorNode } = await documentWithCursor(`{{ $0 }}`);

        assert.equal(cursorNode.type, 'output');
    });

    test('empty if condition', async () => {
        const { cursorNode } = await documentWithCursor(`{% if$0 %}{% endif %}`);

        assert.equal(cursorNode.parent!.type, 'if');
    });
});
