<?php

declare(strict_types=1);

use NGSOFT\Userscript\Metadata;

require_once __DIR__ . '/vendor/autoload.php';
$src = dirname(__DIR__) . '/src';

foreach (scandir($src)as $file) {
    if (str_contains($file, '.dev')) continue;
    if (!str_ends_with($file, '.user.js')) continue;
    $filename = "$src/$file";

    echo "$filename\n";

    $userscript = Metadata::loadUserscript($filename);

    //$userscript->saveJSON();

    print $userscript;

    $metafile = preg_replace('/\.user\.js$/', '.meta.js', $filename);

    print "$metafile\n";

    if (is_file($metafile)) {

        $meta = Metadata::loadMetascript($metafile);

        print $meta;

        var_dump((string) $meta === (string) $userscript);
    }
}