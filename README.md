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

> [!TIP]
> For better completion in Symfony or Craft CMS, configure `twiggy.framework` and follow the extension output (`Twiggy Language Server`).

## Inlay hints
![inlay hints](https://github.com/moetelo/twiggy/assets/17011936/ae833425-06e9-4c55-84d2-47b152bae51a)

# Setup
## VS Code
1. Open Command Palette (`Ctrl+P`), type `ext install moetelo.twiggy` and press `Enter`.
1. For Symfony project, set `twiggy.phpExecutable` and `twiggy.symfonyConsolePath` in the VS Code settings.
1. Check the extension output (`Twiggy Language Server`) for errors.

[Submit new issue](https://github.com/moetelo/twiggy/issues/new) if you have any problems or the feature you want is missing.


# Development
1. Install [pnpm](https://pnpm.io/installation).
1. `pnpm install` in the project dir.
1. Press F5 in VS Code to start debugging.

#### Monorepo
- [Twiggy Language Server](packages/language-server/)
- [VSCode Twig extension](packages/vscode/)
- [tree-sitter-twig](packages/tree-sitter-twig/)
