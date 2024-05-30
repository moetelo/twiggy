import { ReflectedType } from '../phpInterop/ReflectedType';
import { ITypeResolver } from './ITypeResolver';
import { IPhpExecutor } from '../phpInterop/IPhpExecutor';

export class TypeResolver implements ITypeResolver {
    #typeCache: Map<string, ReflectedType | null> = new Map();

    constructor(
        private readonly phpExecutor: IPhpExecutor,
    ) {
    }

    async reflectType(className: string): Promise<ReflectedType | null> {
        if (!className) return null;

        const cachedType = this.#typeCache.get(className);
        if (cachedType) return cachedType;

        const type = await this.phpExecutor.reflectType(className);
        this.#typeCache.set(className, type);

        return type;
    }
}
