FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Backend listens on port 3006 inside container
EXPOSE 3006

# Start server correctly
CMD ["npm", "server"]
