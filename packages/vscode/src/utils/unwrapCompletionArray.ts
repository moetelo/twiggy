import { CompletionItem, CompletionList, ProviderResult } from 'vscode';

export const unwrapCompletionArray = async (
    completionProviderResult: ProviderResult<CompletionItem[] | CompletionList>,
): Promise<CompletionItem[]> => {
    const completionResult = await Promise.resolve(completionProviderResult);

    if (!completionResult) {
        return [];
    }

    if (Array.isArray(completionResult)) {
        return completionResult;
    }

    if ('items' in completionResult) {
        return completionResult.items;
    }

    return [];
};
