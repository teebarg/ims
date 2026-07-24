FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Expose Vite's default port (use 3000 if using Create React App)
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
