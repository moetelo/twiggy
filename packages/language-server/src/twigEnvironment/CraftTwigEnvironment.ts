import { PhpExecutor } from '../phpInterop/PhpExecutor';
import { EmptyEnvironment, IFrameworkTwigEnvironment } from './IFrameworkTwigEnvironment';
import { PhpUtilPath } from './PhpUtilPath';
import { TwigEnvironmentArgs } from './TwigEnvironmentArgs';
import { SymfonyTwigDebugJsonOutput, parseDebugTwigOutput } from './symfony/parseDebugTwigOutput';
import { TemplatePathMapping, TwigEnvironment } from './types';

export class CraftTwigEnvironment implements IFrameworkTwigEnvironment {
    #environment: TwigEnvironment | null = null;
    readonly routes = Object.freeze({});

    constructor(private readonly _phpExecutor: PhpExecutor) {
    }

    get environment() {
        return this.#environment;
    }

    async refresh({ workspaceDirectory }: TwigEnvironmentArgs): Promise<void> {
        this.#environment = await this.#loadEnvironment(workspaceDirectory);
    }

    get templateMappings(): TemplatePathMapping[] {
        return this.#environment?.LoaderPaths?.length
            ? this.#environment.LoaderPaths
            : EmptyEnvironment.templateMappings;
    }

    async #loadEnvironment(workspaceDirectory: string): Promise<TwigEnvironment | null> {
        const result = await this._phpExecutor.callJson<SymfonyTwigDebugJsonOutput>(
            PhpUtilPath.getCraftTwig, [
                workspaceDirectory,
            ]
        );

        if (!result) {
            return null;
        }

        return parseDebugTwigOutput(result);
    }
}
