import type { TextDocumentPositionParams } from 'vscode-languageserver';

export namespace IsInsideHtmlRegionRequest {
    export type ParamsType = TextDocumentPositionParams;
    export type ResponseType = boolean;
    export const type = 'twiggy/isInsideHtmlRegion';
}
