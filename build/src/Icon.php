<?php

declare(strict_types=1);

namespace NGSOFT\Userscript;

use GuzzleHttp\Client,
    JsonSerializable,
    Mimey\MimeTypes,
    Stringable,
    Throwable;

class Icon implements Stringable, JsonSerializable {

    /** @var string */
    private $url;

    /** @var ?string */
    private $b64URL;

    /** @var bool */
    private $convert;

    public function __construct(string $url, bool $convert = false) {

        $this->url = $url;
        $this->convert = $convert;
    }

    public function getURL(): string {
        return $this->url;
    }

    public function getBase64URL(): ?string {

        if (preg_match('/;base64,/', $this->url)) return $this->url;
        elseif (isset($this->b64URL)) return $this->b64URL;
        elseif ($this->convert and preg_match('/^https?:\/\//', $this->url)) {

            $mimey = new MimeTypes();
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
