import { DocumentUri } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

export function fsPathToDocumentUri(stringOrDocumentUri: string): DocumentUri {
  return URI.file(stringOrDocumentUri).toString();
}
