import { describe, test } from 'bun:test';
import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { resolveLoaderPath } from 'twigEnvironment/symfony/resolveLoaderPath';

describe('resolveLoaderPath', () => {
    describe('posix', () => {
        const projectDir = '/workspace/app';

        test('resolves a relative path against the project dir', () => {
            assert.equal(
                resolveLoaderPath('templates', projectDir, path.posix),
                '/workspace/app/templates',
            );
        });

        test('keeps an absolute path outside the project dir', () => {
            assert.equal(
                resolveLoaderPath('/opt/bundles/views', projectDir, path.posix),
                '/opt/bundles/views',
            );
        });
    });

    describe('win32', () => {
        const projectDir = 'C:\\workspace\\app';

        test('treats `/templates` as relative to the project dir', () => {
            assert.equal(
                resolveLoaderPath('/templates', projectDir, path.win32),
                'C:\\workspace\\app\\templates',
            );
        });

        test('treats `\\templates` as relative to the project dir', () => {
            assert.equal(
                resolveLoaderPath('\\templates', projectDir, path.win32),
                'C:\\workspace\\app\\templates',
            );
        });

        test('keeps a drive-letter path', () => {
            assert.equal(
                resolveLoaderPath('D:\\bundles\\views', projectDir, path.win32),
                'D:\\bundles\\views',
            );
        });

        test('keeps a UNC path', () => {
            assert.equal(
                resolveLoaderPath('\\\\server\\share\\views', projectDir, path.win32),
                '\\\\server\\share\\views',
            );
        });

        test('normalizes mixed separators', () => {
            assert.equal(
                resolveLoaderPath(
                    'vendor\\knplabs\\knp-menu\\src\\Knp\\Menu/Resources/views',
                    projectDir,
                    path.win32,
                ),
                'C:\\workspace\\app\\vendor\\knplabs\\knp-menu\\src\\Knp\\Menu\\Resources\\views',
            );
        });
    });
});
