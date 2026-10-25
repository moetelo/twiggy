type FunctionArgument = {
    identifier: string;
    defaultValue?: string;
};

export type TwigFunctionLike = {
    identifier: string;
    arguments: FunctionArgument[];
};

/** JSON value of a Twig global: a scalar, or an object for non-scalars. */
export type TwigGlobalValue = string | number | boolean | object;

export type TwigVariable = {
    identifier: string;
    value: TwigGlobalValue;
};

export type TemplateNamespace = `@${string}` | '';

export type TemplatePathMapping = {
    directory: string;
    namespace: TemplateNamespace;
};

export type TwigEnvironment = {
    Filters: TwigFunctionLike[];
    Functions: TwigFunctionLike[];
    Globals: TwigVariable[];
    LoaderPaths: TemplatePathMapping[];
    Tests: string[];
};

export type RouteNameToPathRecord = Record<string, { path: string }>;
