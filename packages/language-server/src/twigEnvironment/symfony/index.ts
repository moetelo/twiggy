import { exec } from '../../utils/exec';
import { SymfonyTwigDebugJsonOutput, parseDebugTwigOutput } from './parseDebugTwigOutput';

const runSymfonyCommand = async <TResult>(
    phpExecutable: string,
    symfonyConsolePath: string,
    command: string,
): Promise<TResult | undefined> => {
    const debugTwigCommand = `${phpExecutable} ${symfonyConsolePath} ${command} --format json`;
    const { stdout, stderr } = await exec(debugTwigCommand);

    if (stderr) {
        console.error(stderr);
    }

    if (!stdout) {
        return;
    }

    try {
        return JSON.parse(stdout) as TResult;
    } catch (error) {
        console.error(error);
        return undefined;
    }
};

export const getTwigEnvironment = async (phpExecutable: string, symfonyConsolePath: string) => {
    const output = await runSymfonyCommand<SymfonyTwigDebugJsonOutput>(phpExecutable, symfonyConsolePath, 'debug:twig');
    if (!output) return;

    return parseDebugTwigOutput(output);
};

export type RouteNameToPathRecord = Record<string, { path: string }>;

export const getRoutes = async (phpExecutable: string, symfonyConsolePath: string) => {
    return await runSymfonyCommand<RouteNameToPathRecord>(phpExecutable, symfonyConsolePath, 'debug:router');
};
