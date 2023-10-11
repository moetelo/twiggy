<p>
  <h1 align="center">Twiggy</h1>
</p>

VSCode Marketplace: [Twiggy](https://marketplace.visualstudio.com/items?itemName=moetelo.twiggy)

This is a fork of [kaermorchen/twig-language-server (Modern Twig)](https://github.com/kaermorchen/twig-language-server).

## Definition
![Definition for variables](https://github.com/moetelo/twiggy/assets/17011936/e24c1d26-1606-4354-a5b4-9d28976c983b)
![Definition for templates and blocks](https://github.com/moetelo/twiggy/assets/17011936/d192a359-d2c1-471b-bd08-79c847cfeb9e)

## Completion
![Completion](https://github.com/moetelo/twiggy/assets/17011936/b5a7b411-b7c3-4411-b4bb-c3a244dc71f6)

> Note: completion for user-defined functions and filters works if you set `twiggy.phpBinConsoleCommand` setting in VS Code.

## Inlay hints
![inlay hints](https://github.com/moetelo/twiggy/assets/17011936/ae833425-06e9-4c55-84d2-47b152bae51a)

# Setup
1. In VS Code, open Command Palette (`Ctrl+P`), type `ext install moetelo.twiggy` and press `Enter`.
1. Set `twiggy.phpBinConsoleCommand` in your VS Code settings.
1. Check the extension output (`Twig Language Server`) for errors. If you've opened a Symfony project and everything is ok, you should see line `Twig info initialized`.

[File an issue](https://github.com/moetelo/twiggy/issues/new) if you have any problems or the feature you want is missing.


## Development
1. Install [pnpm](https://pnpm.io/installation).
1. `pnpm install` in the project dir.
1. Press F5 in VS Code to start debugging.

#### Monorepo
- [Twig Language Server](packages/language-server/)
- [VSCode Twig extension](packages/vscode/)
- [tree-sitter-twig](packages/tree-sitter-twig/)
