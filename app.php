<?php
// Serves the app as HTML. FPP's plugin.php sends a plain "file=" .html as
// text/plain, so the page goes through this PHP file instead. It also passes
// FPP's light/dark theme setting to the page, which applies it the same way
// FPP's own pages do.
global $settings;
$theme = isset($settings['themeOverride']) ? $settings['themeOverride'] : '';
if ($theme !== 'light' && $theme !== 'dark') {
    $theme = '';
}
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
$html = file_get_contents(__DIR__ . '/www/index.html');
echo preg_replace('/<html lang="en">/', '<html lang="en" data-fpp-theme="' . $theme . '">', $html, 1);
