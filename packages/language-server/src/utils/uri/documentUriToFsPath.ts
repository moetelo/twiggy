import { DocumentUri } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

export function documentUriToFsPath(documentUri: DocumentUri): string {
  if (!DocumentUri.is(documentUri)) return documentUri;

  // valid document uri must have file: scheme
  return URI.parse(documentUri, true).fsPath;
}
