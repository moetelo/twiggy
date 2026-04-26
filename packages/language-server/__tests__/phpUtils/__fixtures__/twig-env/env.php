<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

$loader = new \Twig\Loader\FilesystemLoader();
$loader->addPath(__DIR__ . '/templates');
$loader->addPath(__DIR__ . '/templates', 'shared');

$twig = new \Twig\Environment($loader, [
    'cache' => false,
    'debug' => false,
]);

$twig->addFunction(new \Twig\TwigFunction('say_hello', function (string $name = 'world'): string {
    return "hello {$name}";
}));

$twig->addFilter(new \Twig\TwigFilter('shout', function (string $value): string {
    return strtoupper($value);
}));

$twig->addGlobal('app_name', 'twiggy-test');

return $twig;
