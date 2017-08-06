// @flow

import type { Config } from '../config';
import type { Node, NodeMetadata } from '../syntax/parse';

type PresentationAsset = 'control.js' | 'layout.css';

import path from 'path';
import fs from 'fs';

import tipograph from 'tipograph';

import parse from '../syntax/parse';
import Template from './template';
import Theme from './theme';
import applyMacro from './macros';
import applyBlock from './blocks';
import { error, warn, IMPLEMENTATION_ERROR_MESSAGE } from '../logger';

export default class Compiler {
    _rootpath: string;

    constructor(rootpath: string) {
        this._rootpath = rootpath;
    }

    compile(content: string): string {
        const tree = parse(content);

        if (tree.name === 'Presentation') {
            const defaultMetadata = {
                title: 'Preleganto presentation',
                theme: 'default',
                ratio: '16:10'
            };

            const metadata: Config = Object.assign(defaultMetadata, getMetadata(tree.metadata));

            const template = new Template();
            const theme = new Theme(metadata.theme, this._rootpath);

            template.addCss(true, 'https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.min.css');
            template.addCss(true, 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.6.0/themes/prism-okaidia.min.css');
            template.addCss(true, 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/katex.min.css');
            template.addCss(false, this._loadRequiredAsset('layout.css'));
            template.addCss(false, theme.renderStyle());

            template.addJs(false, this._loadRequiredAsset('control.js'));
            template.addJs(true, 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.6.0/prism.min.js', {
                'data-manual': true
            });
            template.addJs(true, 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/katex.min.js');

            if (metadata.customStyle) {
                template.addCss(false, this._loadCustomAsset(metadata.customStyle));
            }

            if (metadata.customScript) {
                template.addCss(false, this._loadCustomAsset(metadata.customScript));
            }

            if (metadata.title) {
                template.setTitle(metadata.title);
            }

            template.setMetadata(metadata);

            template.addSlide(theme.renderOpening(metadata));
            tree.slides.forEach(slide => {
                template.addSlide(theme.renderContent({
                    content: slide.value.map(element => compile(element)).join('\n')
                }));
            });
            template.addSlide(theme.renderClosing(metadata));


            return template.toHtml();
        } else {
            return '';
        }
    }

    _loadRequiredAsset(asset: PresentationAsset): string {
        const filepath = path.join(__dirname, '..', 'presentation', asset);
        try {
            return fs.readFileSync(filepath).toString();
        } catch (ex) {
            warn(IMPLEMENTATION_ERROR_MESSAGE);
            return '';
        }
    }

    _loadCustomAsset(asset: string): string {
        const filepath = path.join(this._rootpath, asset);
        try {
            return fs.readFileSync(filepath).toString();
        } catch (ex) {
            error(`load error of ${filepath}: you specified non-existent custom file`);
            return '';
        }
    }
}

function getMetadata(metadata: Array<NodeMetadata>): { [key: string]: string } {
    return metadata.reduce((metadata, item) => {
        let key = item.key.replace(/-(.)/g, (match, letter) => letter.toUpperCase());
        metadata[key] = item.value;
        return metadata;
    }, {});
}

function typography(text: string): string {
    return tipograph.Replace.all(text);
}

function compile(node: Node): string {
    switch (node.name) {
        case 'Heading':
            return `<h${node.level}>${typography(node.value.map(compile).join(''))}</h${node.level}>`;
        case 'Paragraph':
            return `<p>${typography(node.value.map(compile).join(''))}</p>`;
        case 'ListItem':
            return `<li>${typography(node.value.map(compile).join(''))}</li>`;
        case 'OrderedList':
            return `<ol>${node.value.map(compile).join('')}</ol>`;
        case 'UnorderedList':
            return `<ul>${node.value.map(compile).join('')}</ul>`;
        case 'Text':
            return node.value;
        case 'TextStrong':
            return `<strong>${node.value.map(compile).join('')}</strong>`;
        case 'TextEmph':
            return `<em>${node.value.map(compile).join('')}</em>`;
        case 'TextMono':
            return `<code>${compile(node.value)}</code>`;
        case 'TextMacro':
            return typography(applyMacro(node));
        case 'SpecialBlock':
            return applyBlock(node);
        default:
            warn(IMPLEMENTATION_ERROR_MESSAGE);
            return '';
    }
}
