import { TextDocumentPositionParams } from 'vscode-languageserver';

export namespace IsInsideHtmlRegionRequest {
    export type ParamsType = TextDocumentPositionParams;
    export type ResponseType = boolean;
    export type ErrorType = never;
    export const type = 'twiggy/isInsideHtmlRegion';
}
