import { PhpExecutor } from '../phpInterop/PhpExecutor';
import { EmptyEnvironment, IFrameworkTwigEnvironment } from './IFrameworkTwigEnvironment';
import { PhpUtilPath } from './PhpUtilPath';
import { TwigEnvironmentArgs } from './TwigEnvironmentArgs';
import { SymfonyTwigDebugJsonOutput, parseDebugTwigOutput } from './symfony/parseDebugTwigOutput';
import { TwigEnvironment } from './types';

export class CraftTwigEnvironment implements IFrameworkTwigEnvironment {
    #environment: TwigEnvironment | null = null;
    readonly routes = Object.freeze({});
    readonly templateMappings = EmptyEnvironment.templateMappings;

    constructor(private readonly _phpExecutor: PhpExecutor) {
    }

    get environment() {
        return this.#environment;
    }

    async refresh({ workspaceDirectory }: TwigEnvironmentArgs): Promise<void> {
        this.#environment = await this.#loadEnvironment(workspaceDirectory);
    }

    #loadEnvironment(workspaceDirectory: string): Promise<TwigEnvironment | null> {
        return this._phpExecutor.getEnvironment(
            'craft',
            workspaceDirectory,
        ).catch((error) => {
            console.error("Failed to load vanilla twig environment:", error);
            return null;
        });
    }
}
