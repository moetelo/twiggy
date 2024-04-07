import {
    TemplateNamespace,
    TemplatePathMapping,
    TwigEnvironment,
    TwigFunctionLike,
    TwigVariable,
} from '../../twigEnvironment/types';

export interface TwigDebugJsonOutput {
    functions: Record<string, string[]>;
    filters: Record<string, string[]>;
    globals: Record<string, any>;
    loader_paths: Record<string, string[]>;
    tests: string[];
}

const toFunctionLike = ([identifier, args]: [string, string[] | null]): TwigFunctionLike => ({
    identifier,
    arguments: (args || []).map((arg) => {
        const [identifier, defaultValue] = arg.trim().split('=');
        return {
            identifier,
            defaultValue,
        };
    }),
});

const toTwigVariable = ([identifier, value]: [string, any]): TwigVariable => ({
    identifier,
    value,
});

const toTemplateMappings = ([namespaceRaw, directories]: [string, string[]]): TemplatePathMapping[] => {
    const namespace: TemplateNamespace = namespaceRaw === '(None)'
        ? ''
        : namespaceRaw as TemplateNamespace;

    return directories.map((directory) => ({
        namespace,
        directory,
    }));
};

export const parseDebugTwigOutput = (output: TwigDebugJsonOutput): TwigEnvironment => ({
    Filters: Object.entries(output.filters).map(toFunctionLike),
    Functions: Object.entries(output.functions).map(toFunctionLike),
    Globals: Object.entries(output.globals).map(toTwigVariable),
    LoaderPaths: Object.entries(output.loader_paths).flatMap(toTemplateMappings),
    Tests: output.tests,
});
