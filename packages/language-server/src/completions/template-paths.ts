import type { CompletionItem, Position, Range } from 'vscode-languageserver';
import { CompletionItemKind } from 'vscode-languageserver';
import path from 'node:path';
import type { SyntaxNode } from 'web-tree-sitter';
import { templateUsingFunctions, templateUsingStatements } from '../constants/template-usage';
import { getTwigFiles } from '../utils/getTwigFiles';
import type { TemplatePathMapping } from '../twigEnvironment/types';
import { getStringNodeValue } from 'utils/node';

function isTemplatePathString(node: SyntaxNode, cursorNode: SyntaxNode): boolean {
    // {% import "forms.html" as forms %}
    // {% from "macros.twig" import hello %}
    // {% include 'template.html' %}
    // {% extends 'template.html' %}
    // {% use 'template.html' %}
    if (templateUsingStatements.includes(node.type)) return true;

    if (node.type !== 'arguments') return false;

    const functionName = node.parent?.childForFieldName('name')?.text;

    // {{ include('template.html') }}
    // {{ source('template.html') }}
    if (templateUsingFunctions.includes(functionName ?? '')) return true;

    // {{ block("title", "common_blocks.twig") }}
    const secondArgument = node.namedChildren.at(1);
    return (
        functionName === 'block' &&
        secondArgument !== undefined &&
        cursorNode.equals(secondArgument)
    );
}

export async function templatePaths(
    cursorNode: SyntaxNode,
    position: Position,
    workspaceFolderDirectory: string,
    templateMappings: TemplatePathMapping[],
): Promise<CompletionItem[]> {
    if (cursorNode.type !== 'string') {
        return [];
    }

    let node = cursorNode.parent;

    if (!node) {
        return [];
    }

    // This case for array wrappers
    // ['template.html']
    // TODO: ternary wrappers (`ajax ? 'ajax.html' : 'not_ajax.html'`) were meant to be handled
    // here too, but compared against `ternary`, which is not a node type (`ternary_expression` is).
    if (node.type === 'array') {
        node = node.parent;
    }

    if (!node) {
        return [];
    }

    if (isTemplatePathString(node, cursorNode)) {
        const completions: CompletionItem[] = [];

        const nodeStringStart = cursorNode.startPosition.column + 1;
        const nodeStringEnd = cursorNode.endPosition.column - 1;
        const range: Range = {
            start: { line: position.line, character: nodeStringStart },
            end: { line: position.line, character: nodeStringEnd },
        };

        const searchText = getStringNodeValue(cursorNode).slice(
            0,
            Math.max(0, position.character - nodeStringStart),
        );

        for (const { namespace, directory } of templateMappings) {
            const templatesDirectory = path.resolve(workspaceFolderDirectory, directory);

            for (const twigPath of await getTwigFiles(directory)) {
                const relativePathToTwigFromTemplatesDirectory = path.posix.relative(
                    templatesDirectory,
                    twigPath,
                );
                const includePath = path.posix.join(
                    namespace,
                    relativePathToTwigFromTemplatesDirectory,
                );

                if (searchText === '' || includePath.startsWith(searchText)) {
                    completions.push({
                        label: includePath,
                        kind: CompletionItemKind.File,
                        textEdit: {
                            range,
                            newText: includePath,
                        },
                    });
                }
            }
        }

        return completions;
    }

    return [];
}
