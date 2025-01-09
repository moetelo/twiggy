import { ReflectedType } from './ReflectedType';
import { TwigEnvironment } from 'twigEnvironment/types';

export interface IPhpExecutor {
    call(command: string, args: string[]): Promise<{
        stdout: string;
        stderr: string;
    } | null>;

    callJson<TResult>(command: string, args: string[]): Promise<TResult | null>;
    getEnvironment(environmentPath: string, framework: string): Promise<TwigEnvironment>;
    getClassDefinition(className: string): Promise<{ path: string | null; } | null>;
    /** @deprecated TODO(zekfad): rename to getNamespaceCompletions */
    getClassCompletion(className: string): Promise<string[]>;
    /** @deprecated TODO(zekfad): rename to getTypeCompletions */
    reflectType(className: string): Promise<ReflectedType | null>;
}
