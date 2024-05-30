import { ReflectedType } from '../phpInterop/ReflectedType';

export interface ITypeResolver {
    reflectType(type: string): Promise<ReflectedType | null>;
}
