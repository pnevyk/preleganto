// @flow

import type { BuildOptions } from '../config';

import path from 'path';
import fs from 'fs';

import ejs from 'ejs';

import { warn, error } from '../logger';

export type Renderer = ({ data: { [key: string]: mixed }}) => string;
type Template = 'content.html' | 'opening.html' | 'closing.html';

const DEFAULT_THEME_DIR = path.join(__dirname, '..', '..', 'themes', 'default');

export default class Theme {
    _options: BuildOptions;
    _style: string;

    _content: Renderer;
    _opening: Renderer;
    _closing: Renderer;

    constructor(identifier: string, options: BuildOptions) {
        this._options = options;

        let themedir;
        if (identifier[0] === '.') {
            themedir = path.join(options.rootpath, identifier);
        } else {
            themedir = path.join(__dirname, '..', '..', 'themes', identifier);
        }

        if (fs.statSync(path.join(themedir, 'style.css')).isFile()) {
            this._style = path.join(themedir, 'style.css');
        } else {
            warn('style not found: theme style was not found so fallback to default theme will be used');
            this._style = path.join(DEFAULT_THEME_DIR, 'style.css');
        }

        this._content = ejs.compile(this._loadTemplate(themedir, 'content.html'));
        this._opening = ejs.compile(this._loadTemplate(themedir, 'opening.html'));
        this._closing = ejs.compile(this._loadTemplate(themedir, 'closing.html'));
    }

    renderContent(data: { [key: string]: mixed }): string {
        try {
            return this._content({ data });
        } catch (ex) {
            error('compile error of content slide: this is an error of theme author');
            return '';
        }
    }

    renderOpening(data: { [key: string]: mixed }): string {
        try {
            return this._opening({ data });
        } catch (ex) {
            error('compile error of content slide: this is an error of theme author');
            return '';
        }
    }

    renderClosing(data: { [key: string]: mixed }): string {
        try {
            return this._closing({ data });
        } catch (ex) {
            error('compile error of content slide: this is an error of theme author');
            return '';
        }
    }

    getStyle(): string {
        return this._style;
    }

    _loadTemplate(themedir: string, asset: Template): string {
        const filepath = path.join(themedir, asset);
        try {
            if (fs.statSync(filepath).isFile()) {
                return fs.readFileSync(filepath).toString();
            } else {
                return fs.readFileSync(path.join(DEFAULT_THEME_DIR, asset)).toString();
            }
        } catch (ex) {
            error(`load error of ${filepath}: you probably specified non-existent theme or its location`);
            return '';
        }
    }
}
