<?php
# One menu entry (PLUGIN_GUIDELINES.md §9.1: at most one per type).
# wrap 0 = no FPP header or menus, so the remote gets the whole phone screen.
$menuEntries = Array(
	Array(
		'text' => 'WLED Remote',
		'type' => 'status',
		'page' => 'app.php',
		'wrap' => 0
	)
);

# Expected to be set by FPP: $plugin (this plugin's directory name), $menu (the menu being drawn).
foreach ($menuEntries as $entry) {
	if ($entry['type'] != $menu) {
		continue;
	}
	$nopage = (isset($entry['wrap']) && $entry['wrap'] == 0) ? '&nopage=1' : '';
	printf("<li><a href='plugin.php?plugin=%s&page=%s%s'>%s</a></li>\n",
		htmlspecialchars($plugin, ENT_QUOTES), htmlspecialchars($entry['page'], ENT_QUOTES), $nopage,
		htmlspecialchars($entry['text'], ENT_QUOTES));
}
?>
