import { DocumentUri } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

export function documentUriToFsPath(documentUri: DocumentUri): string {
  if (!DocumentUri.is(documentUri)) return documentUri;

  return URI.parse(documentUri).fsPath;
}
