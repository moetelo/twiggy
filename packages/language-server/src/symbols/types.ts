import { Range } from 'vscode-languageserver/node';

export interface LocalSymbol {
    name: string;
    nameRange: Range;

    range: Range;
}

export interface TwigVariableDeclaration extends LocalSymbol {
    value?: string;
    type?: string;
    references: Range[];
}

export function hasReferences<T extends LocalSymbol>(node: T): node is T & { references: Range[] } {
    return 'references' in node;
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

export interface TwigImport extends LocalSymbol {
    path?: string;
    references: Range[];
}

export namespace TwigImport {
    export const is = (node: LocalSymbol): node is TwigImport => 'path' in node;
}

export type LocalSymbolInformation = {
    extends?: string;
    imports: TwigImport[];
    variable: TwigVariableDeclaration[];
    macro: TwigMacro[];
    block: TwigBlock[];
};
