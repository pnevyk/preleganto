// @flow

export type Asset = { content: string, options: { [key: string]: string | boolean } };

export default class Template {
    _title: string;
    _css: Array<Asset>;
    _js: Array<Asset>;
    _slides: Array<string>;
    _metadata: { [key: string]: string };

    constructor() {
        this._title = 'Preleganto presentation';
        this._css = [];
        this._js = [];
        this._slides = [];
        this._metadata = {};
    }

    setTitle(title: string): Template {
        this._title = title;
        return this;
    }

    setMetadata(metadata: { [key: string]: string }): Template {
        this._metadata = Object.assign(this._metadata, metadata);
        return this;
    }

    addCss(content: string, options: { [key: string]: string | boolean } = {}): Template {
        this._css.push({ content, options });
        return this;
    }

    addJs(content: string, options: { [key: string]: string | boolean } = {}): Template {
        this._js.push({ content, options });
        return this;
    }

    addSlide(content: string): Template {
        this._slides.push(content);
        return this;
    }

    toHtml(): string {
        return `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>${this._title}</title>
                    ${this._css.map(this._compileCss, this).join('\n')}
                </head>
                <body>
                    <main class="preleganto-presentation">
                        ${this._slides.map(this._compileSlide, this).join('\n')}
                    </main>
                    <script type="text/preleganto-metadata">
                        ${this._compileMetadata()}
                    </script>
                    ${this._js.map(this._compileJs, this).join('\n')}
                </body>
            </html>
        `;
    }

    _compileCss(css: { content: string, options: { [key: string ]: string | boolean } }): string {
        return `<style type="text/css" ${this._compileExtras(css.options)}>
            ${css.content}
        </style>`;
    }

    _compileJs(js: { content: string, options: { [key: string ]: string | boolean } }): string {
        return `<script type="text/javascript" ${this._compileExtras(js.options)}>
            ${js.content}
        </script>`;
    }

    _compileSlide(slide: string, index: number): string {
        return `<section id="view-${index + 1}" class="preleganto-slide">
            ${slide}
        </section>`;
    }

    _compileMetadata(): string {
        return JSON.stringify(this._metadata);
    }

    _compileExtras(extras: { [key: string]: string | boolean}): string {
        return Object.keys(extras).map(key => {
            const value = extras[key];
            if (typeof value === 'string') {
                return ` ${key}="${value}"`;
            } else if (value === true) {
                return ` ${key}`;
            }
        }).join('');

    }
}
