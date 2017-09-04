// @flow

import type { BuildOptions } from '../config';

import path from 'path';

import { readFile, embedFonts, isLocal } from './embedding';
import { map } from '../async';

export type Asset = { filepath: string, options: { [key: string]: string | boolean } };

export default class Template {
    _options: BuildOptions;

    _title: string;
    _css: Array<Asset>;
    _js: Array<Asset>;
    _slides: Array<string>;
    _metadata: { [key: string]: string };

    constructor(options: BuildOptions) {
        this._options = options;

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

    setMetadata(metadata: { [key: string]: mixed }): Template {
        this._metadata = Object.assign(this._metadata, metadata);
        return this;
    }

    addCss(filepath: string, options: { [key: string]: string | boolean } = {}): Template {
        this._css.push({ filepath, options });
        return this;
    }

    addJs(filepath: string, options: { [key: string]: string | boolean } = {}): Template {
        this._js.push({ filepath, options });
        return this;
    }

    addSlide(content: string): Template {
        this._slides.push(content);
        return this;
    }

    async toHtml(): Promise<string> {
        return `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>${this._title}</title>
                    ${await map(this._css, this._compileCss.bind(this)).then(styles => styles.join('\n'))}
                </head>
                <body>
                    <main class="preleganto-presentation">
                        ${this._slides.map(this._compileSlide, this).join('\n')}
                    </main>
                    <script type="text/preleganto-metadata">
                        ${this._compileMetadata()}
                    </script>
                    ${await map(this._js, this._compileJs.bind(this)).then(scripts => scripts.join('\n'))}
                </body>
            </html>
        `;
    }

    async _compileCss(css: { filepath: string, options: { [key: string ]: string | boolean } }): Promise<string> {
        if (this._options.embed || isLocal(css.filepath)) {
            const cssSource = await readFile(css.filepath).then(content => content.toString());
            return `<style type="text/css" ${this._compileExtras(css.options)}>
                ${await embedFonts(cssSource, path.dirname(css.filepath))}
            </style>`;
        } else {
            return `<link rel="stylesheet" href="${css.filepath}" ${this._compileExtras(css.options)} />`;
        }
    }

    async _compileJs(js: { filepath: string, options: { [key: string ]: string | boolean } }): Promise<string> {
        if (this._options.embed || isLocal(js.filepath)) {
            return `<script type="text/javascript" ${this._compileExtras(js.options)}>
                ${await readFile(js.filepath).then(content => content.toString())}
            </script>`;
        } else {
            return `<script type="text/javascript" src="${js.filepath}" ${this._compileExtras(js.options)}></script>`;
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
