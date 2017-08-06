// @flow

export default class Template {
    _title: string;
    _css: Array<{ external: boolean, content: string }>;
    _js: Array<{ external: boolean, content: string, options: { [key: string]: string | boolean } }>;
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

    addCss(external: boolean, content: string): Template {
        this._css.push({ external, content });
        return this;
    }

    addJs(external: boolean, content: string, options: { [key: string]: string | boolean } = {}): Template {
        this._js.push({ external, content, options });
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
                    ${this._css.map(this._compileCss).join('\n')}
                </head>
                <body>
                    <main class="preleganto-presentation">
                        ${this._slides.map(this._compileSlide).join('\n')}
                    </main>
                    <script type="text/preleganto-metadata">
                        ${this._compileMetadata()}
                    </script>
                    ${this._js.map(this._compileJs).join('\n')}
                </body>
            </html>
        `;
    }

    _compileCss(css: { external: boolean, content: string }): string {
        if (css.external) {
            return `<link rel="stylesheet" href="${css.content}" />`;
        } else {
            return `<style type="text/css">
                ${css.content}
            </style>`;
        }
    }

    _compileJs(js: { external: boolean, content: string, options: { [key: string ]: string | boolean } }): string {
        let extras = Object.keys(js.options).map(key => {
            const value = js.options[key];
            if (typeof value === 'string') {
                return ` ${key}="${value}"`;
            } else if (value === true) {
                return ` ${key}`;
            }
        }).join('');

        if (js.external) {
            return `<script type="text/javascript" src="${js.content}" ${extras}></script>`;
        } else {
            return `<script type="text/javascript">
                ${js.content}
            </script>`;
        }
    }

    _compileSlide(slide: string, index: number): string {
        return `<section id="view-${index + 1}" class="preleganto-slide">
            ${slide}
        </section>`;
    }

    _compileMetadata(): string {
        return JSON.stringify(this._metadata);
    }
}
