import { Diagnostic, DiagnosticSeverity, DocumentUri, Range } from 'vscode-languageserver';
import { IPhpExecutor } from './IPhpExecutor';
import { isFile } from 'utils/files/fileStat';
import path from 'node:path';
import { documentUriToFsPath, toDocumentUri } from 'utils/uri';

const severityToDiagnosticSeverity = {
    error: DiagnosticSeverity.Warning,
    notice: DiagnosticSeverity.Information,
    warning: DiagnosticSeverity.Warning,
};

const enum TwigCodeStyleAction {
    Lint = 'lint',
    Fix = 'fix',
}

export class TwigCodeStyleFixer {
    #executablePath: string;

    constructor(
        readonly _phpExecutor: IPhpExecutor | null,
        readonly _workspaceDirectory: string,
    ) {
        this.#executablePath = path.join(this._workspaceDirectory, 'vendor/bin/twig-cs-fixer');
    }

    async #call(action: TwigCodeStyleAction, uri: DocumentUri | '' = '') {
        if (!this._phpExecutor || !await isFile(this.#executablePath)) {
            return null;
        }

        const args = [action, '-r', 'github'];
        if (uri) {
            args.push(
                path.relative(this._workspaceDirectory, documentUriToFsPath(uri)),
            );
        }

        const lintResult = await this._phpExecutor.call(this.#executablePath, args);
        if (!lintResult?.stdout) {
            return null;
        }

        const uriToDiagnostics = new Map<DocumentUri, Diagnostic[]>();

        const reportLines = lintResult.stdout.split('\n');
        for (const reportLine of reportLines) {
            // ::error file=templates/template.html.twig,line=20,col=81::Expecting 0 whitespace after "|"; found 1.
            const match = reportLine.match(/::(error|notice|warning) file=(.*),line=(.*),col=(.*):(.*)/);
            if (!match) {
                continue;
            }

            const [severity, filePath, line, col, message] = match.slice(1) as [
                keyof typeof severityToDiagnosticSeverity,
                ...string[],
            ];

            const fullFilePath = path.join(this._workspaceDirectory, filePath);
            const uri = toDocumentUri(fullFilePath);

            if (!uriToDiagnostics.has(uri)) {
                uriToDiagnostics.set(uri, []);
            }

            const diagnostics = uriToDiagnostics.get(uri)!;
            diagnostics.push({
                message,
                severity: severityToDiagnosticSeverity[severity],
                range: Range.create(
                    parseInt(line) - 1, parseInt(col) - 1,
                    parseInt(line) - 1, parseInt(col),
                ),
            });
        }

        return uriToDiagnostics;
    }

    async lint(uri: DocumentUri) {
        const result = await this.#call(TwigCodeStyleAction.Lint, uri);
        return result?.get(uri)! || [];
    }

    async fix(uri: DocumentUri) {
        await this.#call(TwigCodeStyleAction.Fix, uri);
    }

    async lintWorkspace() {
        const result = await this.#call(TwigCodeStyleAction.Lint);
        if (!result) {
            return [];
        }

        return [...result.entries()].map(([uri, diagnostics]) => ({
            uri,
            diagnostics,
        }));
    }
}
