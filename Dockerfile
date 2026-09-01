FROM node:26.7.0-slim

# 1. Establecemos una carpeta de trabajo dentro del contenedor
WORKDIR /app

# 2. Copiamos el package.json y package-lock.json primero (optimiza el caché de Docker)
COPY package*.json ./

# 3. Instalamos las dependencias
RUN npm install

# 4. Copiamos el resto de los archivos de tu proyecto
COPY . .

# 5. Exponemos el puerto por defecto de netlify dev (usualmente es el 8888)
EXPOSE 8888

# 6. Ejecutamos netlify dev, forzándolo a escuchar en todas las interfaces de red
CMD ["npx", "netlify", "dev", "--port", "8888" , "&&" , "npm", "run" ,"generate-pdf"]