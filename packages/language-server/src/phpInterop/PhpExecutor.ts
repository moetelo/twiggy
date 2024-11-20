import { PhpUtilPath } from '../twigEnvironment/PhpUtilPath';
import { execPromisified, isProcessError } from '../utils/exec';
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

    async call<TResult>(command: string, args: string[]): Promise<TResult | null> {
        if (!this._phpExecutable) {
            return null;
        }

        try {
            const result = await execPromisified(
                `${this._phpExecutable} ${command} ${args.join(' ')}`,
                { cwd: this._workspaceDirectory },
            );

            return JSON.parse(result.stdout) as TResult;
        } catch (error) {
            console.error(
                `Command "${command} ${args.join(' ')}" failed with following message:`,
                (error as Error).message,
            );

            if (isProcessError(error)) {
                console.error(
                    "stdout:\n",
                    error.stdout,
                    "stderr:\n",
                    error.stderr,
                );
            }

            return null;
        }
    }

    async getClassDefinition(className: string) {
        return await this.call<{ path: string | null }>(PhpUtilPath.getDefinitionPhp, [
            this._workspaceDirectory,
            `'${className}'`,
        ]);
    }

    async getClassCompletion(className: string) {
        return await this.call<string[]>(PhpUtilPath.getCompletionPhp, [
            this._workspaceDirectory,
            `'${className}'`,
        ]) || [];
    }

    async reflectType(className: string) {
        return await this.call<ReflectedType>(PhpUtilPath.reflectType, [
            this._workspaceDirectory,
            `'${className}'`,
        ]);
    }
}
