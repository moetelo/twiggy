import { Stats } from 'node:fs';
import { fileStat } from './fileStat';

// HACK: Maybe we should move these to a configuration setting?
const extensions = [`.twig`, `.html`];

const indexTemplateFilenames = [`index`];

const isValidPath = (stats: Stats | null): boolean => stats !== null && stats.isFile();

/**
 * Searches for a template file, and returns the first match if there is one.
 */
export const resolveTemplate = async (
    pathToTwig: string,
): Promise<string | null> => {
    if (isValidPath(await fileStat(pathToTwig))) {
        return pathToTwig;
    }

    for (const extension of extensions) {
        const testPath = `${pathToTwig}${extension}`;
        if (isValidPath(await fileStat(testPath))) {
            return testPath;
        }
    }

    for (const filename of indexTemplateFilenames) {
        for (const extension of extensions) {
            const testPath = `${pathToTwig}/${filename}${extension}`;
            if (isValidPath(await fileStat(testPath))) {
                return testPath;
            }
        }
    }

    return null;
};