export type InlayHintSettings = {
    macro: boolean;
    macroArguments: boolean;
    block: boolean;
};

export enum PhpFrameworkOption {
    Ignore = 'ignore',
    Twig = 'twig',
    Symfony = 'symfony',
    Craft = 'craft',
}

export type PhpFramework =
    | PhpFrameworkOption.Twig
    | PhpFrameworkOption.Symfony
    | PhpFrameworkOption.Craft;

type TemplatePathSetting = {
    /** `@MyBundle`, `MyBundle` (the `@` is added), or `''` for the root namespace. */
    namespace: string;
    /** Relative to the workspace folder, or absolute. */
    path: string;
};

type DiagnosticsSettings = {
    twigCsFixer: boolean;
};

export type LanguageServerSettings = {
    autoInsertSpaces: boolean;
    inlayHints: InlayHintSettings;

    framework?: PhpFrameworkOption;
    phpExecutable: string;
    symfonyConsolePath: string;
    vanillaTwigEnvironmentPath: string;
    diagnostics: DiagnosticsSettings;
    templatePaths?: TemplatePathSetting[];
};
