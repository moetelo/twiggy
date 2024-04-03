export * from './types';

import { exec } from '../../utils/exec';
import { TwigDebugJsonOutput, parseDebugTwigOutput } from './parseDebugTwigOutput';
import { TwigDebugRouterOutput } from './routes';

const runSymfonyCommand = async <TResult>(phpBinConsoleCommand: string | undefined, command: string): Promise<TResult | undefined> => {
    if (!phpBinConsoleCommand) return undefined;

    const debugTwigCommand = `${phpBinConsoleCommand} ${command} --format json`;
    const { stdout, stderr } = await exec(debugTwigCommand);

    if (stderr) {
        console.error(stderr);
    }

    try {
        return JSON.parse(stdout) as TResult;
    } catch (e) {
        console.error(e);
        return undefined;
    }
};

export const getSectionsFromSymfonyDebugTwig = async (phpBinConsoleCommand: string | undefined) => {
    const output = await runSymfonyCommand<TwigDebugJsonOutput>(phpBinConsoleCommand, 'debug:twig');
    if (!output) return;

    return parseDebugTwigOutput(output);
};

export const getRoutesFromSymfonyDebugRouter = async (phpBinConsoleCommand: string | undefined) => {
    return await runSymfonyCommand<TwigDebugRouterOutput>(phpBinConsoleCommand, 'debug:router');
};
