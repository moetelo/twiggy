import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { PhpUtilPathTable } from 'twigEnvironment/PhpUtilPath';

const FIXTURES_DIR = path.join(__dirname, '..', '__fixtures__');
const PHP_UTILS_DIR = path.resolve(__dirname, '..', '..', '..', 'phpUtils');

export const PSR4_WORKSPACE = path.join(FIXTURES_DIR, 'psr4-workspace');
export const TWIG_ENV_WORKSPACE = path.join(FIXTURES_DIR, 'twig-env');

/**
 * Production `PhpUtilPath` resolves scripts relative to the bundled `dist/`
 * directory; in tests we run TypeScript directly and point at the source
 * `phpUtils/` dir instead. Pass to `new PhpExecutor(php, dir, PhpUtilSourcePath)`.
 */
export const PhpUtilSourcePath: PhpUtilPathTable = {
    printTwigEnvironment: path.join(PHP_UTILS_DIR, 'printTwigEnvironment.php'),
    getCraftTwig: path.join(PHP_UTILS_DIR, 'printCraftTwigEnvironment.php'),
    getDefinitionPhp: path.join(PHP_UTILS_DIR, 'definitionClassPsr4.php'),
    getCompletionPhp: path.join(PHP_UTILS_DIR, 'completeClassPsr4.php'),
    reflectType: path.join(PHP_UTILS_DIR, 'reflectType.php'),
};

const isOnPath = (binary: string) => {
    const probe = spawnSync(binary, ['--version'], { stdio: 'ignore' });
    return probe.status === 0;
};

export const hasPhp = () => isOnPath('php');
const hasComposer = () => isOnPath('composer');

export const ensureFixtureInstalled = (workspaceDir: string) => {
    const autoload = path.join(workspaceDir, 'vendor', 'autoload.php');
    if (existsSync(autoload)) {
        return true;
    }

    if (!hasComposer()) {
        return false;
    }

    const result = spawnSync(
        'composer',
        ['install', '--no-interaction', '--no-progress', '--quiet'],
        { cwd: workspaceDir, stdio: 'inherit' },
    );

    return result.status === 0 && existsSync(autoload);
};
