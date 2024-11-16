export type InlayHintSettings = {
    macro: boolean,
    macroArguments: boolean,
    block: boolean,
};

export const enum PhpFramework {
    Ignore = 'ignore',
    Twig = 'twig',
    Symfony = 'symfony',
    Craft = 'craft',
}

export type LanguageServerSettings = {
    autoInsertSpaces: boolean,
    inlayHints: InlayHintSettings,

    framework?: PhpFramework,
    phpExecutable: string,
    symfonyConsolePath: string,
    vanillaTwigEnvironmentPath: string,
};
