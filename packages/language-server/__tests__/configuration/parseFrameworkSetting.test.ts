import { describe, test } from 'bun:test';
import * as assert from 'node:assert/strict';
import { parseFrameworkSetting } from 'configuration/parseFrameworkSetting';
import { PhpFrameworkOption } from 'configuration/LanguageServerSettings';

describe('parseFrameworkSetting', () => {
    test('keeps known options', () => {
        for (const option of Object.values(PhpFrameworkOption)) {
            assert.equal(parseFrameworkSetting(option), option);
        }
    });

    test('treats VS Code empty string as unset', () => {
        assert.equal(parseFrameworkSetting(''), undefined);
    });

    test('treats missing values as unset', () => {
        assert.equal(parseFrameworkSetting(undefined), undefined);
        assert.equal(parseFrameworkSetting(null), undefined);
    });

    test('treats unknown values as unset', () => {
        assert.equal(parseFrameworkSetting('laravel'), undefined);
        assert.equal(parseFrameworkSetting(42), undefined);
    });
});
