export type FunctionArgument = {
    identifier: string,
    defaultValue?: string,
};

export type TwigFunctionLike = {
    identifier: string,
    arguments: FunctionArgument[],
};

export type TwigVariable = {
    identifier: string,
    value: string,
};

export type TemplateNamespace = `@${string}` | '';

export type TemplatePathMapping = {
    directory: string;
    namespace: TemplateNamespace;
};

export type TwigEnvironment = {
    Filters: TwigFunctionLike[],
    Functions: TwigFunctionLike[],
    Globals: TwigVariable[],
    LoaderPaths: TemplatePathMapping[],
    Tests: string[],
};
