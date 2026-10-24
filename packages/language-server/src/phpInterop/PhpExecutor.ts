import type { PhpUtilPathTable } from '../twigEnvironment/PhpUtilPath';
import { PhpUtilPath } from '../twigEnvironment/PhpUtilPath';
import type { SymfonyTwigDebugJsonOutput } from '../twigEnvironment/symfony/parseDebugTwigOutput';
import { exec } from '../utils/exec';
import type { IPhpExecutor } from './IPhpExecutor';
import type { ReflectedType } from './ReflectedType';

export class PhpExecutor implements IPhpExecutor {
    constructor(
        private readonly _phpExecutable: string | undefined,
        private readonly _workspaceDirectory: string,
        private readonly _phpUtilPath: PhpUtilPathTable = PhpUtilPath,
    ) {
        if (!this._phpExecutable) {
            console.warn('`twiggy.phpExecutable` is not configured. Some features will be disabled.');
        }
    }

    async call(command: string, args: string[]) {
        if (!this._phpExecutable) {
            return null;
        }

        const result = await exec(this._phpExecutable, [
            '-d',
            'display_errors=stderr',
            command,
            ...args,
        ], {
            cwd: this._workspaceDirectory
        });

        if (result.stderr) {
            console.error(`${command} ${args.join(' ')}`);
            console.error('stdout:', result.stdout);
            console.error('stderr:\n', result.stderr);
        }

        return result;
    }

    async callJson<TResult>(command: string, args: string[]): Promise<TResult | null> {
        const result = await this.call(command, args);
        if (!result) {
            return null;
        }

        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The caller declares the shape of the PHP script's JSON output; there is no runtime schema.
        return JSON.parse(result.stdout) as TResult;
    }

    async getClassDefinition(className: string) {
        return this.callJson<{ path: string | null }>(this._phpUtilPath.getDefinitionPhp, [
            this._workspaceDirectory,
            className,
        ]);
    }

    async getClassCompletion(className: string) {
        return await this.callJson<string[]>(this._phpUtilPath.getCompletionPhp, [
            this._workspaceDirectory,
            className,
        ]) ?? [];
    }

    async reflectType(className: string) {
        return this.callJson<ReflectedType>(this._phpUtilPath.reflectType, [
            this._workspaceDirectory,
            className,
        ]);
    }

    async printTwigEnvironment(twigEnvironmentFile: string) {
        return this.callJson<SymfonyTwigDebugJsonOutput>(this._phpUtilPath.printTwigEnvironment, [
            twigEnvironmentFile,
        ]);
    }

    async printCraftTwigEnvironment() {
        return this.callJson<SymfonyTwigDebugJsonOutput>(this._phpUtilPath.getCraftTwig, [
            this._workspaceDirectory,
        ]);
    }
}
