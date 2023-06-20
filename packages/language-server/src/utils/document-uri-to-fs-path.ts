import { DocumentUri } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

export function documentUriToFsPath(documentUri: DocumentUri): string {
  return URI.parse(documentUri).fsPath;
}
