import { TwigEnvironment } from './types';
import { getPhpVersion } from './phpVersion';
import * as symfony from './symfony';
import * as craft from './craft';
import { PhpFramework } from '../configuration/LanguageServerSettings';


export type GetTwigEnvironmentArgs = {
    phpExecutable: string,
    symfonyConsolePath?: string,
    workspaceDirectory: string,
    framework: PhpFramework,
};

export const getTwigEnvironment = async (args: GetTwigEnvironmentArgs): Promise<TwigEnvironment | undefined> => {
    const { phpExecutable, workspaceDirectory } = args;
    if (!phpExecutable) {
        return undefined;
    }

    const versionResult = await getPhpVersion(phpExecutable);
    if (versionResult.stderr) {
        console.error('Error while getting PHP version', versionResult.stderr);
        return undefined;
    }

    if (args.framework === PhpFramework.Symfony) {
        if (!args.symfonyConsolePath) {
            console.warn('Symfony console path is not set');
            return undefined;
        }

        return symfony.getTwigEnvironment(phpExecutable, args.symfonyConsolePath);
    }

    if (args.framework === PhpFramework.Craft) {
        try {
            return await craft.getTwigEnvironment(phpExecutable, workspaceDirectory);
        } catch (error) {
            console.error('Error while getting Twig environment:\n' + (error as Error).message);
            return undefined;
        }
    }
};

export const getRoutes = async ({ phpExecutable, symfonyConsolePath, framework }: GetTwigEnvironmentArgs) => {
    if (framework === PhpFramework.Symfony) {
        if (!symfonyConsolePath) {
            return {};
        }

        return await symfony.getRoutes(phpExecutable!, symfonyConsolePath);
    }

    return {};
};
