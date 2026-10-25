<?php
declare(strict_types=1);

// Stands in for craftcms/cms/bootstrap/web.php: returns an "app" whose view
// exposes a Twig environment and the site template roots set in bootstrap.php.

/** @var array<string, string[]> $siteTemplateRoots */
$view = new class ($siteTemplateRoots ?? []) {
    private \Twig\Environment $twig;

    public function __construct(private array $roots) {
        $this->twig = new \Twig\Environment(new \Twig\Loader\ArrayLoader());
    }

    public function getTwig(): \Twig\Environment {
        return $this->twig;
    }

    public function getSiteTemplateRoots(): array {
        return $this->roots;
    }
};

return new class ($view) {
    public function __construct(private object $view) {}

    public function getView(): object {
        return $this->view;
    }
};
