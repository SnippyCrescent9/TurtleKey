FROM node:18

WORKDIR /usr/src/app

# Copy backend package files
COPY backend/turtle-key-backend/package*.json ./

# Install dependencies
RUN npm install

# Copy only the backend files
COPY backend/turtle-key-backend/ ./

EXPOSE 8080

CMD ["node", "server.js"] 