import { describe, test } from 'bun:test';
import * as assert from 'node:assert/strict';
import { generateResolveSequence } from 'utils/files/resolveTemplate';

describe('resolveTemplate', () => {
    test('iterates over correct sequence of paths', () => {
        const sequence = [...generateResolveSequence('foo/bar')];

        assert.deepEqual(
            sequence,
            [
                'foo/bar',
                'foo/bar.twig',
                'foo/bar.html',
                'foo/bar/index.twig',
                'foo/bar/index.html',
            ],
        );
    });
});
