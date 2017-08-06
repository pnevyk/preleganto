// @flow

import type { NodeSpecialBlock } from '../syntax/parse';

import { highlight, supports } from '../prism';
import katex from 'katex';

import { warn } from '../logger';

export default function (block: NodeSpecialBlock): string {
    switch (block.block) {
        case 'source':
            return source(block);
        case 'math':
            return math(block);
        default:
            warn(`unknown block: ${block.block}`);
            return block.value;
    }
}

function source(block: NodeSpecialBlock): string {
    if (block.args.length > 0) {
        const language = block.args[0];
        if (supports(language)) {
            const highlighted = highlight(block.value, language);
            return `<pre class="preleganto-source"><code class="language-${language}">${highlighted}</code></pre>`;
        } else {
            warn(`unsupported source code language: ${block.args[0]}`);
            return `<pre class="preleganto-source"><code>${block.value}</code></pre>`;
        }
    } else {
        return `<pre class="preleganto-source"><code>${block.value}</code></pre>`;
    }
}

function math(block: NodeSpecialBlock): string {
    const typeset = katex.renderToString(block.value, {
        displayMode: true
    });

    return `<div class="preleganto-display-math">${typeset}</div>`;
}
