import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initGlobalImageUpscaler } from './utils/imageUpscaler';

// Inisialisasi fitur auto-upscale high resolution untuk semua gambar PNG kecil di seluruh halaman
initGlobalImageUpscaler();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);
