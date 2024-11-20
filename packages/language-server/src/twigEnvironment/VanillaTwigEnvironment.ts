import { PhpExecutor } from '../phpInterop/PhpExecutor';
import { EmptyEnvironment, IFrameworkTwigEnvironment } from './IFrameworkTwigEnvironment';
import { PhpUtilPath } from './PhpUtilPath';
import { TwigEnvironmentArgs } from './TwigEnvironmentArgs';
import { SymfonyTwigDebugJsonOutput, parseDebugTwigOutput } from './symfony/parseDebugTwigOutput';
import { RouteNameToPathRecord, TemplatePathMapping, TwigEnvironment } from './types';

export class VanillaTwigEnvironment implements IFrameworkTwigEnvironment {
    #environment: TwigEnvironment | null = null;
    #routes: RouteNameToPathRecord = {};

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

    async refresh({ vanillaTwigEnvironmentPath }: TwigEnvironmentArgs): Promise<void> {
        this.#environment = await this.#loadEnvironment(vanillaTwigEnvironmentPath);
    }

    async #loadEnvironment(vanillaTwigEnvironmentPath: string): Promise<TwigEnvironment | null> {
        const result = await this._phpExecutor.callJson<SymfonyTwigDebugJsonOutput>(
            PhpUtilPath.printTwigEnvironment, [
                vanillaTwigEnvironmentPath,
            ]
        );

        if (!result) {
            return null;
        }

        return parseDebugTwigOutput(result);
    }
}
