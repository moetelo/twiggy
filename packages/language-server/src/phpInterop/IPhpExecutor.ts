import { ReflectedType } from './ReflectedType';

export interface IPhpExecutor {
    call<TResult>(command: string, args: string[]): Promise<TResult | null>;
    getClassDefinition(className: string): Promise<{ path: string | null; } | null>;
    getClassCompletion(className: string): Promise<string[]>;
    reflectType(className: string): Promise<ReflectedType | null>;
}
