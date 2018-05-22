FROM node:6.10

LABEL maintainer "dmitry@demenchuk.me"
LABEL version="1.0"
LABEL description="If you need to convert text from one markup format into another, pandoc is your swiss-army knife."

# Create app directory
RUN mkdir -p /usr/src/pandoc-as-a-service
RUN mkdir -p ~/.pandoc
COPY . /usr/src/pandoc-as-a-service
COPY ./pandoc_files ~/.pandoc
WORKDIR /usr/src/pandoc-as-a-service

# Install packages
RUN apt-get update --fix-missing \
  && apt-get install -y pandoc haskell-platform \
  && apt-get clean \
  && ghc --make ~/.pandoc/pandoc-docx-pagebreak.hs \
  && ghc --make ~/.pandoc/pandoc-html-pagebreak.hs \
  && rm -rf /var/lib/apt/lists/* \
  && npm install

EXPOSE 8080

CMD ["npm", "start"]
