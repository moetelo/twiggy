import nodePath from 'node:path';

// A single leading separator: rooted, but without a drive letter or UNC prefix.
// On Windows, `debug:twig` reports `<projectDir>/templates` as `/templates`:
// Symfony joins paths with `/` but trims only `\` after stripping the project dir.
const rootedWithoutDrive = /^[\\/](?![\\/])/u;

// Symfony reports `debug:twig` loader paths relative to its project dir.
export const resolveLoaderPath = (
    directory: string,
    projectDir: string,
    path: nodePath.PlatformPath = nodePath,
): string => {
    const isWin32 = path.sep === '\\';
    const loaderPath =
        isWin32 && rootedWithoutDrive.test(directory) ? directory.slice(1) : directory;

    return path.resolve(projectDir, loaderPath);
};
