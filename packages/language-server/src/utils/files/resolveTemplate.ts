import { fileStat } from './fileStat';

// HACK: Maybe we should move these to a configuration setting?
const extensions = [`.twig`, `.html`];

const indexTemplateFilenames = [`index`];

/**
 * Searches for a template file, and returns the first match if there is one.
 */
export const resolveTemplate = async (
    pathToTwig: string,
): Promise<string | null> => {
    let stats = await fileStat(pathToTwig);

    if (stats?.isFile()) {
        return pathToTwig;
    }

    for (const extension of extensions) {
        const testPath = `${pathToTwig}${extension}`;
        stats = await fileStat(testPath);

        if (stats?.isFile()) {
            return testPath;
        }
    }

    for (const filename of indexTemplateFilenames) {
        for (const extension of extensions) {
            const testPath = `${pathToTwig}/${filename}${extension}`;
            stats = await fileStat(testPath);

            if (stats?.isFile()) {
                return testPath;
            }
        }
    }

    return null;
};
