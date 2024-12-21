## 0.17.0 (2024-12-21)
* Add twig-cs-fixer. #4
* Guess `twiggy.framework` using `composer.json`. #56
- feat: template diagnostic and defintion for block template argument \
also fixes incorrect reference from defintion of block with template argument
- feat(lsp): correctly format namespaces and support chained loaders
- fix: completions and ranges \
this fixes unstable completions and allows to correctly insert \
completion inside of string node
- fix(build): use relative path for wasm module \
this fixes build on win32
- fix: update tree-sitter-twig from nan to napi \
this also (partially) fixes clean builds
- fix: use custom request instead of workspace/executeCommand
this fixes thrown exception when custom command in used
since lsp registers only static name and extension calls dynamic one
- fix: ctrl+space in block('|')
- fix: ctrl+space in empty file
- refactor: add additional logging

Thanks to @Zekfad for the contribution.


## 0.17.0 (2024-11-16)
* Twig without frameworks. #52

## 0.16.2 (2024-11-16)
* Support apply tag with `call_expression`. #51
* Support for custom syntax '???'. #39
* Fix object property key token type. #46

## 0.16.1 (2024-10-25)
* Increase maxBuffer to 5MB. #44

## 0.16.0 (2024-10-14)
* Add a bit of info for the neovimmers. #13
* Fix unused variable warnings related to `set` variables. #37
* grammar: colon `:` as a named argument separator. #41
* grammar: negative index as a first argument of a slice. #45

## 0.15.0 (2024-09-24)
* Fix hints for imported macroses. #38

## 0.14.0 (2024-08-13)
* `@var` type hint for arrays `[]`: grammar, array item type inference. #29
* Fix `TreeNotParsedError` at the moment of `textDocument/documentSymbol`.

## 0.13.3 (2024-08-08)
* Add `<` to `completionProvider.triggerCharacters`.

## v0.13.2 (2024-07-24)
* Fix documentation for HTML tags (#33).
* Exclude the current variable from the completion list.
* Fix duplicate macros in the completion.

## v0.13.1 (2024-07-24)
* Fix `Document text is not set.` at the moment of `workspace/executeCommand` and `textDocument/documentSymbol` (#34).

## v0.13.0 (2024-07-19)
* Completion for properties and method return types.
* Fix `reflectType.php` for `\ReflectionUnionType` and `\ReflectionIntersectionType`. (#31)
* Fix extension erroring on empty twig file.

## v0.12.0 (2024-06-04)
* Add fallback to `resolveByTwigPath` to handle missing templates (#26, #27 @webrgp)

## v0.11.2 (2024-06-03)
* Fix unused variable diagnostics for implicitly defined variables.

## v0.11.1 (2024-05-29)
* Collect variable usage in other types of expressions.
* Completion for `is_route`

## v0.11.0 (2024-05-24)
* Variable references.
* Unused variable diagnostics.
* Rename variable.

## v0.10.2 (2024-05-24)
* Fix completions not showing for top-level imports.
* Fix yellow file when `{% if %}` has no condition (mark only the `{% if %}` part as invalid).

## v0.10.1 (2024-05-22)
* Completion/definition/hover for imported twig files.

## v0.10.0 (2024-05-22)
* Fix syntax error for `is same as` and `is divisible by` tests (#18).
* Language server features for macro imports inside of macro (#17).

## v0.9.2 (2024-05-01)
* set blocks: completion and definition (#22)

## v0.9.1 (2024-04-27)
* Fix brackets coloring in `<a href="{{ path('somepath') }}">`.

## v0.9.0 (2024-04-27)
* `@var` comment: grammar, semantic tokens, completion, definition. (#16)
    Completion for properties and methods of type-hinted var.
* Fix syntax highlighting for macroses. #20
* Add snippets `set block`, `if else`, `block with body`. #21
* Use more specific `onLanguage:twig` activation event.
    This fixes Twiggy starting in non-twig projects.
* Update dependencies. Remove `glob` dependency.

## v0.8.0 (2024-04-08)
* Provide Twig environment for Craft. \
    https://github.com/moetelo/twiggy/issues/10 \
    Thanks to @marcusgaius for suggestions and testing.
* Provide signature information for Twig environment functions (e.g. functions/filters collected from Symfony console).
* Provide default settings and mappings.
* Remove `twiggy.phpBinConsoleCommand` in favor of `twiggy.phpExecutable` and `twiggy.symfonyConsolePath`.
* Add a VS Code message to explain what needs to be configured.

## v0.7.0 (2024-04-04)
* Complete routes from `bin/console debug:router` command.
* Better `colorizedBracketPairs`
* Use `method` token type in semantic tokenization.

## v0.6.9 (2024-03-21)
* Fix twig info discovery failing when XDebug errors to `stderr`.\
    https://github.com/moetelo/twiggy/issues/6

## v0.6.8 (2024-03-20)
* Remap console calls to connection console calls (@niksy)

## v0.6.3 (2024-01-29)
* Support Go to Definition for `embed` statement.

## v0.6.2 (2023-12-08)
* Add completion for macroses inside of other macroses.
* Add completion for variables defined inside of `if` block contents.

## v0.6.1 (2023-10-23)
* Fix `wordPattern` for `include` and `source`.
* Fix syntax highlighting for strings and dictionary literals.

## v0.6.0 (2023-10-22)
* Collect loader paths from `debug:twig` command.
* Better logging for `twigInfo`.
* Fix extension crashing on Win10.

## v0.5.10 (2023-10-19)
* Use unique command names for each workspace folder. (Issue #3)
* Default function args from `debug:twig` to an empty array. (Issue #3)
* Allow setting `twiggy.phpBinConsoleCommand` per workspace folder.

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
