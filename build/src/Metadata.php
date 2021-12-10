<?php

declare(strict_types=1);

namespace NGSOFT\Userscript;

use IteratorAggregate,
    JsonSerializable;
use NGSOFT\{
    RegExp, Traits\UnionType
};
use RuntimeException,
    Stringable;
use function json_decode,
             json_encode,
             str_contains,
             str_ends_with,
             str_starts_with;

/**
 * @link https://www.tampermonkey.net/documentation.php?ext=dhdg
 */
class Metadata implements Stringable, JsonSerializable, IteratorAggregate {

    use UnionType;

    ////////////////////////////   Metadatas   ////////////////////////////

    /** @var ?string */
    private $name;

    /** @var ?string */
    private $namespace;

    /** @var ?string */
    private $version;

    /** @var ?string */
    private $author;

    /** @var ?string */
    private $description;

    /** @var ?string */
    private $homepage;

    /** @var ?string */
    private $homepageURL;

    /** @var ?string */
    private $website;

    /** @var ?string */
    private $source;

    /** @var ?Icon */
    private $icon;

    /** @var ?Icon */
    private $iconURL;

    /** @var ?Icon */
    private $defaulticon;

    /** @var ?Icon */
    private $icon64;

    /** @var ?Icon */
    private $icon64URL;

    /** @var ?string */
    private $updateURL;

    /** @var ?string */
    private $downloadURL;

    /** @var ?string */
    private $supportURL;

    /** @var string[] */
    private $include = [];

    /** @var string[] */
    private $match = [];

    /** @var string[] */
    private $exclude = [];

    /** @var string[] */
    private $require = [];

    /** @var array<string,string> */
    private $resource = [];

    /** @var string[] */
    private $connect = [];

    /** @var ?string */
    private $runAt;

    /** @var string[] */
    private $grant = [];

    /** @var array<string,string> */
    private $antifeature = [];

    /** @var bool */
    private $noframes = false;

    /** @var string[] */
    private $nocompat = [];

    ////////////////////////////   Filenames   ////////////////////////////

    /** @var string */
    private $userscript;

    /** @var string */
    private $metascript;

    /** @var string */
    private $jsonmeta;

    ////////////////////////////   Metadatas   ////////////////////////////

    /** @var string[] */
    private $properties = [];

    /** @var array<string,string> */
    private $custom = [];

    ////////////////////////////   Initialization   ////////////////////////////

    /**
     * Creates a new instance
     * @return static
     */
    public static function create(): self {
        $instance = new static();
        return $instance;
    }

    /**
     * Loads Userscript ending with ".user.js"
     *
     * @param string $userscript
     * @param bool $convert_icons
     * @return static
     */
    public static function loadUserscript(string $userscript, bool $convert_icons = false): self {
        if (!is_file($userscript)) throw new RuntimeException(sprintf('%s does not exists.', $userscript));
        if (!str_ends_with($userscript, '.user.js')) throw new RuntimeException(sprintf('%s: invalid extension(.user.js).', $userscript));
        $instance = static::create();
        $instance->setFilenames($userscript);
        $contents = file_get_contents($userscript);
        $instance->parse($contents);

        //set defaulticon to base64 to prevent broken links

        if (
                $convert_icons and
                isset($instance->properties['icon']) and
                !isset($instance->properties['defaulticon']) and
                str_starts_with((string) $instance->getIcon(), 'http')
        ) {

            $instance->setDefaulticon((string) $instance->getIcon(), $convert_icons);
            if (str_contains((string) $instance->getDefaulticon(), ';base64,')) {
                $regex_block = new RegExp('(?:[\/]{2,}\h*==UserScript==\n*)(.*)(?:[\/]{2,}\h*==\/UserScript==\n*)', RegExp::PCRE_DOTALL);

                $replace = $regex_block->replace($contents, (string) $instance . "\n");
                if ($replace !== $contents) {
                    //file_put_contents($userscript, $replace);
                }
            }
        }

        return $instance;
    }

    /**
     * Loads Metascript ending with ".meta.js"
     *
     * @param string $metascript
     * @return static
     */
    public static function loadMetascript(string $metascript) {
        if (!is_file($metascript)) throw new RuntimeException(sprintf('%s does not exists.', $metascript));
        if (!str_ends_with($metascript, '.meta.js')) throw new RuntimeException(sprintf('%s: invalid extension(.meta.js).', $metascript));
        $userscript = preg_replace('/\.meta\.js$/', '.user.js', $metascript);
        $instance = static::create();
        $instance->setFilenames($userscript);
        $instance->parse(file_get_contents($metascript));
        return $instance;
    }

    /**
     * Loads Metascript ending with ".meta.js"
     *
     * @param string $jsonmeta
     * @return static
     */
    public static function loadMetadata(string $jsonmeta) {
        if (!is_file($jsonmeta)) throw new RuntimeException(sprintf('%s does not exists.', $jsonmeta));
        if (!str_ends_with($jsonmeta, '.json')) throw new RuntimeException(sprintf('%s: invalid extension(.json).', $jsonmeta));
        $userscript = preg_replace('/\.json$/', '.user.js', $jsonmeta);
        $instance = static::create();
        $instance->setFilenames($userscript);
        $instance->loadMeta(json_decode(file_get_contents($jsonmeta), true));
        return $instance;
    }

    private function __construct() {
        // instanciate using static methods
    }

    private function setFilenames(string $userscript) {
        $this->userscript = $userscript;
        $this->metascript = preg_replace('/\.user\.js$/', '.meta.js', $userscript);
        $this->jsonmeta = preg_replace('/\.user\.js$/', '.json', $userscript);
    }

    ////////////////////////////   Save Metadata   ////////////////////////////

    /**
     * Save json metadata
     *
     * @return static
     */
    public function saveJSON() {

        if (!is_string($this->jsonmeta)) {
            throw new RuntimeException('Cannot save metadata, no filename.');
        }

        $json = json_encode($this, JSON_PRETTY_PRINT);
        file_put_contents($this->jsonmeta, $json);
        return $this;
    }

    /**
     * Save .meta.js
     *
     * @return static
     */
    public function saveMetaFile() {
        if (!is_string($this->metascript)) {
            throw new RuntimeException('Cannot save metadata, no filename.');
        }
        file_put_contents($this->metascript, $this);
        return $this;
    }

    ////////////////////////////   Getters   ////////////////////////////

    public function getName(): ?string {
        return $this->name;
    }

    public function getNamespace(): ?string {
        return $this->namespace;
    }

    public function getVersion(): ?string {
        return $this->version;
    }

    public function getAuthor(): ?string {
        return $this->author;
    }

    public function getDescription(): ?string {
        return $this->description;
    }

    public function getHomepage(): ?string {
        return $this->homepage;
    }

    public function getHomepageURL(): ?string {
        return $this->homepageURL;
    }

    public function getWebsite(): ?string {
        return $this->website;
    }

    public function getSource(): ?string {
        return $this->source;
    }

    public function getIcon(): ?string {
        return (string) $this->icon;
    }

    public function getIconURL(): ?string {
        return (string) $this->iconURL;
    }

    public function getDefaulticon(): ?string {
        return (string) $this->defaulticon;
    }

    public function getIcon64(): ?string {
        return (string) $this->icon64;
    }

    public function getIcon64URL(): ?string {
        return (string) $this->icon64URL;
    }

    public function getUpdateURL(): ?string {
        return $this->updateURL;
    }

    public function getDownloadURL(): ?string {
        return $this->downloadURL;
    }

    public function getSupportURL(): ?string {
        return $this->supportURL;
    }

    public function getInclude(): array {
        return $this->include;
    }

    public function getMatch(): array {
        return $this->match;
    }

    public function getExclude(): array {
        return $this->exclude;
    }

    public function getRequire(): array {
        return $this->require;
    }

    public function getResource(): array {
        return $this->resource;
    }

    public function getConnect(): array {
        return $this->connect;
    }

    public function getRunAt(): ?string {
        return $this->runAt;
    }

    public function getGrant(): array {
        return $this->grant;
    }

    public function getAntifeature(): array {
        return $this->antifeature;
    }

    public function getNoframes(): bool {
        return $this->noframes;
    }

    public function getNocompat(): array {
        return $this->nocompat;
    }

    public function getCustom(string $name) {
        return $this->custom[$name] ?? null;
    }

    ////////////////////////////   Setters   ////////////////////////////

    public function setName(string $name) {
        $this->addProperty('name');

        $this->name = $name;
        return $this;
    }

    public function setNamespace(string $namespace) {
        $this->addProperty('namespace');
        $this->namespace = $namespace;
        return $this;
    }

    public function setVersion(string $version) {
        $this->addProperty('version');
        $this->version = $version;
        return $this;
    }

    public function setAuthor(string $author) {
        $this->addProperty('author');
        $this->author = $author;
        return $this;
    }

    public function setDescription(string $description) {
        $this->addProperty('description');
        $this->description = $description;
        return $this;
    }

    public function setHomepage(string $homepage) {
        $this->addProperty('homepage');
        $this->homepage = $homepage;
        return $this;
    }

    public function setHomepageURL(string $homepageURL) {
        $this->addProperty('homepageURL');
        $this->homepageURL = $homepageURL;
        return $this;
    }

    public function setWebsite(string $website) {
        $this->addProperty('website');
        $this->website = $website;
        return $this;
    }

    public function setSource(string $source) {
        $this->addProperty('source');
        $this->source = $source;
        return $this;
    }

    public function setIcon(string $icon, bool $convert = false) {
        $this->addProperty('icon');
        $this->icon = new Icon($icon, $convert);
        return $this;
    }

    public function setIconURL(string $iconURL, bool $convert = false) {
        $this->addProperty('iconURL');
        $this->iconURL = new Icon($iconURL, $convert);
        return $this;
    }

    public function setDefaulticon(string $defaulticon, bool $convert = false) {
        $this->addProperty('defaulticon');
        $this->defaulticon = new Icon($defaulticon, $convert);
        return $this;
    }

    public function setIcon64(string $icon64, bool $convert = false) {
        $this->addProperty('icon64');
        $this->icon64 = new Icon($icon64, $convert);
        return $this;
    }

    public function setIcon64URL(string $icon64URL, bool $convert = false) {
        $this->addProperty('icon64URL');
        $this->icon64URL = new Icon($icon64URL, $convert);
        return $this;
    }

    public function setUpdateURL(string $updateURL) {
        $this->addProperty('updateURL');
        $this->updateURL = $updateURL;
        return $this;
    }

    public function setDownloadURL(string $downloadURL) {
        $this->addProperty('downloadURL');
        $this->downloadURL = $downloadURL;
        return $this;
    }

    public function setSupportURL(string $supportURL) {
        $this->addProperty('supportURL');
        $this->supportURL = $supportURL;
        return $this;
    }

    public function setInclude(array $include) {
        $this->addProperty('include');
        $this->include = $include;
        return $this;
    }

    public function setMatch(array $match) {
        $this->addProperty('match');
        $this->match = $match;
        return $this;
    }

    public function setExclude(array $exclude) {

        $this->addProperty('exclude');
        $this->exclude = $exclude;
        return $this;
    }

    public function setRequire(array $require) {
        $this->addProperty('require');
        $this->require = $require;
        return $this;
    }

    public function setConnect(array $connect) {
        $this->addProperty('connect');
        $this->connect = $connect;
        return $this;
    }

    public function setRunAt(string $runAt) {
        $this->addProperty('run-at');
        $this->runAt = $runAt;
        return $this;
    }

    public function setGrant(array $grant) {
        $this->addProperty('grant');
        $this->grant = $grant;
        return $this;
    }

    public function setNoframes(bool $noframes) {
        $this->addProperty('noframes');
        if ($noframes === false) unset($this->properties['noframes']);

        $this->noframes = $noframes;
        return $this;
    }

    public function setNocompat(array $nocompat) {
        $this->addProperty('nocompat');
        $this->nocompat = $nocompat;
        return $this;
    }

    public function addResource(string $name, string $value) {
        $this->addProperty('resource');
        $this->resource[$name] = $value;
        return $this;
    }

    public function addAntifeature(string $name, string $value) {
        $this->addProperty('antifeature');
        $this->antifeature[$name] = $value;
        return $this;
    }

    public function addInclude(string $include) {
        $this->addProperty('include');
        $this->include[] = $include;
        return $this;
    }

    public function addMatch(string $match) {
        $this->addProperty('match');
        $this->match[] = $match;
        return $this;
    }

    public function addExclude(string $exclude) {

        $this->addProperty('exclude');
        $this->exclude[] = $exclude;
        return $this;
    }

    public function addRequire(string $require) {
        $this->addProperty('require');
        $this->require[] = $require;
        return $this;
    }

    public function addConnect(string $connect) {
        $this->addProperty('connect');
        $this->connect[] = $connect;
        return $this;
    }

    public function setCustom(string $name, $value) {
        $this->checkType($value, 'string', 'array', 'bool');

        $key = $this->getKey($name);
        if (is_string($key)) $this->{$key} = $value;
        else $this->custom[$name] = $value;

        $this->addProperty($name);
        return $this;
    }

    ////////////////////////////   Parser/Builder   ////////////////////////////


    private function isValidProp(string $prop) {
        static $re;
        $re = $re ?? new RegExp('^[\w\-]+$');
        return $re->test($prop);
    }

    private function addProperty(string $prop) {
        $this->properties[$prop] = $prop;
    }

    private function getKey(string $prop): ?string {
        $key = preg_replace_callback('/[\-]+(\w)/', fn($m) => strtoupper($m[1]), $prop);
        return property_exists($this, $key) ? $key : null;
    }

    private function getFormatIterator() {

        static $sorted = [
            [
                'version', 'name', 'description', 'author',
                'namespace', 'homepage', 'homepageURL', 'website', 'source',
                'icon', 'iconURL', 'defaulticon', 'icon64', 'icon64URL',
            ],
            [
                'nocompat', 'run-at', 'noframes', 'grant',
                'resource', 'require',
            ],
            [
                'supportURL', 'updateURL', 'downloadURL', 'antifeature',
            ],
            [
                'custom',
            ],
            [
                'include', 'match', 'exclude', 'connect',
            ]
        ];

        $properties = $this->properties;
        $len = 0;
        foreach ($sorted as $block) {
            if ($len > 0) yield '' => '';
            $len = 0;

            foreach ($block as $tag) {
                if ($tag == 'custom') {
                    foreach ($this->custom as $prop => $value) {
                        $len++;
                        yield $prop => $value;
                    }
                    continue;
                }
                if (isset($properties[$tag])) {
                    $len++;
                    if ($key = $this->getKey($tag)) yield $tag => $this->{$key};
                }
            }
        }
    }

    private function build(): string {

        $result = '';
        $lines = $tmp = [];
        $maxlen = 0;

        foreach ($this->getFormatIterator() as $prop => $value) {
            if (($len = strlen($prop)) > $maxlen) $maxlen = $len;
            if (empty($prop)) {
                if (count($lines) > 0) $lines[] = [];
            } elseif (is_bool($value)) $lines[] = [$prop, ''];
            elseif (is_array($value)) {
                foreach ($value as $k => $v) {
                    if (is_string($k)) $lines[] = [$prop, $k . ' ' . $v];
                    else $lines[] = [$prop, $v];
                }
            } else $lines[] = [$prop, $value];
        }


        if (count($lines) > 0 and $maxlen > 0) {
            $maxlen += 2;
            foreach ($lines as $line) {
                if (empty($line)) {
                    $tmp[] = '';
                    continue;
                }
                list($prop, $value) = $line;
                $comment = '';
                $len = strlen($prop);

                $comment .= sprintf('@%s', $prop);
                if (!empty($value)) {
                    for ($i = $len; $i < $maxlen; $i++) {
                        $comment .= ' ';
                    }
                    $comment .= $value;
                }

                $tmp[] = $comment;
            }
        }

        if (!empty($tmp)) {

            $comments = $next = '';
            $sep = false;

            foreach ($tmp as $index => $line) {
                $next = $tmp[$index + 1] ?? '';

                if (empty($line)) {
                    if (!$sep && !empty($next)) {
                        $comments .= "//\n";
                        $sep = true;
                    }
                    continue;
                }
                $comments .= sprintf("// %s\n", $line);
                $sep = false;
            }
            $result = sprintf("// ==UserScript==\n%s// ==/UserScript==\n", $comments);
        }
        return $result;
    }

    private function parse(string $contents) {


        $regex_block = new RegExp('(?:[\/]{2,}\h*==UserScript==\n*)(.*)(?:[\/]{2,}\h*==\/UserScript==\n*)', RegExp::PCRE_DOTALL);
        $regex_prop = new RegExp('[\/]{2,}\h*@([\w\-]+)\h*(.*)\n*', 'g');
        $regex_key_value = new RegExp('^(.*)\h+(.*)$');

        if ($block = $regex_block->exec($contents)) {


            $block = $block[1];
            $data = [];

            $custom = [];

            while ($matches = $regex_prop->exec($block)) {
                list(, $prop, $value) = $matches;
                $value = trim($value);
                if ($key = $this->getKey($prop)) {
                    if (is_array($this->{$key})) {
                        $data[$prop] = $data[$prop] ?? [];
                        if (in_array($key, ['resource', 'antifeature'])) {
                            if ($keyvalue = $regex_key_value->exec($value)) {
                                $data[$prop] [$keyvalue[1]] = $keyvalue[2];
                            }
                        } else $data[$prop] [] = $value;
                        continue;
                    } elseif (empty($value) and is_bool($this->{$key})) $value = true;

                    $data[$prop] = $value;
                } elseif ($this->isValidProp($prop)) {
                    $data[$prop] = $data[$prop] ?? [];
                    if (empty($value)) $value = true;
                    $data[$prop][] = $value;
                    $custom[$prop] = $prop;
                }
            }

            if (!empty($data)) {
                foreach ($data as $prop => $value) {
                    $this->addProperty($prop);
                    if ($key = $this->getKey($prop)) {
                        if (str_contains($prop, 'icon')) $this->{$key} = new Icon($value);
                        else $this->{$key} = $value;
                        continue;
                    }

                    // custom
                    if (count($value) == 1) $this->custom[$prop] = $value[0];
                    else $this->custom[$prop] = $value;
                }
            }
        } else throw new RuntimeException(sprintf('No userscript block in %s', $this->userscript));
    }

    private function loadMeta(array $meta) {
        foreach ($meta as $prop => $value) {
            $this->addProperty($prop);
            if ($key = $this->getKey($prop)) {
                $this->{$key} = $value;
                continue;
            }
            $this->custom[$prop] = $value;
        }
    }

    public function toArray(): array {
        $metadata = [];
        foreach ($this->getIterator() as $prop => $value) {
            $metadata[$prop] = $value;
        }
        return $metadata;
    }

    ////////////////////////////   Interfaces   ////////////////////////////

    /**
     * @return \Generator<string,mixed>
     */
    public function getIterator() {
        foreach ($this->properties as $prop) {
            if ($key = $this->getKey($prop)) {
                yield $prop => $this->{$key};
            } elseif (array_key_exists($prop, $this->custom)) {
                yield $prop => $this->custom[$prop];
            }
        }
    }

    public function jsonSerialize() {
        return $this->toArray();
    }

    public function __toString() {
        return $this->build();
    }

}
