const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuración de la carpeta de destino
const dir = path.join(__dirname, 'src', 'assets', 'models');

// Crear la carpeta si no existe
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Lista de archivos necesarios (del repositorio oficial de face-api.js)
const baseUrl = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
const files = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1'
];

console.log('--- Iniciando descarga de modelos de IA ---');

files.forEach(file => {
    const filePath = path.join(dir, file);
    const fileStream = fs.createWriteStream(filePath);

    https.get(baseUrl + file, (response) => {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
            fileStream.close();
            console.log(`✅ Descargado: ${file}`);
        });
    }).on('error', (err) => {
        console.error(`❌ Error al descargar ${file}: ${err.message}`);
    });
});