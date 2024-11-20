import { Range, TextDocumentPositionParams, TextEdit } from 'vscode-languageserver';

export namespace AutoInsertRequest {
	export type ParamsType = TextDocumentPositionParams & {
		options: {
			lastChange: {
				range: Range;
				rangeOffset: number;
				rangeLength: number;
				text: string;
			},
		},
	};
	export type ResponseType = string | TextEdit | null | undefined;
	export type ErrorType = never;
	export const type = 'twiggy/client/autoInsert';
}
