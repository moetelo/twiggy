import { PhpExecutor } from '../phpInterop/PhpExecutor';
import { isFile } from '../utils/files/fileStat';
import { EmptyEnvironment, IFrameworkTwigEnvironment } from './IFrameworkTwigEnvironment';
import { TwigEnvironmentArgs } from './TwigEnvironmentArgs';
import { SymfonyTwigDebugJsonOutput, parseDebugTwigOutput } from './symfony/parseDebugTwigOutput';
import { TwigEnvironment, RouteNameToPathRecord, TemplatePathMapping } from './types';

export class SymfonyTwigEnvironment implements IFrameworkTwigEnvironment {
    #environment: TwigEnvironment | null = null;
    #routes: RouteNameToPathRecord = {};

    #symfonyConsolePath: string | undefined;

    constructor(private readonly _phpExecutor: PhpExecutor) {
    }

    get environment() {
        return this.#environment;
    }

    get routes() {
        return this.#routes;
    }

    get templateMappings(): TemplatePathMapping[] {
        return this.#environment?.LoaderPaths?.length
            ? this.#environment.LoaderPaths
            : EmptyEnvironment.templateMappings;
    }

    async refresh({ symfonyConsolePath }: TwigEnvironmentArgs): Promise<void> {
        this.#symfonyConsolePath = symfonyConsolePath;

        if (!symfonyConsolePath) {
            console.warn('Symfony console path is not set');
        }

        if (!await isFile(symfonyConsolePath)) {
            console.warn(`Symfony console path "${symfonyConsolePath}" does not exist`);
        }

        const [environment, routes] = await Promise.all([
            this.#loadEnvironment(),
            this.#loadRoutes(),
        ]);
        this.#environment = environment;
        this.#routes = routes;
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
        return result || {};
    }

    async #runSymfonyCommand<TResult>(
        command: string,
    ): Promise<TResult | null> {
        if (!this.#symfonyConsolePath) {
            return null;
        }

        return await this._phpExecutor.call<TResult>(this.#symfonyConsolePath, [
            command,
            '--format',
            'json',
        ]);
    }
}
