import { Range } from 'vscode-languageserver/node';

export interface LocalSymbol {
    name: string;
    nameRange: Range;

    range: Range;
}

export interface TwigVariable extends LocalSymbol {
    value?: string;
    type?: string;
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
}

export namespace TwigImport {
    export const is = (node: LocalSymbol): node is TwigImport => 'path' in node;
}

export type LocalSymbolInformation = {
    extends?: string;
    imports: TwigImport[];
    variable: TwigVariable[];
    macro: TwigMacro[];
    block: TwigBlock[];
};
