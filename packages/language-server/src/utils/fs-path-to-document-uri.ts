import { DocumentUri } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

export function fsPathToDocumentUri(faPath: string): DocumentUri {
  return URI.file(faPath).toString();
}
