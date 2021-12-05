<?php

declare(strict_types=1);

use NGSOFT\Userscript\Metadata;

require_once __DIR__ . '/vendor/autoload.php';
$src = dirname(__DIR__) . '/src';

$convert_icons = true;

$cnt = 0;

foreach (scandir($src)as $file) {
    if (str_contains($file, '.dev')) continue;
    if (!str_ends_with($file, '.user.js')) continue;
    $filename = "$src/$file";
    $userscript = Metadata::loadUserscript($filename, $convert_icons);
    $metafile = preg_replace('/\.user\.js$/', '.meta.js', $filename);
    if (is_file($metafile)) {
        $meta = Metadata::loadMetascript($metafile, true);
        $str_user = (string) $userscript;
        $str_meta = (string) $meta;
        if (strcmp($str_user, $str_meta) !== 0) {
            $cnt++;
            printf("%s has been changed, saving %s\n", basename($filename), basename($metafile));

            print $str_user . $str_meta;
            // $userscript->saveMetaFile();
        }
    }
}

if ($cnt === 0) {
    print "No changes where made.\n";
}