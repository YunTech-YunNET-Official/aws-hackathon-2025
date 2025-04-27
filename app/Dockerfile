# Use Node.js LTS version as the base image
FROM node:20-slim

# Set working directory
WORKDIR /usr/src/app

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chmod 777 uploads

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Command to run the application
CMD ["yarn", "start"]