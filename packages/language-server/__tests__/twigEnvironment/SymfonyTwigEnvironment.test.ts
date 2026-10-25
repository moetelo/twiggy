import { afterAll, describe, test } from 'bun:test';
import * as assert from 'node:assert/strict';
import { mkdtempSync, realpathSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { SymfonyTwigEnvironment } from 'twigEnvironment/SymfonyTwigEnvironment';
import { findProjectDir } from 'twigEnvironment/symfony/findProjectDir';
import type { SymfonyTwigDebugJsonOutput } from 'twigEnvironment/symfony/parseDebugTwigOutput';
import { MockPhpExecutor } from '../__helpers__/mocks';

class FakeSymfonyConsole extends MockPhpExecutor {
    constructor(private readonly loaderPaths: SymfonyTwigDebugJsonOutput['loader_paths']) {
        super();
    }

    override async callJson<TResult>(_command: string, args: string[]): Promise<TResult | null> {
        const output: SymfonyTwigDebugJsonOutput | Record<string, never> =
            args[0] === 'debug:twig'
                ? {
                      functions: {},
                      filters: {},
                      globals: {},
                      tests: [],
                      loader_paths: this.loaderPaths,
                  }
                : {};
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Stands in for the console's untyped JSON output.
        return output as TResult;
    }
}

const touch = async (filePath: string) => {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, '');
};

describe('Symfony project dir', () => {
    const tmpPrefix = path.join(os.tmpdir(), 'twiggy-symfony-');
    // Resolve symlinks (e.g. macOS `/var` -> `/private/var`) so paths compare equal.
    const tmp = realpathSync(mkdtempSync(tmpPrefix));

    afterAll(async () => {
        await rm(tmp, { recursive: true, force: true });
    });

    test('findProjectDir walks up to the nearest composer.json', async () => {
        const root = path.join(tmp, 'nearest');
        await touch(path.join(root, 'composer.json'));
        await touch(path.join(root, 'app', 'composer.json'));
        await mkdir(path.join(root, 'app', 'bin'), { recursive: true });

        assert.equal(await findProjectDir(path.join(root, 'app', 'bin')), path.join(root, 'app'));
    });

    test('findProjectDir returns null without a composer.json', async () => {
        const dir = path.join(tmp, 'none', 'bin');
        await mkdir(dir, { recursive: true });

        assert.equal(await findProjectDir(dir), null);
    });

    test('resolves loader paths against the app dir in a monorepo', async () => {
        const workspaceDirectory = path.join(tmp, 'monorepo');
        await touch(path.join(workspaceDirectory, 'app', 'composer.json'));
        await touch(path.join(workspaceDirectory, 'app', 'bin', 'console'));

        const environment = new SymfonyTwigEnvironment(
            new FakeSymfonyConsole({
                '(None)': ['templates'],
                '@Shared': ['/opt/shared/views'],
            }),
        );
        await environment.refresh({
            symfonyConsolePath: 'app/bin/console',
            vanillaTwigEnvironmentPath: '',
            workspaceDirectory,
        });

        assert.deepEqual(environment.templateMappings, [
            { namespace: '', directory: path.join(workspaceDirectory, 'app', 'templates') },
            { namespace: '@Shared', directory: '/opt/shared/views' },
        ]);
    });

    test('falls back to the workspace without a composer.json', async () => {
        const workspaceDirectory = path.join(tmp, 'bare');
        await touch(path.join(workspaceDirectory, 'bin', 'console'));

        const environment = new SymfonyTwigEnvironment(
            new FakeSymfonyConsole({ '(None)': ['templates'] }),
        );
        await environment.refresh({
            symfonyConsolePath: './bin/console',
            vanillaTwigEnvironmentPath: '',
            workspaceDirectory,
        });

        assert.deepEqual(environment.templateMappings, [
            { namespace: '', directory: path.join(workspaceDirectory, 'templates') },
        ]);
    });
});
