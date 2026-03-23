FROM node:20-alpine

WORKDIR /app

COPY package.json tsconfig.json tailwind.config.ts postcss.config.mjs next.config.js ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
