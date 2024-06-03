import { describe, test } from 'node:test'
import * as assert from 'node:assert/strict'
import { generateResolveSequence } from '../src/utils/files/resolveTemplate';

describe('Documents', () => {
    test('resolveTemplate iterates over correct sequence of paths', async () => {
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
