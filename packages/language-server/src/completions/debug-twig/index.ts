export * from './types';

import { exec } from '../../utils/exec';
import { TwigDebugJsonOutput, parseSections } from './parse-sections';

export function generateDebugTwigCommand(phpBinConsoleCommand: string | undefined): string {
    if (!phpBinConsoleCommand) return '';

    return phpBinConsoleCommand + ' debug:twig --format json';
}

export async function getSectionsFromPhpDebugTwig(debugTwigCommand: string) {
    const { stdout, stderr } = await exec(debugTwigCommand);

    if (stderr) {
        console.error(stderr);
        return undefined;
    }

    try {
        const output: TwigDebugJsonOutput = JSON.parse(stdout);
        return parseSections(output);
    } catch (e) {
        console.error(e);
        return undefined;
    }
}
