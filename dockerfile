FROM node:18

# Cria e define o diretório de trabalho
WORKDIR /app

# Copia o arquivo de configuração do package.json
COPY package.json ./
COPY package-lock.json ./

# Instala as dependências
RUN npm install

# Copia todos os arquivos do projeto
COPY . .

# Expõe a porta 4500
EXPOSE 4500

# Comando para iniciar a aplicação
CMD [ "npm", "start" ]
