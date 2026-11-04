/**
 * Drives the Craft environment script through `CraftTwigEnvironment` against a
 * workspace whose Craft install sits in a subfolder. The fixture's
 * `craftcms/cms` is a path-repository stand-in exposing only what the script
 * touches (`bootstrap/web.php` → view → Twig + site template roots).
 */
import { describe, test, expect } from 'bun:test';
import path from 'node:path';
import { PhpExecutor } from 'phpInterop/PhpExecutor';
import { CraftTwigEnvironment } from 'twigEnvironment/CraftTwigEnvironment';
import {
    CRAFT_SUBFOLDER_WORKSPACE,
    ensureFixtureInstalled,
    hasPhp,
    PhpUtilSourcePath,
} from './__helpers__/setup';

describe.skipIf(!hasPhp())('CraftTwigEnvironment against craft-subfolder fixture', () => {
    const craftDir = path.join(CRAFT_SUBFOLDER_WORKSPACE, 'cms');
    const env = new CraftTwigEnvironment(
        new PhpExecutor('php', CRAFT_SUBFOLDER_WORKSPACE, PhpUtilSourcePath),
    );
    const installed = ensureFixtureInstalled(craftDir);

    test('reports template roots resolved against the Craft subfolder', async () => {
        if (!installed) {
            throw new Error(
                `craft-subfolder fixture not installed (vendor/autoload.php missing). ` +
                    `Run \`composer install\` in ${craftDir}.`,
            );
        }

        await env.refresh({
            workspaceDirectory: CRAFT_SUBFOLDER_WORKSPACE,
            symfonyConsolePath: '',
            vanillaTwigEnvironmentPath: '',
        });

        expect(env.templateMappings.map(mapping => mapping.directory)).toEqual([
            // Relative `$templatesPath` from bootstrap.php.
            path.join(craftDir, 'templates'),
            // Relative site template root.
            path.join(craftDir, 'modules', 'templates'),
            // Absolute site template root is left alone.
            path.join(CRAFT_SUBFOLDER_WORKSPACE, 'plugin-templates'),
        ]);
    });
});
