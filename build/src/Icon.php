<?php

declare(strict_types=1);

namespace NGSOFT\Userscript;

use GuzzleHttp\{
    Client, Psr7\HttpFactory
};
use JsonSerializable,
    Mimey\MimeTypes,
    NGSOFT\RegExp,
    Stringable,
    Throwable;

class Icon implements Stringable, JsonSerializable {

    private const RE_HTTP = '#^https?://#';

    /** @var string */
    private $url;

    /** @var ?string */
    private $b64URL;

    /** @var bool */
    private $convert;

    /** @var HttpFactory */
    private $httpFactory;

    public function __construct(string $url, bool $convert = false) {
        $this->httpFactory = new HttpFactory();
        $this->url = $url;
        $this->convert = $convert;
    }

    private function isHTTP(string $url): bool {

        static $re;
        $re = $re ?? new RegExp('^https?:[\/]{2}');

        return $re->test($url);
    }

    public function getURL(): string {
        return $this->url;
    }

    public function getFilename(): ?string {

        static $re;
        $re = $re ?? $re = new RegExp('\.(\w+)$');

        if (preg_match(self::RE_HTTP, $this->url)) {
            $uri = $this->httpFactory->createUri($this->url);
            $path = preg_split('/[\/]+/', $uri->getPath());
            $basename = array_pop($path);

            if ($matches = $re->exec($str)) {
                return $matches[1];
            }
        }
        return null;
    }

    public function getBase64URL(): ?string {

        if (preg_match('/;base64,/', $this->url)) return $this->url;
        elseif (isset($this->b64URL)) return $this->b64URL;
        elseif ($this->convert and preg_match('/^https?:\/\//', $this->url)) {



            $mimey = new MimeTypes();

            $fname = '';

            if ($mime = $mimey->getMimeType(pathinfo($this->url, PATHINFO_EXTENSION))) {
                $client = new Client();
                try {
                    $response = $client->request('GET', $this->url);
                    if ($response->getStatusCode() === 200) {
                        $body = $response->getBody();
                        $body->rewind();
                        if (!empty($contents = $body->getContents())) {
                            return $this->b64URL = sprintf('data:%s;base64,%s', $mime, base64_encode($contents));
                        }
                    }
                } catch (Throwable $error) {

                }
            }
        }

        return null;
    }

    public function jsonSerialize() {

        return [
            'url' => $this->getURL(),
            'base64URL' => $this->getBase64URL()
        ];
    }

    public function __toString() {
        return $this->getBase64URL() ?? $this->url;
    }

}
