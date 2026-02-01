FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (utilisées si le volume node_modules est vide)
RUN npm install

# Copy application code
COPY . .

# Entrypoint hors de /app (sinon écrasé par le mount docker-compose)
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

