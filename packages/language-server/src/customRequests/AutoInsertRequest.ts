import { Range, TextEdit } from 'vscode-languageserver';
import * as proto from 'vscode-languageserver-protocol';

export namespace AutoInsertRequest {
	export type ParamsType = proto.TextDocumentPositionParams & {
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
	export const type = 'twig/client/autoInsert';
}
