import { Connection, DocumentFormattingParams } from 'vscode-languageserver';
import { TwigCodeStyleFixer } from 'phpInterop/TwigCodeStyleFixer';
import { DiagnosticProvider } from 'diagnostics';

export class FormattingProvider {
    #twigCodeStyleFixer: TwigCodeStyleFixer | null = null;

    constructor(
        connection: Connection,
        private readonly diagnosticProvider: DiagnosticProvider,
    ) {
        connection.onDocumentFormatting(this.onDocumentFormatting.bind(this));
    }

    refresh(twigCodeStyleFixer: TwigCodeStyleFixer | null) {
        this.#twigCodeStyleFixer = twigCodeStyleFixer;
    }

    async onDocumentFormatting(params: DocumentFormattingParams) {
        if (!this.#twigCodeStyleFixer) {
            return null;
        }

        await this.#twigCodeStyleFixer.fix(params.textDocument.uri);
        await this.diagnosticProvider.lint(params.textDocument.uri);

        return null;
    }
}
