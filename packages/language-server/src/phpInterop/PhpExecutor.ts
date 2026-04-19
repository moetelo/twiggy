import { PhpUtilPath } from '../twigEnvironment/PhpUtilPath';
import { exec } from '../utils/exec';
import { IPhpExecutor } from './IPhpExecutor';
import { ReflectedType } from './ReflectedType';

export class PhpExecutor implements IPhpExecutor {
    constructor(
        private readonly _phpExecutable: string | undefined,
        private readonly _workspaceDirectory: string,
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
            console.error(
                `Command "${command} ${args.join(' ')}" failed with following message:`,
                result.stderr,
            );

            console.error(
                "stdout:\n",
                result.stdout,
                "stderr:\n",
                result.stderr,
            );
        }

        return result;
    }

    async callJson<TResult>(command: string, args: string[]): Promise<TResult | null> {
        const result = await this.call(command, args);
        if (!result) {
            return null;
        }

        return JSON.parse(result.stdout) as TResult;
    }

    async getClassDefinition(className: string) {
        return await this.callJson<{ path: string | null }>(PhpUtilPath.getDefinitionPhp, [
            this._workspaceDirectory,
            `'${className}'`,
        ]);
    }

    async getClassCompletion(className: string) {
        return await this.callJson<string[]>(PhpUtilPath.getCompletionPhp, [
            this._workspaceDirectory,
            `'${className}'`,
        ]) || [];
    }

    async reflectType(className: string) {
        return await this.callJson<ReflectedType>(PhpUtilPath.reflectType, [
            this._workspaceDirectory,
            `'${className}'`,
        ]);
    }
}
