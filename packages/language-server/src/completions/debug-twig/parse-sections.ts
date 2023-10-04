import { TwigDebugInfo, TwigFunctionLike, TwigVariable } from './types';

export interface TwigDebugJsonOutput {
    functions: Record<string, string[]>;
    filters: Record<string, string[]>;
    globals: Record<string, any>;
    tests: string[];
}

const toFunctionLike = ([identifier, args]: [string, string[]]): TwigFunctionLike => ({
    identifier,
    arguments: args.map((arg) => {
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

export const parseSections = (stdout: string): TwigDebugInfo => {
    const output: TwigDebugJsonOutput = JSON.parse(stdout);

    const sections: TwigDebugInfo = {
        Filters: Object.entries(output.filters).map(toFunctionLike),
        Functions: Object.entries(output.functions).map(toFunctionLike),
        Globals: Object.entries(output.globals).map(toTwigVariable),
        Tests: output.tests,
    };

    return sections;
};
