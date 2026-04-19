import {
    Connection,
    DidChangeConfigurationNotification,
    DidChangeConfigurationParams,
    WorkspaceFolder,
} from 'vscode-languageserver';
import { LanguageServerSettings, PhpFramework, PhpFrameworkOption, TemplatePathConfig } from './LanguageServerSettings';
import { InlayHintProvider } from '../inlayHints/InlayHintProvider';
import { DocumentCache } from '../documents';
import { BracketSpacesInsertionProvider } from '../autoInsertions/BracketSpacesInsertionProvider';
import { CompletionProvider } from '../completions/CompletionProvider';
import { SignatureHelpProvider } from '../signature-helps/SignatureHelpProvider';
import { DefinitionProvider } from '../definitions';
import { documentUriToFsPath } from '../utils/uri';
import { PhpExecutor } from '../phpInterop/PhpExecutor';
import {
    IFrameworkTwigEnvironment,
    SymfonyTwigEnvironment,
    CraftTwigEnvironment,
    VanillaTwigEnvironment,
    EmptyEnvironment,
} from '../twigEnvironment';
import { TypeResolver } from '../typing/TypeResolver';
import { isFile } from '../utils/files/fileStat';
import { readFile } from 'fs/promises';
import { DiagnosticProvider } from 'diagnostics';
import { FormattingProvider } from 'formatting/FormattingProvider';
import { TwigCodeStyleFixer } from 'phpInterop/TwigCodeStyleFixer';
import { TemplatePathMapping, TemplateNamespace } from '../twigEnvironment/types';
import * as path from 'path';

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
        connection.client.register(DidChangeConfigurationNotification.type, { section: this.configurationSection });
        connection.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this));
    }

    async onDidChangeConfiguration({ settings }: DidChangeConfigurationParams) {
        const config: LanguageServerSettings = settings?.[this.configurationSection] || this.defaultSettings;

        this.inlayHintProvider.settings = config.inlayHints ?? InlayHintProvider.defaultSettings;
        this.bracketSpacesInsertionProvider.isEnabled = config.autoInsertSpaces ?? true;

        // Convert user-configured template paths
        const additionalMappings = this.#convertTemplatePathConfig(config.templatePaths);

        this.applySettings(EmptyEnvironment, null, null, undefined, additionalMappings);

        if (config.framework === PhpFrameworkOption.Ignore) {
            return;
        }

        const workspaceDirectory = documentUriToFsPath(this.workspaceFolder.uri);
        if (!config.framework) {
            config.framework = await this.#tryGuessFramework(workspaceDirectory);

            if (!config.framework) {
                console.warn('`twiggy.framework` is required.');
                return;
            }

            console.info('Guessed `twiggy.framework`: ', config.framework);
        }

        // Use composerRoot directly if configured
        const composerRoot = config.composerRoot?.trim() || undefined;
        if (composerRoot) {
            console.info('Using composer root:', composerRoot);
        }

        const phpExecutor = new PhpExecutor(config.phpExecutable, workspaceDirectory);
        const twigCodeStyleFixer = config.diagnostics.twigCsFixer
            ? new TwigCodeStyleFixer(phpExecutor, workspaceDirectory)
            : null;

        // Resolve console path relative to composerRoot if set
        const effectiveConsolePath = composerRoot
            ? path.join(composerRoot, config.symfonyConsolePath)
            : config.symfonyConsolePath;

        const twigEnvironment = this.#resolveTwigEnvironment(config.framework, phpExecutor);
        await twigEnvironment.refresh({
            symfonyConsolePath: effectiveConsolePath,
            vanillaTwigEnvironmentPath: config.vanillaTwigEnvironmentPath,
            workspaceDirectory,
        });

        if (null === twigEnvironment.environment) {
            console.warn('Failed to load Twig environment.')
        } else {
            console.info('Successfully loaded Twig environment.')
            console.debug(twigEnvironment.environment)
        }

        this.applySettings(twigEnvironment, phpExecutor, twigCodeStyleFixer, composerRoot, additionalMappings);
    }

    #resolveTwigEnvironment(framework: PhpFramework, phpExecutor: PhpExecutor) {
        switch (framework) {
            case PhpFrameworkOption.Symfony:
                return new SymfonyTwigEnvironment(phpExecutor);
            case PhpFrameworkOption.Craft:
                return new CraftTwigEnvironment(phpExecutor);
            case PhpFrameworkOption.Twig:
                return new VanillaTwigEnvironment(phpExecutor);
        }
    }

    async #tryGuessFramework(workspaceDirectory: string): Promise<PhpFramework | undefined> {
        const composerJsonPath = `${workspaceDirectory}/composer.json`;
        if (!await isFile(composerJsonPath)) {
            return undefined;
        }

        const composerJson = await readFile(composerJsonPath, 'utf-8').then(JSON.parse);
        if (composerJson.require['symfony/twig-bundle']) {
            return PhpFrameworkOption.Symfony;
        }
        if (composerJson.require['craftcms/cms']) {
            return PhpFrameworkOption.Craft;
        }
    }

    private applySettings(
        frameworkEnvironment: IFrameworkTwigEnvironment,
        phpExecutor: PhpExecutor | null,
        twigCodeStyleFixer: TwigCodeStyleFixer | null,
        composerRoot?: string,
        additionalMappings?: TemplatePathMapping[],
    ) {
        const typeResolver = phpExecutor ? new TypeResolver(phpExecutor) : null;

        this.definitionProvider.phpExecutor = phpExecutor;
        this.completionProvider.refresh(frameworkEnvironment, phpExecutor, typeResolver, composerRoot, additionalMappings);
        this.signatureHelpProvider.reindex(frameworkEnvironment);
        this.documentCache.configure(frameworkEnvironment, typeResolver, composerRoot, additionalMappings);

        this.diagnosticProvider.refresh(twigCodeStyleFixer);
        this.formattingProvider.refresh(twigCodeStyleFixer);
    }

    /**
     * Converts user-configured template paths to internal TemplatePathMapping format.
     */
    #convertTemplatePathConfig(configs?: TemplatePathConfig[]): TemplatePathMapping[] {
        if (!configs || configs.length === 0) {
            return [];
        }

        return configs.map(({ namespace, path }) => ({
            namespace: (namespace.startsWith('@') || namespace === '' ? namespace : `@${namespace}`) as TemplateNamespace,
            directory: path,
        }));
    }
}
