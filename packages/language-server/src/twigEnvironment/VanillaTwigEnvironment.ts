import type { PhpExecutor } from '../phpInterop/PhpExecutor';
import type { IFrameworkTwigEnvironment } from './IFrameworkTwigEnvironment';
import { EmptyEnvironment } from './IFrameworkTwigEnvironment';
import type { TwigEnvironmentArgs } from './TwigEnvironmentArgs';
import { parseDebugTwigOutput } from './symfony/parseDebugTwigOutput';
import type { RouteNameToPathRecord, TemplatePathMapping, TwigEnvironment } from './types';

export class VanillaTwigEnvironment implements IFrameworkTwigEnvironment {
    #environment: TwigEnvironment | null = null;
    readonly #routes: RouteNameToPathRecord = {};

    constructor(private readonly _phpExecutor: PhpExecutor) {}

    get environment() {
        return this.#environment;
    }

    get routes() {
        return this.#routes;
    }

    get templateMappings(): TemplatePathMapping[] {
        return this.#environment?.LoaderPaths.length
            ? this.#environment.LoaderPaths
            : EmptyEnvironment.templateMappings;
    }

    async refresh({ vanillaTwigEnvironmentPath }: TwigEnvironmentArgs): Promise<void> {
        this.#environment = await this.#loadEnvironment(vanillaTwigEnvironmentPath);
    }

    async #loadEnvironment(vanillaTwigEnvironmentPath: string): Promise<TwigEnvironment | null> {
        const result = await this._phpExecutor.printTwigEnvironment(vanillaTwigEnvironmentPath);
        if (!result) {
            return null;
        }

        return parseDebugTwigOutput(result);
    }
}
