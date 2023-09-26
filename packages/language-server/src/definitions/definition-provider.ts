import { Connection, Definition, DefinitionParams, Range } from 'vscode-languageserver';
import { Server } from '../server';
import { findNodeByPosition } from '../utils/find-element-by-position';
import { SyntaxNode } from 'web-tree-sitter';
import { templateUsingFunctions, templateUsingStatements } from '../constants/template-usage';

export type onDefinitionHandlerReturn = ReturnType<
  Parameters<Connection['onDefinition']>[0]
>;

const isFunctionCall = (cursorNode: SyntaxNode | null, functionName: string): boolean => {
  return !!cursorNode
    && cursorNode.type === 'call_expression'
    && cursorNode.childForFieldName('name')?.text === functionName;
};


const isPathInsideTemplateEmbedding = (stringNode: SyntaxNode): boolean => {
  if (stringNode.type !== 'string' || !stringNode.parent) {
    return false;
  }

  const isInsideStatement = templateUsingStatements.includes(stringNode.parent.type);

  if (isInsideStatement) {
    return true;
  }

  const isInsideFunctionCall = stringNode.parent?.type === 'arguments'
    && templateUsingFunctions.some(func => isFunctionCall(stringNode.parent!.parent, func));

  return isInsideFunctionCall;
};

export class DefinitionProvider {
  private readonly defaultTemplatesDirectory = 'templates';
  private templatesDirectory = this.defaultTemplatesDirectory;

  server: Server;

  constructor(server: Server) {
    this.server = server;

    this.server.connection.onDefinition(this.onDefinition.bind(this));
  }

  setTemplatesDirectory(templatesDirectory: string | undefined) {
    this.templatesDirectory = templatesDirectory || this.defaultTemplatesDirectory;
  }

  async onDefinition(params: DefinitionParams): Promise<Definition | undefined> {
    const uri = params.textDocument.uri;
    const document = this.server.documentCache.getDocument(uri);

    if (!document) {
      return;
    }

    const cst = await document.cst();
    const cursorNode = findNodeByPosition(cst.rootNode, params.position);

    if (!cursorNode || !isPathInsideTemplateEmbedding(cursorNode)) {
      return;
    }

    const filePath = cursorNode.text.slice('"'.length, -'"'.length);
    const fullFilePath = `${this.server.workspaceFolder.uri}/${this.templatesDirectory}/${filePath}`;

    const file = this.server.documentCache.getDocument(fullFilePath);

    if (!file) {
      return;
    }

    return {
      uri: file.filePath,
      range: Range.create(0, 0, 0, 0),
    }
  }
}
