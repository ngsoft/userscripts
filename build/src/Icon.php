<?php

declare(strict_types=1);

namespace NGSOFT\Userscript;

use GuzzleHttp\Client,
    JsonSerializable,
    Mimey\MimeTypes,
    Stringable,
    Throwable;
use function str_starts_with;

class Icon implements Stringable, JsonSerializable {

    /** @var string */
    private $url;

    public function __construct(string $url) {

        $this->url = $url;
    }

    public function getBase64URL(): ?string {

        if (preg_match('/;base64,/', $this->url)) return $this->url;
        elseif (preg_match('/^https?:\/\//', $this->url)) {

            $mimey = new MimeTypes();
            if ($mime = $mimey->getMimeType(pathinfo($this->url, PATHINFO_EXTENSION))) {
                $client = new Client();
                try {
                    $response = $client->request('GET', $this->url);
                    if ($response->getStatusCode() === 200) {
                        $body = $response->getBody();
                        $body->rewind();
                        if (!empty($contents = $body->getContents())) {
                            return sprintf('data:%s;base64,%s', $mime, base64_encode($contents));
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
            'url' => $this->url,
            'base64URL' => $this->getBase64URL()
        ];
    }

    public function __toString() {
        return $this->getBase64URL() ?? $this->url;
    }

}
