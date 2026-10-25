import type {
    Connection,
    DidChangeConfigurationParams,
    WorkspaceFolder,
} from 'vscode-languageserver';
import { DidChangeConfigurationNotification } from 'vscode-languageserver';
import type { LanguageServerSettings, PhpFramework } from './LanguageServerSettings';
import { PhpFrameworkOption } from './LanguageServerSettings';
import { InlayHintProvider } from '../inlayHints/InlayHintProvider';
import type { DocumentCache } from '../documents';
import type { BracketSpacesInsertionProvider } from '../autoInsertions/BracketSpacesInsertionProvider';
import type { CompletionProvider } from '../completions/CompletionProvider';
import type { SignatureHelpProvider } from '../signature-helps/SignatureHelpProvider';
import type { DefinitionProvider } from '../definitions';
import { documentUriToFsPath } from '../utils/uri';
import { PhpExecutor } from '../phpInterop/PhpExecutor';
import type { IFrameworkTwigEnvironment } from '../twigEnvironment';
import {
    SymfonyTwigEnvironment,
    CraftTwigEnvironment,
    VanillaTwigEnvironment,
    EmptyEnvironment,
} from '../twigEnvironment';
import { TypeResolver } from '../typing/TypeResolver';
import { isFile } from '../utils/files/fileStat';
import { readFile } from 'node:fs/promises';
import type { DiagnosticProvider } from 'diagnostics';
import type { FormattingProvider } from 'formatting/FormattingProvider';
import { TwigCodeStyleFixer } from 'phpInterop/TwigCodeStyleFixer';

/** Settings as the client sends them: fields with a server-side fallback may be missing. */
type ClientSettings = Omit<LanguageServerSettings, 'autoInsertSpaces' | 'inlayHints'> &
    Partial<Pick<LanguageServerSettings, 'autoInsertSpaces' | 'inlayHints'>>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isClientSettings(value: unknown): value is ClientSettings {
    return isRecord(value);
}

function readClientSettings(settings: unknown, section: string): ClientSettings | undefined {
    if (!isRecord(settings)) return undefined;

    const sectionSettings = settings[section];
    return isClientSettings(sectionSettings) ? sectionSettings : undefined;
}

function resolveTwigEnvironment(framework: PhpFramework, phpExecutor: PhpExecutor) {
    switch (framework) {
        case PhpFrameworkOption.Symfony:
            return new SymfonyTwigEnvironment(phpExecutor);

        case PhpFrameworkOption.Craft:
            return new CraftTwigEnvironment(phpExecutor);

        case PhpFrameworkOption.Twig:
            return new VanillaTwigEnvironment(phpExecutor);

        default:
            return null;
    }
}

async function tryGuessFramework(workspaceDirectory: string): Promise<PhpFramework | undefined> {
    const composerJsonPath = `${workspaceDirectory}/composer.json`;
    if (!(await isFile(composerJsonPath))) {
        return undefined;
    }

    const composerJson: unknown = JSON.parse(await readFile(composerJsonPath, 'utf8'));
    const dependencies = isRecord(composerJson) ? composerJson.require : undefined;
    if (!isRecord(dependencies)) {
        return undefined;
    }

    if ('symfony/twig-bundle' in dependencies) {
        return PhpFrameworkOption.Symfony;
    }
    if ('craftcms/cms' in dependencies) {
        return PhpFrameworkOption.Craft;
    }

    return undefined;
}

export class ConfigurationManager {
    readonly configurationSection = 'twiggy';

    readonly defaultSettings: LanguageServerSettings = {
        autoInsertSpaces: true,
        inlayHints: InlayHintProvider.defaultSettings,
        phpExecutable: 'php',
        symfonyConsolePath: './bin/console',
        vanillaTwigEnvironmentPath: '',
        framework: PhpFrameworkOption.Symfony,
        diagnostics: {
            twigCsFixer: true,
        },
    };

    constructor(
        connection: Connection,
        private readonly definitionProvider: DefinitionProvider,
        private readonly inlayHintProvider: InlayHintProvider,
        private readonly bracketSpacesInsertionProvider: BracketSpacesInsertionProvider,
        private readonly completionProvider: CompletionProvider,
        private readonly signatureHelpProvider: SignatureHelpProvider,
        private readonly documentCache: DocumentCache,
        private readonly workspaceFolder: WorkspaceFolder,
        private readonly diagnosticProvider: DiagnosticProvider,
        private readonly formattingProvider: FormattingProvider,
    ) {
        void connection.client.register(DidChangeConfigurationNotification.type, {
            section: this.configurationSection,
        });
        connection.onDidChangeConfiguration(params => {
            void this.onDidChangeConfiguration(params);
        });
    }

    async onDidChangeConfiguration({ settings }: DidChangeConfigurationParams) {
        const config: ClientSettings =
            readClientSettings(settings, this.configurationSection) ?? this.defaultSettings;

        this.inlayHintProvider.settings = config.inlayHints ?? InlayHintProvider.defaultSettings;
        this.bracketSpacesInsertionProvider.isEnabled = config.autoInsertSpaces ?? true;

        this.applySettings(EmptyEnvironment, null, null);

        if (config.framework === PhpFrameworkOption.Ignore) {
            return;
        }

        const workspaceDirectory = documentUriToFsPath(this.workspaceFolder.uri);
        if (config.framework === undefined) {
            config.framework = await tryGuessFramework(workspaceDirectory);

            if (config.framework === undefined) {
                console.warn('`twiggy.framework` is required.');
                return;
            }

            console.info('Guessed `twiggy.framework`:', config.framework);
        }

        const phpExecutor = new PhpExecutor(config.phpExecutable, workspaceDirectory);
        const twigCodeStyleFixer = config.diagnostics.twigCsFixer
            ? new TwigCodeStyleFixer(phpExecutor, workspaceDirectory)
            : null;

        const twigEnvironment = resolveTwigEnvironment(config.framework, phpExecutor);
        if (!twigEnvironment) {
            console.warn(`Unknown \`twiggy.framework\`: ${config.framework}`);
            return;
        }

        await twigEnvironment.refresh({
            symfonyConsolePath: config.symfonyConsolePath,
            vanillaTwigEnvironmentPath: config.vanillaTwigEnvironmentPath,
            workspaceDirectory,
        });

        if (twigEnvironment.environment === null) {
            console.warn('Failed to load Twig environment.');
        } else {
            console.info('Successfully loaded Twig environment.');
            console.debug(twigEnvironment.environment);
        }

        this.applySettings(twigEnvironment, phpExecutor, twigCodeStyleFixer);
    }

    private applySettings(
        frameworkEnvironment: IFrameworkTwigEnvironment,
        phpExecutor: PhpExecutor | null,
        twigCodeStyleFixer: TwigCodeStyleFixer | null,
    ) {
        const typeResolver = phpExecutor ? new TypeResolver(phpExecutor) : null;

        this.definitionProvider.phpExecutor = phpExecutor;
        this.completionProvider.refresh(frameworkEnvironment, phpExecutor, typeResolver);
        this.signatureHelpProvider.reindex(frameworkEnvironment);
        this.documentCache.configure(frameworkEnvironment, typeResolver);

        void this.diagnosticProvider.refresh(twigCodeStyleFixer);
        this.formattingProvider.refresh(twigCodeStyleFixer);
    }
}
