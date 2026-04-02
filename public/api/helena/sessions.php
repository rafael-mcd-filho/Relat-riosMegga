<?php

declare(strict_types=1);

const DEFAULT_BASE_URL = '__HELENA_API_BASE_URL__';
const DEFAULT_EMBEDDED_TOKEN = '__HELENA_API_TOKEN__';

function send_json(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    send_json(405, [
        'error' => true,
        'text' => 'Method not allowed',
        'code' => 'METHOD_NOT_ALLOWED',
    ]);
}

$token = getenv('HELENA_API_TOKEN') ?: DEFAULT_EMBEDDED_TOKEN;
$baseUrl = getenv('HELENA_API_BASE_URL') ?: DEFAULT_BASE_URL;

if ($token === '' || $token === '__HELENA_API_TOKEN__') {
    send_json(500, [
        'error' => true,
        'text' => 'A integracao da API nao esta configurada no ambiente.',
        'code' => 'MISSING_API_TOKEN',
    ]);
}

$query = $_SERVER['QUERY_STRING'] ?? '';
$targetUrl = rtrim($baseUrl, '/') . '/chat/v2/session' . ($query !== '' ? '?' . $query : '');

$curl = curl_init($targetUrl);

if ($curl === false) {
    send_json(500, [
        'error' => true,
        'text' => 'Nao foi possivel iniciar a integracao de dados.',
        'code' => 'CURL_INIT_ERROR',
    ]);
}

$responseHeaders = [];

curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: ' . $token,
        'Accept: application/json',
    ],
    CURLOPT_TIMEOUT => 60,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_HEADERFUNCTION => static function ($curlHandle, string $headerLine) use (&$responseHeaders): int {
        $length = strlen($headerLine);
        $parts = explode(':', $headerLine, 2);

        if (count($parts) === 2) {
            $responseHeaders[strtolower(trim($parts[0]))] = trim($parts[1]);
        }

        return $length;
    },
]);

$responseBody = curl_exec($curl);

if ($responseBody === false) {
    $message = curl_error($curl) ?: 'Erro ao consultar a integracao de dados';
    curl_close($curl);

    send_json(502, [
        'error' => true,
        'text' => $message,
        'code' => 'UPSTREAM_ERROR',
    ]);
}

$statusCode = curl_getinfo($curl, CURLINFO_RESPONSE_CODE) ?: 502;
$contentType = $responseHeaders['content-type'] ?? 'application/json; charset=utf-8';

curl_close($curl);

http_response_code($statusCode);
header('Content-Type: ' . $contentType);
header('Cache-Control: no-store');
echo $responseBody;
