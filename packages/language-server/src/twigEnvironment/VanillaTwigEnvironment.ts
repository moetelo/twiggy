import { IPhpExecutor } from 'phpInterop/IPhpExecutor';
import { EmptyEnvironment, IFrameworkTwigEnvironment } from './IFrameworkTwigEnvironment';
import { TwigEnvironmentArgs } from './TwigEnvironmentArgs';
import { RouteNameToPathRecord, TemplatePathMapping, TwigEnvironment } from './types';

export class VanillaTwigEnvironment implements IFrameworkTwigEnvironment {
    #environment: TwigEnvironment | null = null;
    #routes: RouteNameToPathRecord = {};

    constructor(private readonly _phpExecutor: IPhpExecutor) {
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

    async refresh({ vanillaTwigEnvironmentPath }: TwigEnvironmentArgs): Promise<void> {
        this.#environment = await this.#loadEnvironment(vanillaTwigEnvironmentPath);
    }

    #loadEnvironment(vanillaTwigEnvironmentPath: string): Promise<TwigEnvironment | null> {
        return this._phpExecutor.getEnvironment(
            'vanilla',
            vanillaTwigEnvironmentPath,
        ).catch((error) => {
            console.error("Failed to load vanilla twig environment:", error);
            return null;
        });
    }
}
