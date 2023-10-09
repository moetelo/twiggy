import { DocumentUri } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

export function toDocumentUri(path: DocumentUri | string): DocumentUri {
  if (path.startsWith('file://')) {
    return path;
  }

  return URI.file(path).toString();
}
