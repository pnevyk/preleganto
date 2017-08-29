# Syntax

## Metadata

You can specify some metadata for the presentation and other for individual
slides. There aren't many of them right now but they will be implemented
proportionally to the demand.

```
:title: Presentation title
:author: Presentation author
:ratio: 16:10
:theme: either name of Preleganto theme or the path to your custom one
:custom-style: path/to/additional/style.css
:custom-script: path/to/additional/script.js

'''
:previous-slide-number:

Slides
```

## Slide separators

Preleganto uses AsciiDoc horizontal rule syntax for slide separation, i.e. three
consecutive apostrophes (`'''`).

```
Slide 1

'''

Slide 2
```

## Slide notes

All AsciiDoc comments are treated as slide notes (not implemented yet, see
[#5](https://github.com/pnevyk/preleganto/issues/5)) and are displayed only in
speaker mode (not implemented yet, see
[#4](https://github.com/pnevyk/preleganto/issues/4)).

```
Slide content

// Slide note
```

## Headings

Headings are lines which start with a particular number of equality signs.

```
= Large Heading

== Medium Heading

=== Small Heading
```

## Lists

Lists can be either unordered (starting with a particular number of `*`) or
ordered (starting with a particular number of `.`). If you need nested lists,
just write two or three consecutive `*`/`.` characters. Lists can be also mixed.

```
* The first item of an unordered list
* The second one
** And the nested one

. The first item of an ordered list
. The second one
.. And the nested one

* Unordered list
.. With ordered sublist
```

## Paragraphs

If you want to write sentences without bullets, just write your text and it will
be interpreted as ordinary paragraph.

```
An ordinary paragraph.
```

## Formatting

You can make **bold**, *italic* and `monospace` text sections with ordinary
AsciiDoc syntax.

```
*Bold*, _italic_ and `monospace`. Also with inner-word variants such as
b**ol**d, i__tali__c and m``onospac``e.
```

## Links

You can make links with AsciiDoc macro (Preleganto doesn't support automatic
link recognition).

```
link:https://github.com/pnevyk/preleganto[This] is the best presentation
generator ever.
```

## Images

You can include images with AsciiDoc macro. You can specify alternative text
which will be displayed if the image is not found. And you can specify width
alone, or width and height of the image in pixels.

```
image:logo.png[]
image:logo.png[Logo]
image:logo.png[Logo, 300]
image:logo.png[Logo, 300, 200]
```

## Source code

Source code is placed into AsciiDoc listing block with `source` identifier. You
can also specify the language which is then highlighted. For all supported
languages see [Prism documentation](http://prismjs.com/#languages-list).

```
[source]
----
# Code without syntax highlighting
----

[source, javascript]
----
function greet() {
    return 'Hello world!';
}
----
```

## Mathematics

Preleganto supports rendering LaTeX syntax into nicely typeset mathematic
symbols using [katex](https://github.com/Khan/KaTeX). Both inline and block
modes are supported.

```
Inline mathematics: math:{e^{i\pi} + 1 = 0}[].

A block mathematics:

[math]
----
e^{i\pi} + 1 = 0
----
```
