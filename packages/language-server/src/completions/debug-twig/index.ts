export * from './types';

import { exec } from '../../utils/exec';
import { parseSections } from './parse-sections';

export async function getSectionsFromPhpDebugTwig(phpBinConsoleCommand: string) {
    const { stdout, stderr } = await exec(phpBinConsoleCommand + ' debug:twig --format json').catch((err) => err);

    if (stderr) {
        return undefined;
    }

    return parseSections(stdout);
}
