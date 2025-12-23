FROM node:20-slim

RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY settings.js ./ 2>/dev/null || true

# ✅ producción (más estable y rápido)
RUN npm ci --omit=dev

COPY . .

EXPOSE 8080

# ✅ proceso principal en foreground (container no muere)
CMD ["npm", "run", "prod"]

