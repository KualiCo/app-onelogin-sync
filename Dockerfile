FROM node:10-alpine
MAINTAINER Kuali Build (build@kuali.co)

# Create app directory
ENV CODE_PATH /usr/src/app
RUN mkdir -p $CODE_PATH
WORKDIR $CODE_PATH

# Install dependencies
COPY package.json $CODE_PATH
COPY yarn.lock $CODE_PATH
RUN yarn --production

# Bundle app source
COPY . $CODE_PATH

# Commands
ENTRYPOINT [ "/bin/sh", "-c" ]
CMD [ "yarn", "start" ]
