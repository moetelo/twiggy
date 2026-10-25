import path from 'node:path';
import type { IPhpExecutor } from '../phpInterop/IPhpExecutor';
import { isFile } from '../utils/files/fileStat';
import type { IFrameworkTwigEnvironment } from './IFrameworkTwigEnvironment';
import { EmptyEnvironment } from './IFrameworkTwigEnvironment';
import type { TwigEnvironmentArgs } from './TwigEnvironmentArgs';
import { findProjectDir } from './symfony/findProjectDir';
import type { SymfonyTwigDebugJsonOutput } from './symfony/parseDebugTwigOutput';
import { parseDebugTwigOutput } from './symfony/parseDebugTwigOutput';
import { resolveLoaderPath } from './symfony/resolveLoaderPath';
import type { TwigEnvironment, RouteNameToPathRecord, TemplatePathMapping } from './types';

// The Symfony project dir may differ from the workspace, e.g. in a monorepo.
const resolveTemplateMappings = async (
    loaderPaths: TemplatePathMapping[],
    consolePath: string,
    workspaceDirectory: string,
): Promise<TemplatePathMapping[]> => {
    const projectDir = (await findProjectDir(path.dirname(consolePath))) ?? workspaceDirectory;

    return loaderPaths.map(({ namespace, directory }) => ({
        namespace,
        directory: resolveLoaderPath(directory, projectDir),
    }));
};

export class SymfonyTwigEnvironment implements IFrameworkTwigEnvironment {
    #environment: TwigEnvironment | null = null;
    #routes: RouteNameToPathRecord = {};
    #templateMappings: TemplatePathMapping[] = [];

    #symfonyConsolePath: string | undefined;

    constructor(private readonly _phpExecutor: IPhpExecutor) {}

    get environment() {
        return this.#environment;
    }

    get routes() {
        return this.#routes;
    }

    get templateMappings(): TemplatePathMapping[] {
        return this.#templateMappings.length > 0
            ? this.#templateMappings
            : EmptyEnvironment.templateMappings;
    }

    async refresh({ symfonyConsolePath, workspaceDirectory }: TwigEnvironmentArgs): Promise<void> {
        this.#symfonyConsolePath = symfonyConsolePath;

        if (!symfonyConsolePath) {
            console.warn('Symfony console path is not set');
        }

        // PHP runs the console with the workspace as cwd.
        const consolePath = path.resolve(workspaceDirectory, symfonyConsolePath);
        if (!(await isFile(consolePath))) {
            console.warn(`Symfony console path "${consolePath}" does not exist`);
        }

        const [environment, routes] = await Promise.all([
            this.#loadEnvironment(),
            this.#loadRoutes(),
        ]);
        const templateMappings = environment
            ? await resolveTemplateMappings(
                  environment.LoaderPaths,
                  consolePath,
                  workspaceDirectory,
              )
            : [];

        this.#environment = environment;
        this.#routes = routes;
        this.#templateMappings = templateMappings;
    }

    async #loadEnvironment(): Promise<TwigEnvironment | null> {
        const result = await this.#runSymfonyCommand<SymfonyTwigDebugJsonOutput>('debug:twig');

        if (!result) {
            return null;
        }

        return parseDebugTwigOutput(result);
    }

    async #loadRoutes(): Promise<RouteNameToPathRecord> {
        const result = await this.#runSymfonyCommand<RouteNameToPathRecord>('debug:router');
        return result ?? {};
    }

    async #runSymfonyCommand<TResult>(command: string): Promise<TResult | null> {
        if (!this.#symfonyConsolePath) {
            return null;
        }

        return this._phpExecutor.callJson<TResult>(this.#symfonyConsolePath, [
            command,
            '--format',
            'json',
        ]);
    }
}
