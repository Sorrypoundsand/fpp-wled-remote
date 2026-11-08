<?php
// Serves the app as HTML. FPP's plugin.php sends a plain "file=" .html as
// text/plain, so the page goes through this PHP file instead.
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
readfile(__DIR__ . '/www/index.html');
