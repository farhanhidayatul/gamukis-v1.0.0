# 1. Gunakan Image Node sebagai dasar untuk build
FROM node:20-alpine

# 2. Tentukan direktori kerja
WORKDIR /app

# 3. Salin package.json untuk install dependensi
COPY package*.json ./

# 4. Install dependensi sesuai lockfile agar socket.io-client ikut tersedia
RUN npm install --include=dev

# 5. Salin semua kode project
COPY . .

# --- TAMBAHAN UNTUK LIVE RELOAD DOCKER ---
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

# 6. Buka port 3000 (port default React)
EXPOSE 3000

# 7. Jalankan perintah start
CMD ["npm", "start"]