export type InlayHintSettings = {
    macro: boolean,
    macroArguments: boolean,
    block: boolean,
};

export type LanguageServerSettings = {
    autoInsertSpaces: boolean,
    inlayHints: InlayHintSettings,

    /**
     * @deprecated
     * Used only for warning.
     * */
    phpBinConsoleCommand?: string,
    phpExecutable: string,
    symfonyConsolePath: string,
};
