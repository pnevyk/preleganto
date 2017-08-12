# Preleganto

Preleganto is another in-browser presentation tool which allows you to create
simple yet elegant slides. Just write content in limited subset of AsciiDoc
(very similar to Markdown) and use Preleganto convenient command line interface
to create a beautiful presentation.

## Notable Features

* Convenient "source code to presentation" generation - no manual HTML editing
* Built-in and custom themes and layouts
* Automatic typographic [correction](https://github.com/pnevyk/tipograph) (e.g.,
  "quotes", symbols such as (tm), ...)
* Out-of-the-box support for:
    1. Source code highlighting
    2. LaTeX typesetting

![Notable Features](screenshot.png)

## Usage

1. `npm install -g preleganto`
2. Write some markup into a file (see [examples](examples/) for inspiration)
3. `preleganto build --input examples/preleganto.adoc`

## Note

Preleganto is in early stages of development. Many features are missing, no
tests are written, a lot of refactoring is needed and documentation is lacking.
But I hope it will get better over time.

### Browser support

I don't aim to support every browser out there. I want to use new features
present in web development today. Preleganto has to work in my browser and if
anybody has issues running it in his browser, then he can make a pull request to
fix it.

### AsciiDoc compatibility

Since there is no AsciiDoc parser written in JavaScript and emitting an AST
available (to my knowledge), I had to write my own. It supports really small
subset of AsciiDoc syntax and probably doesn't follow AsciiDoc specification in
all possible edge cases. Surely there are also parsing errors where they
shouldn't be.

I hope that it will be replaced eventually by a parser from anyone who will want
to focus on full AsciiDoc support maintaing compatibility with specification,
because I am not that person.

## Contributing

I'd love to see anyone who wants to help, be it a pull request or just a
comment. The source code is written in ES2015 JavaScript with Flow type
annotations.

```
git clone git@github.com:pnevyk/preleganto.git
cd preleganto
npm install
npm run build
node index.js build --input examples/preleganto.adoc
```

Development of Preleganto tries to follow rules of [git
flow](http://nvie.com/posts/a-successful-git-branching-model/) approach (more or
less). That means that you should

* make a new branch named `feature/<topic>` branched from `develop` for every
  new feature or enhancement
* make a new branch named `bugfix/<topic>` branched from `develop` for a
  non-critical bugfix
* make a new branch named `hotfix/<topic>` branched from `master` for a
  critical bugfix

Don't be scared, everyone makes mistakes and I am a really great example. If you
want to start with something easy, try these
[issues](https://github.com/pnevyk/preleganto/labels/easy).

## Roadmap

See [feature
requests](https://github.com/pnevyk/preleganto/labels/feature-request).

## License

Preleganto is licensed under MIT license. Feel free to use it, contribute or
spread the word.
