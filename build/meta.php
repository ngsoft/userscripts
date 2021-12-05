<?php

if (php_sapi_name() !== "cli") {
    throw new ErrorException("Can only be run in console.");
}

$dir = dirname(__DIR__) . '/src';

chdir($dir);

function getMeta($file) {
    $block = '/==\/?UserScript==/';
    $started = false;
    if (!is_file($file)) return null;
    $handle = fopen($file, 'r');
    $meta = [];
    while ($line = fgets($handle)) {
        $line = trim($line);
        if (preg_match('/^\/\//', $line)) {
            if (preg_match($block, $line)) {
                if (!$started) $started = true;
                else {
                    $meta[] = $line;
                    break;
                }
            }
            if ($started) $meta[] = $line;
        }
    }
    fclose($handle);

    return implode("\n", $meta);
}

class UserScriptMeta extends stdClass {

    public function __construct(string $file) {
        $this->values = [];
        if ($meta = getMeta($file)) $this->parse($meta);
    }

    private function parse(string $meta) {

        foreach (explode(PHP_EOL, $meta) as $line) {

            if (preg_match('/@(\S+)(\h+(.*))?/', $line, $matches)) {
                $value = true;
                if (isset($matches[3])) list(, $key,, $value) = $matches;
                else list(, $key) = $matches;
                if (!isset($this->{$key})) $this->{$key} = [];
                $this->{$key}[] = $value;
                $this->values[] = $value;
            }
        }
    }

    public function compare(self $other) {

        return array_diff($this->values, $other->values);
    }

    public function __toString() {
        $data = (array) $this;
        $meta = [];
        if (count($data)) {
            $meta[] = "// ==UserScript==";
            foreach ($data as $k => $a) {
                if ($k === "values") continue;
                foreach ($a as $v) {
                    if (is_string($v)) $meta[] = sprintf("// @%s\t%s", $k, $v);
                    else $meta[] = sprintf("// @%s", $k);
                }
            }
            $meta[] = "// ==/UserScript==";
        }
        return implode(PHP_EOL, $meta);
    }

}

foreach (scandir($dir) as $file) {

    if (preg_match('/^(.*)\.user\.js$/', $file, $matches) && mb_strpos($file, '.dev.') === false) {
        list(, $script) = $matches;
        $meta = sprintf('%s.meta.js', $script);
        $file_usm = new UserScriptMeta($file);
        $meta_usm = new UserScriptMeta($meta);

        if (count($file_usm->compare($meta_usm)) or count($meta_usm->compare($file_usm))) {
            printf("[ MODIFIED ]\t%s\n", $meta);
            file_put_contents($meta, $file_usm);
        }
    }
}