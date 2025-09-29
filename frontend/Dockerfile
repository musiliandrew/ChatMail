FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* bun.lockb* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm i; fi

COPY . .

EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "::", "--port", "8080"]
