// @flow

import path from 'path';
import fs from 'fs';

import ejs from 'ejs';

import { error } from '../logger';

export type Renderer = ({ data: { [key: string]: string }}) => string;
type ThemeAsset = 'content.html' | 'opening.html' | 'closing.html' | 'style.css';

const DEFAULT_THEME_DIR = path.join(__dirname, '..', '..', 'themes', 'default');

export default class Theme {
    _content: Renderer;
    _opening: Renderer;
    _closing: Renderer;
    _style: string;

    constructor(identifier: string, rootpath: string) {
        let themedir;
        if (identifier[0] === '.') {
            themedir = path.join(rootpath, identifier);
        } else {
            themedir = path.join(__dirname, '..', '..', 'themes', identifier);
        }

        this._content = ejs.compile(this._loadFile(themedir, 'content.html'));
        this._opening = ejs.compile(this._loadFile(themedir, 'opening.html'));
        this._closing = ejs.compile(this._loadFile(themedir, 'closing.html'));
        this._style = this._loadFile(themedir, 'style.css');
    }

    renderContent(data: { [key: string]: string }): string {
        try {
            return this._content({ data });
        } catch (ex) {
            error('compile error of content slide: this is an error of theme author');
            return '';
        }
    }

    renderOpening(data: { [key: string]: string }): string {
        try {
            return this._opening({ data });
        } catch (ex) {
            error('compile error of content slide: this is an error of theme author');
            return '';
        }
    }

    renderClosing(data: { [key: string]: string }): string {
        try {
            return this._closing({ data });
        } catch (ex) {
            error('compile error of content slide: this is an error of theme author');
            return '';
        }
    }

    async renderStyle(): Promise<string> {
        return this._style;
    }

    _loadFile(themedir: string, asset: ThemeAsset): string {
        const filepath = path.join(themedir, asset);
        try {
            if (fs.statSync(filepath).isFile()) {
                return fs.readFileSync(filepath).toString();
            } else {
                return fs.readFileSync(DEFAULT_THEME_DIR).toString();
            }
        } catch (ex) {
            error(`load error of ${filepath}: you probably specified non-existent theme or its location`);
            return '';
        }
    }
}
