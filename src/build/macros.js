// @flow

import type { NodeTextMacro } from '../syntax/parse';

import path from 'path';
import fs from 'fs';

import katex from 'katex';

import { warn } from '../logger';

export default function (macro: NodeTextMacro, rootpath: string): string {
    switch (macro.macro) {
        case 'link':
            return link(macro, rootpath);
        case 'image':
            return image(macro, rootpath);
        case 'math':
            return math(macro);
        default:
            warn(`unknown macro: ${macro.macro}`);
            return macro.value;
    }
}

function isLocal(filepath: string): boolean {
    const protocols = /^https?/;
    return !protocols.test(filepath);
}

function link(macro: NodeTextMacro, rootpath: string): string {
    let title = macro.value;
    if (macro.args.length > 0) {
        title = macro.args[0];
    }

    let url = macro.value;
    if (isLocal(url) && !path.isAbsolute(url)) {
        url = path.join(rootpath, url);
    }

    return `<a href="${url}">${title}</a>`;
}

function image(macro: NodeTextMacro, rootpath: string): string {
    let alt = macro.value;
    let width = null;
    let height = null;

    if (macro.args.length > 0) {
        alt = macro.args[0];

        if (macro.args.length > 1) {
            width = macro.args[1];

            if (macro.args.length > 2) {
                height = macro.args[2];
            }
        }
    }

    let attributes = '';
    if (width !== null) {
        attributes += ` width="${width}"`;
    }

    if (height !== null) {
        attributes += ` height="${height}"`;
    }

    let source = macro.value;
    if (isLocal(source)) {
        let extension = path.extname(source).slice(1);
        source = fs.readFileSync(path.join(rootpath, source)).toString('base64');
        source = `data:image/${extension};base64,${source}`;
    }

    return `<img src="${source}" alt="${alt}"${attributes} />`;
}

function math(macro: NodeTextMacro): string {
    return `<span class="preleganto-inline-math">${katex.renderToString(macro.value)}</span>`;
}
