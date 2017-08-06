// @flow

import type { NodeTextMacro } from '../syntax/parse';

import katex from 'katex';

import { warn } from '../logger';

export default function (macro: NodeTextMacro): string {
    switch (macro.macro) {
        case 'link':
            return link(macro);
        case 'math':
            return math(macro);
        default:
            warn(`unknown macro: ${macro.macro}`);
            return macro.value;
    }
}

function link(macro: NodeTextMacro): string {
    let title = macro.value;
    if (macro.args.length > 0) {
        title = macro.args[0];
    }

    return `<a href="${macro.value}">${title}</a>`;
}

function math(macro: NodeTextMacro): string {
    return `<span class="preleganto-inline-math">${katex.renderToString(macro.value)}</span>`;
}
