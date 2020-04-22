<?php

$libs = [
    "gmtools",
    "gmdata",
    "gmfinders"
];

$target = "gmutils.js";
$contents = "";

foreach ($libs as $lib) {
    $file = $lib . ".js";
    $contents .= file_get_contents(__DIR__ . DIRECTORY_SEPARATOR . $file);
}

file_put_contents(__DIR__ . DIRECTORY_SEPARATOR . $target, $contents);
echo "Build Complete.";
