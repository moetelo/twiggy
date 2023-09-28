import { Range } from 'vscode-languageserver/node';

export interface LocalSymbol {
  range: Range;

  name: string;
  nameRange: Range;
}

export interface TwigVariable extends LocalSymbol {
  value: string;
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

export type LocalSymbolInformation = {
  variable: TwigVariable[];
  macro: TwigMacro[];
  block: TwigBlock[];
};
