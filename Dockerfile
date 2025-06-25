# Use official Node.js 20 image
FROM node:20

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Start the backend
CMD ["npm", "run", "dev"]
