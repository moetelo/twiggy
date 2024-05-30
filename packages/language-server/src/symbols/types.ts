import { Range } from 'vscode-languageserver/node';
import { ReflectedType } from '../phpInterop/ReflectedType';

export interface LocalSymbol {
    name: string;
    nameRange: Range;

    range: Range;
}

export type IWithReferences = { references: Range[] };
export type IWithReflectedType = {
    type?: string,
    reflectedType: ReflectedType | null,
};

export interface TwigVariableDeclaration extends LocalSymbol, IWithReferences, IWithReflectedType {
    value?: string;
}

export function hasReferences<T extends LocalSymbol | IWithReflectedType>(node: T): node is T & IWithReferences {
    return 'references' in node;
}

export function hasReflectedType<T extends LocalSymbol | IWithReferences>(node: T): node is T & IWithReflectedType {
    return 'reflectedType' in node;
}

export interface FunctionArgument extends LocalSymbol {
    value?: string;
}

export interface TwigMacro extends LocalSymbol {
    args: FunctionArgument[];
    symbols: LocalSymbolInformation;
}

export interface TwigBlock extends LocalSymbol {
    symbols: LocalSymbolInformation;
}

export interface TwigImport extends LocalSymbol, IWithReferences {
    path?: string;
}

export namespace TwigImport {
    export const is = (node: LocalSymbol): node is TwigImport => 'path' in node;
}

export type LocalSymbolInformation = {
    variableDefinition: Map<string, TwigImport | TwigVariableDeclaration>;

    extends: string | undefined;
    imports: TwigImport[];
    variable: TwigVariableDeclaration[];
    macro: TwigMacro[];
    block: TwigBlock[];
};
