import { describe, test, beforeAll } from 'bun:test';
import * as assert from 'node:assert/strict';
import { filters } from 'completions/filters';
import { twigFilters } from 'staticCompletionInfo';
import { documentWithCursor } from '../__helpers__/fixtures';
import { initializeTestParser } from '../__helpers__/parser';

describe('filters', () => {
    beforeAll(initializeTestParser);

    test('suggests built-in filters after pipe', async () => {
        const { cursorNode } = await documentWithCursor(`{{ something|$0 }}`);
        const customFilters = [
            { identifier: 'custom_filter_without_args', arguments: [] },
            {
                identifier: 'custom_filter_with_args',
                arguments: [
                    { identifier: 'arg1', defaultValue: 'default' },
                ],
            },
        ];
        const completions = filters(cursorNode, customFilters);

        twigFilters.every((filter) => {
            assert.ok(
                completions.some((item) => item.label === filter.label),
                `${filter.label} not in completions.`,
            );
        });

        customFilters.every((filter) => {
            assert.ok(
                completions.some((item) => item.label === filter.identifier),
                `${filter.identifier} not in completions.`,
            );
        });

        assert.equal(completions.length, twigFilters.length + customFilters.length);
    });
});
