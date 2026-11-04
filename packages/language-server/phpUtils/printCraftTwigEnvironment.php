<?php
declare(strict_types=1);

namespace Twiggy;

define('YII_ENABLE_ERROR_HANDLER', false);
define('YII_ENABLE_EXCEPTION_HANDLER', false);

require_once __DIR__ . DIRECTORY_SEPARATOR . 'getTwigMetadata.php';

[, $WORKSPACE_DIR] = $argv;

// Check if the working dir has a Craft installation
if (!file_exists($WORKSPACE_DIR . DIRECTORY_SEPARATOR . 'craft')) {
    // Try to find a Craft installation in subfolders
    foreach (glob($WORKSPACE_DIR . "/*/craft") as $craftFile) {
        $workspaceCandidate = dirname($craftFile);
        // Make sure it has a bootstrap file to verify it is a Craft installation
        if(file_exists($workspaceCandidate . DIRECTORY_SEPARATOR . 'bootstrap.php')) {
            $WORKSPACE_DIR = $workspaceCandidate;
            break;
        }
    }
}

$VENDOR_PATH = $WORKSPACE_DIR . DIRECTORY_SEPARATOR . 'vendor';

require_once $WORKSPACE_DIR . '/bootstrap.php';

/** @var \craft\web\Application $app */
$app = require $VENDOR_PATH . '/craftcms/cms/bootstrap/web.php';

$view = $app->getView();
$twig = $view->getTwig();

// Add Craft's template path to Twig's loader paths
$templateRoots = ['' => [$templatesPath ?? 'templates']];
$templateRoots = array_merge($templateRoots, $view->getSiteTemplateRoots());

// The language server resolves loader paths against the workspace folder,
// which is not the Craft root when Craft lives in a subfolder.
$toAbsolutePath = function (string $path) use ($WORKSPACE_DIR): string {
    $absolutePath = \Twiggy\Metadata\isAbsolutePath($path)
        ? $path
        : $WORKSPACE_DIR . DIRECTORY_SEPARATOR . $path;

    // realpath() is false for missing dirs; keep the unresolved path then.
    return realpath($absolutePath) ?: $absolutePath;
};
$templateRoots = array_map(
    fn (string|array $paths) => array_map($toAbsolutePath, (array)$paths),
    $templateRoots,
);

$twigMetadata = \Twiggy\Metadata\getTwigMetadata($twig, 'craft');
$twigMetadata['loader_paths'] = $templateRoots;

echo json_encode($twigMetadata, JSON_PRETTY_PRINT) . PHP_EOL;
