# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copia manifestos de dependências
COPY package*.json ./

# Instala dependências respeitando resolução de peers do Expo / React 19
RUN npm install --legacy-peer-deps

# Copia código fonte da aplicação
COPY . .

# Argumentos de ambiente embutidos no bundle web pelo Expo
ARG EXPO_PUBLIC_API_BASE_URL=https://api.pohinc.com.br
ARG EXPO_PUBLIC_ENABLE_DEV_MENU=false

ENV EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL}
ENV EXPO_PUBLIC_ENABLE_DEV_MENU=${EXPO_PUBLIC_ENABLE_DEV_MENU}

# Gera o bundle estático da aplicação web (pasta /app/dist)
RUN npx expo export --platform web

# ---- Runtime Stage ----
FROM nginx:1.27-alpine

# Copia configuração otimizada do Nginx com fallback SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia a aplicação compilada estática para o diretório padrão do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
