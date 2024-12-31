import { parseDebugTwigOutput, SymfonyTwigDebugJsonOutput } from 'twigEnvironment/symfony/parseDebugTwigOutput';
import { PhpUtilPath } from '../twigEnvironment/PhpUtilPath';
import { CommandResult, exec } from '../utils/exec';
import { IPhpExecutor } from './IPhpExecutor';
import { ReflectedType } from './ReflectedType';
import { TwigEnvironment } from 'twigEnvironment/types';


type UtilsPharResult<T> = { error: true, message: string, } | { error: false, result: T, };

export class PhpExecutor implements IPhpExecutor {
    constructor(
        private readonly _phpExecutable: string | undefined,
        private readonly _autoloaderPath: string | undefined,
        private readonly _workspaceDirectory: string,
    ) {
        if (!this._phpExecutable) {
            console.warn('`twiggy.phpExecutable` is not configured. Some features will be disabled.');
        }

        if (!this._autoloaderPath) {
            console.warn('`twiggy.autoloaderPath` is not configured. Some features will be disabled.');
        }
    }

    async call(command: string, args: string[]): Promise<CommandResult | null> {
        if (!this._phpExecutable) {
            return null;
        }

        const result = await exec(this._phpExecutable, [
            command,
            ...args,
        ], {
            cwd: this._workspaceDirectory
        });

        if (result.stderr && command !== PhpUtilPath.utilsPhar) {
            // log errors for non utils phar
            console.error(
                `Command "${command} ${args.join(' ')}" produced following error message:`,
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

    private async callUtilsPhar<T>(...args: string[]): Promise<T> {
        const callResult = await this.call(PhpUtilPath.utilsPhar, args);
        if (!callResult) {
            throw new Error('Failed to execute utils phar');
        }

        if (callResult.stderr) {
            // log stderr for utils phar as warning
            console.warn('Utils phar warning:', callResult.stderr);
        }

        const result = JSON.parse(callResult.stdout) as UtilsPharResult<T>
        if (result.error) {
            throw new Error(`Utils phar returned an error: ${result.message}`);
        }

        return result.result;
    }

    async getEnvironment(framework: string, environmentPath: string): Promise<TwigEnvironment> {
        return parseDebugTwigOutput(await this.callUtilsPhar<SymfonyTwigDebugJsonOutput>(
            'get-env',
            framework,
            environmentPath,
        ));
    }

    async reflectType(className: string): Promise<ReflectedType | null> {
        if (!this._autoloaderPath) {
            return null;
        }

        try {
            return await this.callUtilsPhar<ReflectedType>(
                'get-type-completions',
                this._autoloaderPath,
                className,
            );
        } catch (error) {
            console.debug(`Failed to reflect type ${className}`, error);
            return null;
        }
    }

    async getClassDefinition(className: string) {
        if (!this._autoloaderPath) {
            return null;
        }

        try {
            return await this.callUtilsPhar<{ path: string | null }>(
                'get-type-definition',
                this._autoloaderPath,
                className,
            );
        } catch (error) {
            console.debug(`Failed to get type definition ${className}`, error);
            return null;
        }
    }

    async getClassCompletion(className: string) {
        if (!this._autoloaderPath) {
            return [];
        }

        try {
            return await this.callUtilsPhar<string[]>(
                'get-namespace-completions',
                this._autoloaderPath,
                className,
            );
        } catch (error) {
            console.debug(`Failed to get namespace completion ${className}`, error);
            return [];
        }
    }
}
