/**
 * Integration tests for the PHP-side phpUtils scripts driven through the real
 * PhpExecutor wrappers. Skipped when `php` is unavailable; composer install
 * runs on demand the first time the suite executes against an uninstalled
 * fixture.
 *
 * The PHP script paths are injected through the PhpExecutor constructor; in
 * production `PhpUtilPath` resolves them against the bundled `dist/` directory
 * (populated by the esbuild copy step).
 */
import { describe, test, expect, spyOn } from 'bun:test';
import { ok } from 'node:assert';
import path from 'node:path';
import { PhpExecutor } from 'phpInterop/PhpExecutor';
import { ensureFixtureInstalled, hasPhp, PhpUtilSourcePath, PSR4_WORKSPACE } from './__helpers__/setup';

describe.skipIf(!hasPhp())('phpUtils against psr4-workspace fixture', () => {
    const executor = new PhpExecutor('php', PSR4_WORKSPACE, PhpUtilSourcePath);
    const installed = ensureFixtureInstalled(PSR4_WORKSPACE);

    const requireInstalled = () => {
        if (!installed) {
            throw new Error(
                `psr4-workspace fixture not installed (vendor/autoload.php missing). ` +
                `Run \`composer install\` in ${PSR4_WORKSPACE}.`,
            );
        }
    };

    test('reflectType derives properties from `getX(): T` and lists method signatures', async () => {
        requireInstalled();
        const result = await executor.reflectType('App\\Person');

        ok(result);
        const propsByName = Object.fromEntries(
            result.properties.map((p) => [p.name, p.type]),
        );
        expect(propsByName).toMatchObject({
            name: 'string',
            age: 'int',
            parent: 'App\\Person',
            otherClass: 'App\\OtherClass',
        });

        const methodsByName = Object.fromEntries(
            result.methods.map((m) => [m.name, m]),
        );
        ok(methodsByName.greet)
        expect(methodsByName.greet.type).toBe('bool');
        expect(methodsByName.greet.parameters).toEqual([
            { name: 'msg', type: 'string', isOptional: false, isVariadic: false },
            { name: 'count', type: 'int', isOptional: true, isVariadic: false },
            { name: 'tags', type: 'string', isOptional: true, isVariadic: true },
        ]);

        // setX(...) is exposed as a method but never synthesizes a property.
        ok(methodsByName.setName)

        // Magic methods and the constructor are filtered out.
        expect(methodsByName).not.toHaveProperty('__toString');
        expect(methodsByName).not.toHaveProperty('__construct');
    });

    test('reflectType formats union return types as `A|B`', async () => {
        requireInstalled();
        const result = await executor.reflectType('App\\Person');
        ok(result);

        const union = result.methods.find((m) => m.name === 'unionReturn');
        ok(union)
        // PHP's ReflectionUnionType does not preserve declaration order.
        expect(union.type.split('|').sort()).toEqual(['int', 'string']);
    });

    test('reflectType strips a leading backslash from the class name', async () => {
        requireInstalled();
        const result = await executor.reflectType('\\App\\OtherClass');
        ok(result);
        expect(result.properties.find((p) => p.name === 'prop')?.type).toBe('int');
    });

    test('reflectType bubbles a fatal error for unknown classes', async () => {
        requireInstalled();
        // findFile returns false for unknown classes; reflectType currently
        // requires the empty result, producing a fatal error and invalid JSON
        // on stdout. Pin the current behavior so future graceful-failure work
        // has a regression to update.
        const errSpy = spyOn(console, 'error').mockImplementation(() => {});
        try {
            await expect(executor.reflectType('App\\DoesNotExist')).rejects.toThrow();
        } finally {
            errSpy.mockRestore();
        }
    });

    test('getClassDefinition resolves a PSR-4 class to its source file', async () => {
        requireInstalled();
        const result = await executor.getClassDefinition('App\\Person');
        ok(result);
        // composer's findFile yields a non-canonical path through vendor/, so
        // normalize before comparison.
        expect(path.resolve(result.path!)).toBe(path.join(PSR4_WORKSPACE, 'src', 'Person.php'));
    });

    test('getClassDefinition returns { path: null } for unknown classes', async () => {
        requireInstalled();
        const result = await executor.getClassDefinition('App\\DoesNotExist');
        expect(result).toEqual({ path: null });
    });

    test('getClassCompletion returns the registered PSR-4 prefixes for an empty namespace', async () => {
        requireInstalled();
        const result = await executor.getClassCompletion('');
        expect(result).toContain('App\\');
    });

    test('getClassCompletion lists classes within a namespace', async () => {
        requireInstalled();
        const result = await executor.getClassCompletion('App\\');
        expect(result).toEqual(
            expect.arrayContaining(['App\\Person', 'App\\OtherClass', 'App\\SomeClass']),
        );
    });
});
