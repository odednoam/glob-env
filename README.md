# glob-env

> Run multiple commands with variables determined by glob patterns.

## Install
```sh
$ npm install -g glob-env
```

### Usage

Running multiple instances of a script, for all combinations of "arch" and "lang" dirs:
```sh
$ glob-env arch="resources/arch/*" lang="resources/lang/*" -- npm run build-resources --lang $lang --arch $arch
```
Will run "npm run build-resources" for every combination. If, for example, the structure of "resources" is as follows:
* resources/
* resources/arch/*
* resources/arch/x86
* resources/arch/ia64
* resources/lang
* resources/lang/en_US
* resources/lang/fr_FR

then the script will be run 4 times:

* arch=x86 lang=en_US
* arch=x86 lang=fr_FR
* arch=ia64 lang=en_US
* arch=ia64 lang=fr_FR

Using in pakcage.json
```json
{
  "dependencies": {
    "glob-env": "^1.0.0",
    "browserify": "^13.0.1"
  },
  "scripts": {
    "build": "./node_modules/.bin/glob-env src=src/* ./node-modules/.bin/browserify src/${src} dist/${src}"
  }
}
```


### Arguments
* *--parallel-run*: commands will be executed concurrently
* *--sequential-run*: commands will be executed one after the other (will take longer to complete, but require less resources)
* *--dont-collate-output*: by default, command output is buffered to memory and displayed sequentially even if commands are executed in parallel. You should use this flag if process output is large
* *--dont-replace*: don't replace $ variables in command line (env variables will still be set)
* *--*: end of command-line flags. If present, following arguments will be passed to the executed command as-is.

### License
MIT © [Oded Noam](http://odednoam.com)
