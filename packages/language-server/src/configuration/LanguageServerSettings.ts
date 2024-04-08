export type InlayHintSettings = {
    macro: boolean,
    macroArguments: boolean,
    block: boolean,
};

export const enum PhpFramework {
    Ignore = 'ignore',
    Symfony = 'symfony',
    Craft = 'craft',
}

export type LanguageServerSettings = {
    autoInsertSpaces: boolean,
    inlayHints: InlayHintSettings,

    /**
     * @deprecated
     * Used only for warning.
     * */
    phpBinConsoleCommand?: string,

    framework?: PhpFramework,
    phpExecutable: string,
    symfonyConsolePath: string,
};
