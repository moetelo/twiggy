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

export type LanguageServerSettings = {
    autoInsertSpaces: boolean,
    inlayHints: InlayHintSettings,

    framework?: PhpFrameworkOption,
    phpExecutable: string,
    symfonyConsolePath: string,
    vanillaTwigEnvironmentPath: string,
    diagnostics: DiagnosticsSettings,
};
