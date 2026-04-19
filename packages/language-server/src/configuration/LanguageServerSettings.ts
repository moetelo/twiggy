export type InlayHintSettings = {
    macro: boolean,
    macroArguments: boolean,
    block: boolean,
};

export const enum PhpFrameworkOption {
    Ignore = 'ignore',
    Twig = 'twig',
    Symfony = 'symfony',
    Craft = 'craft',
}

export type PhpFramework = PhpFrameworkOption.Twig | PhpFrameworkOption.Symfony | PhpFrameworkOption.Craft;

type DiagnosticsSettings = {
    twigCsFixer: boolean,
};

/**
 * Manual template path mapping configuration.
 * Allows users to register additional namespace → directory mappings.
 */
export type TemplatePathConfig = {
    /**
     * The namespace prefix (e.g., "@MyBundle" or "" for root namespace).
     * Use "" for templates without a namespace prefix.
     */
    namespace: string,
    /**
     * The directory path relative to the workspace folder.
     */
    path: string,
};

export type LanguageServerSettings = {
    autoInsertSpaces: boolean,
    inlayHints: InlayHintSettings,

    framework?: PhpFrameworkOption,
    phpExecutable: string,
    symfonyConsolePath: string,
    vanillaTwigEnvironmentPath: string,
    diagnostics: DiagnosticsSettings,

    /**
     * Root directory of the PHP/Composer project relative to the workspace.
     * Used when the Symfony/Craft application is in a subdirectory (e.g., monorepo setups).
     *
     * Example: If your composer.json is at `app/composer.json`, set this to `app`.
     *
     * When set, template paths and the Symfony console will be resolved relative to this directory.
     */
    composerRoot?: string,

    /**
     * Additional template path mappings to register manually.
     * Useful for bundle development or non-standard project structures.
     */
    templatePaths?: TemplatePathConfig[],
};
