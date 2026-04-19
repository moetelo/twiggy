import * as path from 'path';
import { existsSync } from 'fs';

/**
 * Normalizes a directory path for template resolution.
 *
 * Handles several edge cases:
 * 1. Leading slashes that make relative paths appear absolute (e.g., "/templates" → "templates")
 * 2. Absolute paths that should be converted to relative paths when possible
 * 3. Mixed path separators on Windows
 *
 * @param directory The directory path from the framework (e.g., Symfony's debug:twig output)
 * @param workspaceFolderPath The workspace folder path
 * @param frameworkRoot Optional framework root relative to workspace (e.g., "app" for "app/bin/console")
 * @returns Normalized directory path that can be resolved relative to workspace
 */
export function normalizeDirectoryPath(
    directory: string,
    workspaceFolderPath: string,
    frameworkRoot?: string,
): string {
    // Normalize path separators
    let normalized = directory.replace(/\\/g, '/');

    // Check if path starts with a slash but isn't a valid absolute path
    if (normalized.startsWith('/') && !path.isAbsolute(normalized)) {
        // Strip leading slash - it's meant to be relative
        normalized = normalized.slice(1);
    }

    // If path starts with slash and is absolute, check if it's within workspace
    if (path.isAbsolute(normalized)) {
        // If the absolute path exists, use it as-is
        if (existsSync(normalized)) {
            // Try to make it relative to workspace if it's within workspace
            if (normalized.startsWith(workspaceFolderPath)) {
                return path.relative(workspaceFolderPath, normalized);
            }
            // Otherwise return as-is (it's a valid external path)
            return normalized;
        }

        // Path doesn't exist as absolute, try stripping leading slash
        const withoutLeadingSlash = normalized.slice(1);
        const relativeToWorkspace = path.join(workspaceFolderPath, withoutLeadingSlash);
        if (existsSync(relativeToWorkspace)) {
            return withoutLeadingSlash;
        }

        // Try with framework root
        if (frameworkRoot) {
            const relativeToFramework = path.join(workspaceFolderPath, frameworkRoot, withoutLeadingSlash);
            if (existsSync(relativeToFramework)) {
                return path.join(frameworkRoot, withoutLeadingSlash);
            }
        }

        // Fall back to stripping leading slash
        return withoutLeadingSlash;
    }

    // For relative paths, prepend framework root if provided and path doesn't exist directly
    if (frameworkRoot && !existsSync(path.join(workspaceFolderPath, normalized))) {
        const withFrameworkRoot = path.join(frameworkRoot, normalized);
        if (existsSync(path.join(workspaceFolderPath, withFrameworkRoot))) {
            return withFrameworkRoot;
        }
    }

    return normalized;
}

/**
 * Resolves a Twig template path to an absolute filesystem path.
 *
 * @param twigPath The Twig template path (e.g., "partials/header.twig" or "@Bundle/template.twig")
 * @param namespace The namespace for this mapping (e.g., "" or "@Bundle")
 * @param directory The directory for this mapping (already normalized)
 * @param workspaceFolderPath The workspace folder path
 * @param frameworkRoot Optional framework root relative to workspace
 * @returns Absolute path to the template file
 */
export function resolveTemplatePath(
    twigPath: string,
    namespace: string,
    directory: string,
    workspaceFolderPath: string,
    frameworkRoot?: string,
): string {
    // Build the include path based on namespace
    const includePath = namespace === ''
        ? path.join(directory, twigPath)
        : twigPath.replace(namespace, directory);

    // If the include path is absolute and exists, use it
    if (path.isAbsolute(includePath) && existsSync(includePath)) {
        return includePath;
    }

    // Try resolving relative to workspace
    const resolvedPath = path.resolve(workspaceFolderPath, includePath);
    if (existsSync(resolvedPath) || !frameworkRoot) {
        return resolvedPath;
    }

    // Try resolving relative to framework root
    const resolvedWithFramework = path.resolve(workspaceFolderPath, frameworkRoot, includePath);
    return resolvedWithFramework;
}
