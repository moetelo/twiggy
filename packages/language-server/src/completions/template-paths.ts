import { CompletionItem, CompletionItemKind, DocumentUri } from 'vscode-languageserver';
import path from 'path';
import { SyntaxNode } from 'web-tree-sitter';
import {
    templateUsingFunctions,
    templateUsingStatements,
} from '../constants/template-usage';
import getTwigFiles from '../utils/getTwigFiles';
import { TemplatePathMapping } from '../utils/symfony/twigConfig';
import { documentUriToFsPath } from '../utils/uri';

export async function templatePaths(
    cursorNode: SyntaxNode,
    workspaceFolderUri: DocumentUri,
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
        const workspaceFolderDirectory = documentUriToFsPath(workspaceFolderUri);

        const completions: CompletionItem[] = [];

        for (const { namespace, directory } of templateMappings) {
            const templatesDirectory = path.resolve(workspaceFolderDirectory, directory);

            for (const twigPath of await getTwigFiles(directory)) {
                const relativePathToTwigFromTemplatesDirectory = path.relative(templatesDirectory, twigPath);
                const includePath = path.join(namespace, relativePathToTwigFromTemplatesDirectory);

                completions.push({
                    label: includePath,
                    kind: CompletionItemKind.File,
                });
            }
        }

        return completions;
    }

    return [];
}
