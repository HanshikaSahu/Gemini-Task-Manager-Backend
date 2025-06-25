# Use official Node.js 20 image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Install TypeScript globally (or use locally if preferred)
RUN npm install -g typescript

# Copy rest of the code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Expose the port (optional, but good practice)
EXPOSE 3001

# Start the compiled JS
CMD ["node", "dist/index.js"]
