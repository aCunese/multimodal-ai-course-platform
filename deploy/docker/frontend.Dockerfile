FROM node:20.19-alpine AS build

WORKDIR /app/web

COPY web/package.json /app/web/package.json
COPY web/package-lock.json /app/web/package-lock.json

RUN npm ci

COPY web /app/web

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html

EXPOSE 80

