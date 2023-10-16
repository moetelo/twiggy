export type InlayHintSettings = {
    macro: boolean;
    macroArguments: boolean,
    block: boolean;
};

export type LanguageServerSettings = {
    autoInsertSpaces: boolean;
    phpBinConsoleCommand: string;
    inlayHints: InlayHintSettings,
};
