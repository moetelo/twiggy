import { ReflectedType } from '../phpInterop/ReflectedType';
import { ITypeResolver } from './ITypeResolver';
import { IPhpExecutor } from '../phpInterop/IPhpExecutor';

export class TypeResolver implements ITypeResolver {
    #typeCache = new Map<string, ReflectedType | null>();

    constructor(
        private readonly phpExecutor: IPhpExecutor,
    ) {
    }

    async reflectType(typeName: string): Promise<ReflectedType | null> {
        if (!typeName) return null;

        const cachedType = this.#typeCache.get(typeName);
        if (cachedType) return cachedType;

        const type = await this.phpExecutor.reflectType(typeName);
        this.#typeCache.set(typeName, type);

        return type;
    }
}
