<?php

declare(strict_types=1);

use NGSOFT\RegExp;

require_once __DIR__ . '/vendor/autoload.php';
$src = dirname(__DIR__) . '/src';

foreach (scandir($src)as $file) {
    if (str_contains($file, '.dev')) continue;
    if (!str_ends_with($file, '.user.js')) continue;
    $filename = "$src/$file";

    echo "$filename\n";

    $userscript = \NGSOFT\Userscript\Metadata::loadUserscript($filename);

    print $userscript;
    exit;
}