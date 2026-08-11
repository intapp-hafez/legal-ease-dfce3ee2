<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];
$uploadDir = __DIR__ . '/documents';

// Check if there is a documents folder exist, if not create one
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create documents directory']);
        exit;
    }
}

// Generate a safe unique filename to avoid duplicates/overwriting
$fileName = basename($file['name']);
$fileNameWithoutExt = pathinfo($fileName, PATHINFO_FILENAME);
$extension = pathinfo($fileName, PATHINFO_EXTENSION);
$safeFileName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $fileNameWithoutExt);
$uniqueFileName = $safeFileName . '_' . time() . '.' . $extension;

$destination = $uploadDir . '/' . $uniqueFileName;

if (move_uploaded_file($file['tmp_name'], $destination)) {
    // Return the relative URL so the frontend can save it
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $fileUrl = $protocol . '://' . $host . '/documents/' . $uniqueFileName;
    
    echo json_encode([
        'success' => true,
        'url' => $fileUrl,
        'path' => '/documents/' . $uniqueFileName
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to move uploaded file']);
}
?>
