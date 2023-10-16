## v0.5.9 (2023-10-17)
* Add annotations for `{% endblock %}` and `{% endmacro %}` (configurable via extension settings).
* Add documentation for completions resolved via `twiggy.phpBinConsoleCommand`.
* Fix named argument highlighting.
* Fix completion in `{% if | %}`.
* Fix inlay hints for macros after the one that was not found.

## v0.5.8 (2023-10-16)
* Snippets.
* Keyword completion.

## v0.5.7 (2023-10-16)
* Fix extension error on `{% import _self as alias %}`.

## v0.5.6 (2023-10-13)
* Add indentation rules.

## v0.5.5 (2023-10-11)

* Support Go to Definition for `block('blockname')`.

## v0.5.4 (2023-10-11)

* Show inlay hints for macro calls.

## v0.5.3 (2023-10-10)

* Provide completion, definition and signature help for macroses.
* Insert spaces inside of `{{ | }}` and `{% | %}`.
* Add hardcoded fallback for default templates directory.
* Better completion for filters.

## v0.5.1 (2023-10-09)

* Local variable definitions.
* Completion for scoped variables and macro arguments.
* Definition and completion for namespaced templates, e.g. `include('@pages/page.html.twig')`.

## v0.5.0 (2023-09-27)

* Implement `SymbolProvider` for Twig locals.
* Support Go to Definition for `include`, `import` etc
* Resolve Twig filters, functions, globals via `debug:twig` command.

## v0.4.0 (2023-09-11)

#### :rocket: Enhancement
* `vscode`
  * [#20](https://github.com/kaermorchen/twig-language-server/pull/20) Simplify, refine tmLanguage.json ([@IHIutch](https://github.com/IHIutch))

#### Committers: 1
- Jonathan Hutchison ([@IHIutch](https://github.com/IHIutch))

## v0.3.0 (2023-08-25)

## v0.2.3 (2023-08-16)

#### :bug: Bug Fix
* `vscode`
  * [#17](https://github.com/kaermorchen/twig-language-server/pull/17) Fix extension build ([@kaermorchen](https://github.com/kaermorchen))

#### Committers: 1
- Stanislav Romanov ([@kaermorchen](https://github.com/kaermorchen))

## v0.2.2 (2023-07-31)

#### :memo: Documentation
* `vscode`
  * [#15](https://github.com/kaermorchen/twig-language-server/pull/15) Update README.md ([@kaermorchen](https://github.com/kaermorchen))

#### Committers: 1
- Stanislav Romanov ([@kaermorchen](https://github.com/kaermorchen))

## v0.2.1 (2023-07-31)

## v0.2.0 (2023-07-31)

#### :rocket: Enhancement
* `language-server`, `vscode`
  * [#13](https://github.com/kaermorchen/twig-language-server/pull/13) Added deploy the extension on publish event ([@kaermorchen](https://github.com/kaermorchen))
* `vscode`
  * [#12](https://github.com/kaermorchen/twig-language-server/pull/12) Add language-server as dependency ([@kaermorchen](https://github.com/kaermorchen))

#### Committers: 1
- Stanislav Romanov ([@kaermorchen](https://github.com/kaermorchen))

## v0.1.0 (2023-07-30)

#### :rocket: Enhancement
* Other
  * [#11](https://github.com/kaermorchen/twig-language-server/pull/11) Added release-it ([@kaermorchen](https://github.com/kaermorchen))
* `language-server`, `vscode`
  * [#10](https://github.com/kaermorchen/twig-language-server/pull/10) Added readme, license and package settings ([@kaermorchen](https://github.com/kaermorchen))
  * [#7](https://github.com/kaermorchen/twig-language-server/pull/7) Semantic highlight ([@kaermorchen](https://github.com/kaermorchen))
  * [#2](https://github.com/kaermorchen/twig-language-server/pull/2) Convert to NPM packages ([@kaermorchen](https://github.com/kaermorchen))
* `language-server`
  * [#9](https://github.com/kaermorchen/twig-language-server/pull/9) Added `for` `loop` hover ([@kaermorchen](https://github.com/kaermorchen))
  * [#8](https://github.com/kaermorchen/twig-language-server/pull/8) Add completions for `for` loop ([@kaermorchen](https://github.com/kaermorchen))
  * [#6](https://github.com/kaermorchen/twig-language-server/pull/6) Signature helps ([@kaermorchen](https://github.com/kaermorchen))
  * [#5](https://github.com/kaermorchen/twig-language-server/pull/5) Add local variables completion ([@kaermorchen](https://github.com/kaermorchen))
  * [#4](https://github.com/kaermorchen/twig-language-server/pull/4) Template name completions ([@kaermorchen](https://github.com/kaermorchen))

#### :memo: Documentation
* `language-server`, `vscode`
  * [#10](https://github.com/kaermorchen/twig-language-server/pull/10) Added readme, license and package settings ([@kaermorchen](https://github.com/kaermorchen))

#### Committers: 1
- Stanislav Romanov ([@kaermorchen](https://github.com/kaermorchen))

