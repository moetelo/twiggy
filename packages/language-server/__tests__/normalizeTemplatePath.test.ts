import { describe, test } from 'node:test';
import * as assert from 'node:assert/strict';
import { normalizeDirectoryPath } from '../src/utils/paths/normalizeTemplatePath';

describe('normalizeTemplatePath', () => {
    describe('normalizeDirectoryPath', () => {
        test('handles relative path without changes', () => {
            const result = normalizeDirectoryPath(
                'templates',
                '/workspace',
                undefined,
            );
            assert.equal(result, 'templates');
        });

        test('strips leading slash from non-absolute path', () => {
            // When path starts with "/" but doesn't exist as absolute path
            const result = normalizeDirectoryPath(
                '/templates',
                '/workspace',
                undefined,
            );
            // Since "/templates" likely doesn't exist as an absolute path,
            // it should be treated as relative
            assert.equal(result, 'templates');
        });

        test('normalizes backslashes to forward slashes', () => {
            const result = normalizeDirectoryPath(
                'vendor\\templates',
                '/workspace',
                undefined,
            );
            assert.equal(result, 'vendor/templates');
        });

        test('handles mixed separators with leading slash', () => {
            const result = normalizeDirectoryPath(
                '/vendor\\templates',
                '/workspace',
                undefined,
            );
            assert.equal(result, 'vendor/templates');
        });
    });
});
