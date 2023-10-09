import { CompletionItem, CompletionParams } from 'vscode-languageserver/node';
import { Server } from '../server';
import { findNodeByPosition } from '../utils/findElementByPosition';
import { templatePaths } from './template-paths';
import { globalVariables } from './global-variables';
import { localVariables } from './local-variables';
import { functions } from './functions';
import { filters } from './filters';
import { forLoop } from './for-loop';
import { TwigDebugInfo, getSectionsFromPhpDebugTwig } from './debug-twig';
import { TemplatePathMapping } from '../utils/symfony/twigConfig';

export class CompletionProvider {
  server: Server;
  twigInfo?: TwigDebugInfo;
  templateMappings: TemplatePathMapping[] = [];

  constructor(server: Server) {
    this.server = server;

    this.server.connection.onCompletion(this.onCompletion.bind(this));
    this.server.connection.onCompletionResolve(item => item);
  }

  async initializeGlobalsFromCommand(phpBinConsoleCommand: string | undefined) {
    this.twigInfo = phpBinConsoleCommand
      ? await getSectionsFromPhpDebugTwig(phpBinConsoleCommand)
      : undefined;

    if (this.twigInfo) {
      console.info(
        'Twig info initialized. '
        + `Detected ${this.twigInfo.Functions.length} functions, `
        + `${this.twigInfo.Filters.length} filters and ${this.twigInfo.Globals.length} globals.`
      );
    } else {
      console.error('Twig info not initialized.');
    }
  }

  async onCompletion(params: CompletionParams) {
    const uri = params.textDocument.uri;
    const document = this.server.documentCache.get(uri);

    if (!document) {
      return;
    }

    const cursorNode = findNodeByPosition(document.tree.rootNode, params.position);

    if (!cursorNode) {
      return;
    }

    const completions: CompletionItem[] = [];

    [
      localVariables(document, cursorNode),
      forLoop(cursorNode),
      globalVariables(cursorNode, this.twigInfo?.Globals || []),
      functions(cursorNode, this.twigInfo?.Functions || []),
      filters(cursorNode, this.twigInfo?.Filters || []),
      await templatePaths(
        cursorNode,
        this.server.workspaceFolder.uri,
        this.templateMappings,
      ),
    ].forEach((result) => {
      if (result) {
        completions.push(...result);
      }
    });

    return completions;
  }
}
