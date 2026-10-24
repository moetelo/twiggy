import type { PhpExecutor } from '../phpInterop/PhpExecutor';
import type { IFrameworkTwigEnvironment } from './IFrameworkTwigEnvironment';
import { EmptyEnvironment } from './IFrameworkTwigEnvironment';
import type { TwigEnvironmentArgs } from './TwigEnvironmentArgs';
import { parseDebugTwigOutput } from './symfony/parseDebugTwigOutput';
import type { TemplatePathMapping, TwigEnvironment } from './types';

export class CraftTwigEnvironment implements IFrameworkTwigEnvironment {
    #environment: TwigEnvironment | null = null;
    readonly routes = Object.freeze({});

    constructor(private readonly _phpExecutor: PhpExecutor) {}

    get environment() {
        return this.#environment;
    }

    async refresh(_args: TwigEnvironmentArgs): Promise<void> {
        this.#environment = await this.#loadEnvironment();
    }

    get templateMappings(): TemplatePathMapping[] {
        return this.#environment?.LoaderPaths?.length
            ? this.#environment.LoaderPaths
            : EmptyEnvironment.templateMappings;
    }

    async #loadEnvironment(): Promise<TwigEnvironment | null> {
        const result = await this._phpExecutor.printCraftTwigEnvironment();
        if (!result) {
            return null;
        }

        return parseDebugTwigOutput(result);
    }
}
