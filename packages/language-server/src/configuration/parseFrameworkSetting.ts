import { PhpFrameworkOption } from './LanguageServerSettings';

const frameworkOptions: readonly string[] = Object.values(PhpFrameworkOption);

const isFrameworkOption = (value: unknown): value is PhpFrameworkOption =>
    typeof value === 'string' && frameworkOptions.includes(value);

/**
 * Reads `twiggy.framework` from untyped client JSON.
 * VS Code sends `""` for an unset enum setting, so anything but a known option means "guess".
 * @param value The raw setting value.
 * @returns The configured framework, or `undefined` when it should be guessed.
 */
export function parseFrameworkSetting(value: unknown): PhpFrameworkOption | undefined {
    if (isFrameworkOption(value)) return value;

    if (value !== undefined && value !== null && value !== '') {
        console.warn(
            `Unknown \`twiggy.framework\`: ${JSON.stringify(value)}. Guessing it instead.`,
        );
    }

    return undefined;
}
