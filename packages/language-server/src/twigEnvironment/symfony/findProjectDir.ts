import path from 'node:path';
import { isFile } from '../../utils/files/fileStat';

// Nearest ancestor of `directory` (inclusive) with a `composer.json`, like Symfony's `Kernel::getProjectDir()`.
export const findProjectDir = async (directory: string): Promise<string | null> => {
    if (await isFile(path.join(directory, 'composer.json'))) {
        return directory;
    }

    const parent = path.dirname(directory);
    return parent === directory ? null : findProjectDir(parent);
};
