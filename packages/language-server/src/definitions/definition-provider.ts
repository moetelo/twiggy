import { Connection, Definition, DefinitionLink, DefinitionParams, Range } from 'vscode-languageserver';
import { Server } from '../server';
import { findNodeByPosition } from '../utils/find-element-by-position';
import { SyntaxNode, Tree } from 'web-tree-sitter';
import { templateUsingFunctions, templateUsingStatements } from '../constants/template-usage';
import { Document } from '../document-cache';
import { PreOrderCursorIterator } from '../utils/pre-order-cursor-iterator';
import { getStringNodeValue, getNodeRange } from '../utils/node';
import { collectLocals } from '../symbols/locals';

export type onDefinitionHandlerReturn = ReturnType<
  Parameters<Connection['onDefinition']>[0]
>;

const isFunctionCall = (node: SyntaxNode | null, functionName: string): boolean => {
  return !!node
    && node.type === 'call_expression'
    && node.childForFieldName('name')?.text === functionName;
};


const isPathInsideTemplateEmbedding = (node: SyntaxNode): boolean => {
  if (node.type !== 'string' || !node.parent) {
    return false;
  }

  const isInsideStatement = templateUsingStatements.includes(node.parent.type);

  if (isInsideStatement) {
    return true;
  }

  const isInsideFunctionCall = node.parent?.type === 'arguments'
    && templateUsingFunctions.some(func => isFunctionCall(node.parent!.parent, func));

  return isInsideFunctionCall;
};

const isIdentifierOf = (type: 'block' | 'macro', node: SyntaxNode): boolean => {
  if (!node.parent || node.parent.type !== type) {
    return false;
  }

  return node.type === 'identifier';
};

export class DefinitionProvider {
  server: Server;

  templatesDirectory!: string;

  constructor(server: Server) {
    this.server = server;

    this.server.connection.onDefinition(this.onDefinition.bind(this));
  }

  async onDefinition(params: DefinitionParams): Promise<Definition | undefined> {
    const uri = params.textDocument.uri;
    const document = this.server.documentCache.getDocument(uri);

    if (!document) {
      return;
    }

    const cst = await document.cst();
    const cursorNode = findNodeByPosition(cst.rootNode, params.position);

    if (!cursorNode) {
      return;
    }

    if (isPathInsideTemplateEmbedding(cursorNode)) {
      const templatePath = this.resolveTemplatePath(
        getStringNodeValue(cursorNode),
      );

      return this.resolveTemplateDefinition(templatePath);
    }

    if (isIdentifierOf('block', cursorNode)) {
      const blockName = cursorNode.text;

      let extendedTwigDocument: Document | undefined = await this.getExtendedTemplate(document);
      while (extendedTwigDocument) {
        const symbol = await extendedTwigDocument.getSymbolByName(blockName, 'block');
        if (!symbol) {
          extendedTwigDocument = await this.getExtendedTemplate(extendedTwigDocument);
          continue;
        }

        return {
          uri: extendedTwigDocument.uri,
          range: symbol.nameRange,
        };
      }
    }
  }

  resolveTemplatePath(filePath: string): string {
    return `${this.server.workspaceFolder.uri}/${this.templatesDirectory}/${filePath}`;
  }

  private async getExtendedTemplate(document: Document) {
    const tree = await document.cst();
    const extendsNode = tree.rootNode.children.find(node => node.type === 'extends')?.childForFieldName('expr');

    if (!extendsNode) {
      return undefined;
    }

    const templatePath = this.resolveTemplatePath(
      getStringNodeValue(extendsNode),
    );

    return this.server.documentCache.getDocument(templatePath);
  }

  resolveTemplateDefinition(templatePath: string): Definition | undefined {
    const document = this.server.documentCache.getDocument(templatePath);

    if (!document) {
      return;
    }

    return {
      uri: document.uri,
      range: Range.create(0, 0, 0, 0),
    }
  }
}
