# 1. Base Image: Use Node.js 22 LTS (Alpine Linux for small size)
FROM node:22-alpine

# 2. Working Directory: Set the working directory inside the container
WORKDIR /app

# 3. Dependencies: Copy package manifests first to optimize Docker layer caching
COPY package*.json ./

# 4. Install dependencies inside the container
RUN npm install

# 5. Source code: Copy remaining project files
COPY . .

# 6. Port: Expose default Vite development server port
EXPOSE 5173

# 7. Start Command: Run Vite dev server, binding to 0.0.0.0 so it's accessible from your host machine
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]