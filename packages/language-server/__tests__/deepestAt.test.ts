import { test, before, describe } from 'node:test'
import * as assert from 'node:assert/strict'
import { documentFromCode, initializeTestParser } from './utils';

describe('Document.deepestAt', () => {
    before(initializeTestParser);

    test('cursor between nodes takes the node before the cursor', async () => {
        const document = documentFromCode(`{{hello}}{{world}}`);

        const node = document.deepestAt({ line: 0, character: `{{hello}}`.length })!;

        assert.equal(node.type, 'embedded_end');
    });

    test('cursor after the space char takes the next node because its startIndex is eq to space idx', async () => {
        const document = documentFromCode(`{{ hello }}`);
        const character = `{{ `.length;

        const node = document.deepestAt({ line: 0, character })!;

        assert.equal(node.type, 'variable');
        assert.equal(node.startIndex, character);
    });

    test('iterate tokens', async () => {
        const document = documentFromCode(`{%set variable = 123%}{{variable}}`);
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
                const node = document.deepestAt({ line: 0, character })!;
                assert.equal(node.type, type);
                assert.equal(node.text, nodeText);
            }
        }
    });
});


describe('Document.deepestAt for incomplete nodes', () => {
    before(initializeTestParser);

    test('empty output', async () => {
        const document = documentFromCode(`{{  }}`);

        const node = document.deepestAt({ line: 0, character: `{{ `.length })!;

        assert.equal(node.type, 'output');
    });

    test('empty if condition', () => {
        const document = documentFromCode(`{% if %}{% endif %}`);

        const node = document.deepestAt({ line: 0, character: `{% if`.length })!;

        assert.equal(node.parent!.type, 'if');
    });
});
