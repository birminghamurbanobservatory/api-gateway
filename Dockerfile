# Define from what image we want to build from.
# e.g. latest LTS version 10 of node available from the Docker Hub.
FROM node:10

# Create a directory to hold the application code inside the image.
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied where available (npm@5+)
COPY package*.json ./
RUN npm install --only=prod

# Bundle app source code inside the docker image
COPY . .

# Expose the port the app runs on.
EXPOSE 8080

# Define the command to run
CMD [ "npm", "start" ]