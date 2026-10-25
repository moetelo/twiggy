import type { SignatureInformation } from 'vscode-languageserver';
import type { TwigEnvironment, TwigFunctionLike } from '../twigEnvironment';

function mapToSignatureInformation(item: TwigFunctionLike): SignatureInformation {
    const paramsStr = item.arguments
        .map(({ identifier, defaultValue }) =>
            defaultValue ? `${identifier} = ${defaultValue}` : identifier,
        )
        .join(', ');

    return {
        label: `${item.identifier}(${paramsStr})`,
        parameters: item.arguments.map(arg => ({
            label: arg.identifier,
        })),
    };
}

export class SignatureIndex {
    readonly #index: Map<string, SignatureInformation>;

    constructor(twigEnvironment: TwigEnvironment | null) {
        this.#index = new Map<string, SignatureInformation>();

        if (!twigEnvironment) return;

        for (const fun of twigEnvironment.Functions) {
            this.#index.set(fun.identifier, mapToSignatureInformation(fun));
        }

        for (const fun of twigEnvironment.Filters) {
            this.#index.set(fun.identifier, mapToSignatureInformation(fun));
        }
    }

    get(func: string): SignatureInformation | undefined {
        return this.#index.get(func);
    }
}
