import { execPromisified } from '../../utils/exec';
import { SymfonyTwigDebugJsonOutput, parseDebugTwigOutput } from '../symfony/parseDebugTwigOutput';

const printCraftTwigEnvironmentPhpPath = require.resolve('./phpUtils/printCraftTwigEnvironment');

export const getTwigEnvironment = async (phpExecutable: string, workspaceDirectory: string) => {
    const cmdArgs = [
        workspaceDirectory,
    ];
    const twigEnvironmentResult = await execPromisified(
        `${phpExecutable} ${printCraftTwigEnvironmentPhpPath} ${cmdArgs.join(' ')}`,
        { cwd: workspaceDirectory },
    );

    return parseDebugTwigOutput(JSON.parse(twigEnvironmentResult.stdout) as SymfonyTwigDebugJsonOutput);
};
