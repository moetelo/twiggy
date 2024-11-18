import { CompletionItem, CompletionItemKind, Position } from 'vscode-languageserver';
import path from 'path';
import { SyntaxNode } from 'web-tree-sitter';
import {
    templateUsingFunctions,
    templateUsingStatements,
} from '../constants/template-usage';
import getTwigFiles from '../utils/getTwigFiles';
import { TemplatePathMapping } from '../twigEnvironment/types';
import { getStringNodeValue } from 'utils/node';

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

    // This case for array or ternary wrappers
    // ['template.html']
    // ajax ? 'ajax.html' : 'not_ajax.html'
    if (['array', 'ternary'].includes(node.type)) {
        node = node.parent;
    }

    if (!node) {
        return [];
    }

    if (
        // {% import "forms.html" as forms %}
        // {% from "macros.twig" import hello %}
        // {% include 'template.html' %}
        // {% extends 'template.html' %}
        // {% use 'template.html' %}
        templateUsingStatements.includes(node.type) ||
        // {{ include('template.html') }}
        // {{ source('template.html') }}
        (node.type === 'arguments' &&
            templateUsingFunctions.includes(
                node.parent?.childForFieldName('name')?.text || '',
            )) ||
        // {{ block("title", "common_blocks.twig") }}
        (node.type === 'arguments' &&
            node.parent?.childForFieldName('name')?.text === 'block' &&
            cursorNode?.equals(node.namedChildren[1]))
    ) {
        const completions: CompletionItem[] = [];

        const nodeStringStart = cursorNode.startPosition.column + 1;
        const nodeStringEnd = cursorNode.endPosition.column - 1;

        const searchText = getStringNodeValue(cursorNode)
            .substring(0, position.character - nodeStringStart);

        for (const { namespace, directory } of templateMappings) {
            const templatesDirectory = path.resolve(workspaceFolderDirectory, directory)

            for (const twigPath of await getTwigFiles(directory)) {
                const relativePathToTwigFromTemplatesDirectory = path.relative(templatesDirectory, twigPath)
                    // fix paths for win32
                    .replaceAll(path.sep, path.posix.sep);
                const includePath = path.posix.join(namespace, relativePathToTwigFromTemplatesDirectory)

                if (searchText === '' || includePath.startsWith(searchText)) {
                    completions.push({
                        label: includePath,
                        kind: CompletionItemKind.File,
                        // Send insertion range to extension
                        data: [ nodeStringStart, nodeStringEnd, ],
                    });
                }
            }
        }

        return completions;
    }

    return [];
}
