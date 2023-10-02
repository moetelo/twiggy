import { Range } from 'vscode-languageserver/node';

export interface LocalSymbol {
  name: string;
  nameRange: Range;

  range: Range;
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
  extends?: string;
  variable: TwigVariable[];
  macro: TwigMacro[];
  block: TwigBlock[];
};
