# Simple Node.js Docker setup
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads/documents

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
