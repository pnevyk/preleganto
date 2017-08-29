# Preleganto

Yet another in-browser presentation tool which transforms source content written
in [AsciiDoc](http://asciidoctor.org/)-like syntax (kind of similar to Markdown)
into HTML. It offers convenient command line interface and some advanced
features. You can see Preleganto in action
[here](https://pnevyk.github.io/preleganto/).

## List of features

* Transforming markup to HTML
* Text formatting, links, images, ...
* Built-in and custom themes and layouts
* Source code [highlighting](https://github.com/PrismJS/prism)
* Touch devices support
* Smart typographic [substitution](https://github.com/pnevyk/tipograph)
* Inline and block LaTeX [typesetting](https://github.com/Khan/KaTeX)
* Local server with multiple devices synchronization and live reloading
* Export to full-featured HTML file with all assets embedded (even from network)
* Watch mode and automatic rebuild
* Changing aspect ratio on demand

## Screenshot

![Notable Features](screenshot.png)

## Usage

1. `npm install -g preleganto`
2. Write some markup into a file (see [examples](examples/) for inspiration)
3. `preleganto build --input examples/preleganto.adoc`

## Notes

Preleganto is in early stages of development. Many features are missing, no
tests are written, a lot of refactoring is needed and documentation is lacking.
But I hope it will get better over time. Also the parser is expected to be quite
buggy.

### Browser support

I don't aim to support every browser out there. I want to use new features
present in web development today. In modern browser Preleganto should work well.

### AsciiDoc compatibility

Since there is no AsciiDoc parser written in JavaScript, which would emit an
AST, available (to my knowledge), I had to write my own. It supports really
small subset of AsciiDoc syntax and probably doesn't follow AsciiDoc
specification in all possible edge cases. Surely there are also parsing errors
where they shouldn't be.

I hope that it will be replaced eventually by a parser from anyone who will want
to focus on full AsciiDoc support maintaing compatibility with specification,
because I am not that person.

## Documenation

See [docs](docs/readme.md).

## Contributing

I'd love to see anyone who wants to help, be it a pull request or just a
comment. The source code is written in modern JavaScript with Flow type
annotations. For more information, see [Contributing guide](CONTRIBUTING.md).

## Roadmap

See [feature
requests](https://github.com/pnevyk/preleganto/labels/feature-request).

## Alternatives

* [remark](https://github.com/gnab/remark) - I have used this one. It's
  relatively convenient tool generating nice presentations. I had to figured out how to support LaTeX and the solution wasn't so nice. Also it requires
  internet connection when you have some external resources (Google fonts, ...).
* [reveal.js](https://github.com/hakimel/reveal.js/) - I would say famous HTML
  presentation tool. It allows you to create nested slides (vertical direction)
  which is impressive. It seems that it supports LaTeX but it's not out of the
  box and dynamic transformation via MathJax is slow. I personally don't like
  the design. Probably the same problem with external resources as remark. But
  it has web [GUI editor](https://slides.com/).
* [impress.js](https://github.com/impress/impress.js/) - I have no experience
  with this but I feel it's worth to note it here. This tool is for people who
  are willing to spend some extra time to create impressive presentations.
* And [many](https://github.com/astefanutti/decktape) others.

## License

Preleganto is licensed under MIT license. Feel free to use it, contribute or
spread the word.
