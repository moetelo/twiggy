import { isFile } from './fileStat';

// HACK: Maybe we should move these to a configuration setting?
const extensions = ['twig', 'html'];
const CRAFT_INDEX_TEMPLATE_NAME = 'index';

export function* generateResolveSequence(pathToTwig: string): Generator<string> {
    yield pathToTwig;

    for (const extension of extensions) {
        yield `${pathToTwig}.${extension}`;
    }

    for (const extension of extensions) {
        yield `${pathToTwig}/${CRAFT_INDEX_TEMPLATE_NAME}.${extension}`;
    }
}

/**
 * Searches for a template file, and returns the first match if there is one.
 */
export const resolveTemplate = async (
    pathToTwig: string,
): Promise<string | null> => {
    for (const path of generateResolveSequence(pathToTwig)) {
        if (await isFile(path)) {
            return path;
        }
    }

    return null;
};
