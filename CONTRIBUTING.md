# Contributing

## Bug reports and feature requests

All bug reports and feature requests should be filled as GitHub
[issues](https://github.com/pnevyk/preleganto/issues).

## Setup

```
git clone git@github.com:pnevyk/preleganto.git
cd preleganto
npm install
npm run build
node index.js build --input examples/preleganto.adoc
```

## NPM scripts

* `build` - builds all sources to `lib/` directory, you can then run
  `node index.js` file in the root directory
* `build:watch` - the same as above but it also watches the source files and
  rebuilds on change
* `clean` - removes `lib/` directory
* `test` - runs all tests
* `test:commands` - runs only tests related to cli commands
* `test:unit` - runs only unit tests
* `flow` - checks if the sources contain any Flow errors
* `eslint` - lints the sources with project configuration

## Roadmap

See [feature
requests](https://github.com/pnevyk/preleganto/labels/feature-request).

## Contact

You should communicate publicly in GitHub
[issues](https://github.com/pnevyk/preleganto/issues). However, if there is a
reason (e.g., you have confident information or you are shy yet), you can
contact me at `petr.nevyhosteny@gmail.com`.

## Footnote

Don't be scared, everyone makes mistakes and I am a really great example. If you
want to start with something easy, try these
[issues](https://github.com/pnevyk/preleganto/labels/easy).
