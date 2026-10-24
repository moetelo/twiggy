import type {
    TemplateNamespace,
    TemplatePathMapping,
    TwigEnvironment,
    TwigFunctionLike,
    TwigGlobalValue,
    TwigVariable,
} from '../types';

export interface SymfonyTwigDebugJsonOutput {
    functions: Record<string, string[]>;
    filters: Record<string, string[]>;
    globals: Record<string, TwigGlobalValue>;
    loader_paths: Record<string, string[]>;
    tests: string[];
}

const toFunctionLike = ([identifier, args]: [string, string[] | null]): TwigFunctionLike => ({
    identifier,
    arguments: (args ?? []).map((arg) => {
        const [argIdentifier, defaultValue] = arg.trim().split('=');
        return {
            identifier: argIdentifier,
            defaultValue,
        };
    }),
});

const toTwigVariable = ([identifier, value]: [string, TwigGlobalValue]): TwigVariable => ({
    identifier,
    value,
});

const isTemplateNamespace = (value: string): value is TemplateNamespace => value === '' || value.startsWith('@');

const toTemplateMappings = ([namespaceRaw, directories]: [string, string[]]): TemplatePathMapping[] => {
    // Symfony reports the main namespace as '(None)'.
    const namespace: TemplateNamespace = isTemplateNamespace(namespaceRaw)
        ? namespaceRaw
        : '';

    return directories.map((directory) => ({
        namespace,
        directory,
    }));
};

export const parseDebugTwigOutput = (output: SymfonyTwigDebugJsonOutput): TwigEnvironment => ({
    Filters: Object.entries(output.filters).map((entry) => toFunctionLike(entry)),
    Functions: Object.entries(output.functions).map((entry) => toFunctionLike(entry)),
    Globals: Object.entries(output.globals).map((entry) => toTwigVariable(entry)),
    LoaderPaths: Object.entries(output.loader_paths).flatMap((entry) => toTemplateMappings(entry)),
    Tests: output.tests,
});
