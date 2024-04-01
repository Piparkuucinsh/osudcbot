# Use a specific version of the node image to ensure compatibility
FROM node:16 AS builder

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy package.json and other related files for installing dependencies
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies, including devDependencies needed for building the app
RUN npm install -g pnpm
RUN pnpm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Start a new, final image to reduce size
FROM node:16-slim

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy package.json and related files again for production dependencies
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install only production dependencies in the final image
RUN npm install -g pnpm
RUN pnpm install --prod

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Prisma specific steps: Copy the Prisma schema and run Prisma generate
# This ensures the Prisma client is generated and ready for use in production
COPY --from=builder /usr/src/app/prisma ./prisma
RUN npx prisma generate

# Inform Docker that the container listens on the specified port at runtime.
# Note: This does not actually publish the port.
# It functions as a type of documentation between the person who builds the image and the person who runs the container.
EXPOSE 3000

# Define the command to run your app using CMD which defines your runtime
# Here we will use node to run the JavaScript file in dist directory
CMD ["node", "dist/index.js"]
