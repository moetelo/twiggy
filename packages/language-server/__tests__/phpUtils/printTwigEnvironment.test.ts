/**
 * Drives the vanilla Twig environment script through `VanillaTwigEnvironment`,
 * the high-level facade. PhpExecutor is constructed with PhpUtilSourcePath so
 * it resolves scripts against the source phpUtils/ dir rather than the bundled
 * dist/ output.
 */
import { describe, test, expect } from 'bun:test';
import { ok } from 'node:assert';
import path from 'node:path';
import { PhpExecutor } from 'phpInterop/PhpExecutor';
import { VanillaTwigEnvironment } from 'twigEnvironment/VanillaTwigEnvironment';
import { ensureFixtureInstalled, hasPhp, PhpUtilSourcePath, TWIG_ENV_WORKSPACE } from './__helpers__/setup';

describe.skipIf(!hasPhp())('VanillaTwigEnvironment against twig-env fixture', () => {
    const env = new VanillaTwigEnvironment(new PhpExecutor('php', TWIG_ENV_WORKSPACE, PhpUtilSourcePath));
    const installed = ensureFixtureInstalled(TWIG_ENV_WORKSPACE);

    test('refresh() loads functions, filters, globals, loader paths and tests', async () => {
        if (!installed) {
            throw new Error(
                `twig-env fixture not installed (vendor/autoload.php missing). ` +
                `Run \`composer install\` in ${TWIG_ENV_WORKSPACE}.`,
            );
        }

        await env.refresh({
            workspaceDirectory: TWIG_ENV_WORKSPACE,
            symfonyConsolePath: '',
            vanillaTwigEnvironmentPath: path.join(TWIG_ENV_WORKSPACE, 'env.php'),
        });

        const twigEnv = env.environment;
        ok(twigEnv);

        const fns = Object.fromEntries(twigEnv.Functions.map((f) => [f.identifier, f]));
        expect(fns).toHaveProperty('say_hello');
        expect(fns.say_hello.arguments).toEqual([{ identifier: 'name', defaultValue: undefined }]);
        // Twig's own builtins should also be present and parameter defaults
        // should be parsed into structured arguments. parseDebugTwigOutput
        // splits on `=` without trimming the parts, so the identifier carries
        // a trailing space and the default value a leading one.
        expect(fns).toHaveProperty('range');
        expect(fns.range.arguments).toEqual([
            { identifier: 'start', defaultValue: undefined },
            { identifier: 'end', defaultValue: undefined },
            { identifier: 'step ', defaultValue: ' 1' },
        ]);

        const filters = twigEnv.Filters.map((f) => f.identifier);
        expect(filters).toContain('shout');
        expect(filters).toContain('upper');

        expect(twigEnv.Globals.find(g => g.identifier === 'app_name')?.value).toBe('twiggy-test');

        // Default namespace becomes empty string, named one becomes '@shared'.
        const templatesDir = path.join(TWIG_ENV_WORKSPACE, 'templates');
        expect(env.templateMappings).toEqual(
            expect.arrayContaining([
                { namespace: '', directory: templatesDir },
                { namespace: '@shared', directory: templatesDir },
            ]),
        );

        expect(twigEnv.Tests).toContain('defined');
    });
});
