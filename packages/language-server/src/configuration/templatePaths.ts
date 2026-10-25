import type { TemplateNamespace, TemplatePathMapping } from '../twigEnvironment/types';
import { isRecord } from '../utils/isRecord';

// `MyBundle` and `@MyBundle/` become `@MyBundle`; `''` stays the root namespace.
function normalizeNamespace(namespace: string): TemplateNamespace | null {
    const trimmed = namespace.trim();
    if (trimmed === '') return '';

    const name = trimmed.replace(/^@/u, '').replace(/\/+$/u, '');
    return name === '' ? null : `@${name}`;
}

function parseTemplatePath(entry: unknown): TemplatePathMapping | null {
    if (!isRecord(entry)) return null;

    const { namespace, path } = entry;
    if (typeof namespace !== 'string' || typeof path !== 'string' || path.trim() === '') {
        return null;
    }

    const normalizedNamespace = normalizeNamespace(namespace);
    return normalizedNamespace === null
        ? null
        : { namespace: normalizedNamespace, directory: path.trim() };
}

/**
 * Reads `twiggy.templatePaths` from untyped client JSON.
 * Malformed entries are skipped with a warning instead of rejecting the whole setting.
 * @param value The raw setting value.
 * @returns Mappings in the order given.
 */
export function parseTemplatePaths(value: unknown): TemplatePathMapping[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) {
        console.warn('`twiggy.templatePaths` must be an array, ignoring it.');
        return [];
    }

    return value.flatMap(entry => {
        const mapping = parseTemplatePath(entry);
        if (!mapping) {
            console.warn('Ignoring malformed `twiggy.templatePaths` entry:', entry);
            return [];
        }

        return [mapping];
    });
}
