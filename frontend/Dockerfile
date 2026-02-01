FROM node:18-alpine

ARG APP_ENV=development

WORKDIR /app

ENV APP_ENV=${APP_ENV}

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build for production if APP_ENV is production
# NODE_OPTIONS: évite "JavaScript heap out of memory" sur VPS Hostinger (RAM limitée)
RUN if [ "$APP_ENV" = "production" ]; then \
      NODE_OPTIONS="--max-old-space-size=2048" npm run build; \
    fi

# Entrypoint hors de /app (sinon écrasé par le mount docker-compose)
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 3000

# In production, serve the built files; in development, run dev server
CMD if [ "$APP_ENV" = "production" ]; then \
        npm run preview -- --host 0.0.0.0 --port 3000; \
    else \
        npm run dev -- --host 0.0.0.0; \
    fi

