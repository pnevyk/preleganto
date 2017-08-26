// @flow

import type { Config } from '../config';
import type { Node, NodeMetadata } from '../syntax/parse';

type PresentationAsset = 'control.js' | 'layout.css';

import path from 'path';

import tipograph from 'tipograph';

import parse from '../syntax/parse';
import Template from './template';
import Theme from './theme';
import { read } from './files';
import applyMacro from './macros';
import applyBlock from './blocks';
import { error, warn, IMPLEMENTATION_ERROR_MESSAGE } from '../logger';

export default class Compiler {
    _rootpath: string;

    constructor(rootpath: string) {
        this._rootpath = rootpath;
    }

    async compile(content: string): Promise<string> {
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

            template.addCss(await read('https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.min.css'));
            template.addCss(
                await read('https://cdnjs.cloudflare.com/ajax/libs/prism/1.6.0/themes/prism-okaidia.min.css')
            );
            template.addCss(await read('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/katex.min.css'));

            template.addJs(await read('https://cdnjs.cloudflare.com/ajax/libs/prism/1.6.0/prism.min.js'), {
                'data-manual': true
            });

            template.addCss(await this._loadRequiredAsset('layout.css'));

            template.addCss(await theme.renderStyle());

            template.addJs(await this._loadRequiredAsset('control.js'));

            template.addJs(await read('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/katex.min.js'));

            if (metadata.customStyle) {
                template.addCss(await this._loadCustomAsset(metadata.customStyle));
            }

            if (metadata.customScript) {
                template.addCss(await this._loadCustomAsset(metadata.customScript));
            }

            if (metadata.title) {
                template.setTitle(metadata.title);
            }

            template.setMetadata(metadata);

            template.addSlide(theme.renderOpening(metadata));

            for (let slide of tree.slides) {
                const content = await mapAsync(slide.value, element => compile(element, this._rootpath));
                template.addSlide(theme.renderContent({
                    content: content.join('\n')
                }));
            }

            template.addSlide(theme.renderClosing(metadata));


            return Promise.resolve(template.toHtml());
        } else {
            return Promise.resolve('');
        }
    }

    async _loadRequiredAsset(asset: PresentationAsset): Promise<string> {
        try {
            return await read(asset, path.join(__dirname, '..', 'presentation'));
        } catch (ex) {
            warn(IMPLEMENTATION_ERROR_MESSAGE);
            return '';
        }
    }

    async _loadCustomAsset(asset: string): Promise<string> {
        const filepath = path.join(this._rootpath, asset);
        try {
            return await read(asset, this._rootpath);
        } catch (ex) {
            error(`load error of ${filepath}: you specified non-existent custom file`);
            return '';
        }
    }
}

async function mapAsync<T, R>(values: Array<T>, callback: T => Promise<R>): Promise<Array<R>> {
    return Promise.all(values.map(value => callback(value)));
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

async function compile(node: Node, rootpath: string): Promise<string> {
    let temp;

    switch (node.name) {
        case 'Heading':
            temp = await mapAsync(node.value, node => compile(node, rootpath));
            return `<h${node.level}>${typography(temp.join(''))}</h${node.level}>`;
        case 'Paragraph':
            temp = await mapAsync(node.value, node => compile(node, rootpath));
            return `<p>${typography(temp.join(''))}</p>`;
        case 'ListItem':
            temp = await mapAsync(node.value, node => compile(node, rootpath));
            return `<li>${typography(temp.join(''))}</li>`;
        case 'OrderedList':
            temp = await mapAsync(node.value, node => compile(node, rootpath));
            return `<ol>${typography(temp.join(''))}</ol>`;
        case 'UnorderedList':
            temp = await mapAsync(node.value, node => compile(node, rootpath));
            return `<ul>${typography(temp.join(''))}</ul>`;
        case 'Text':
            return node.value;
        case 'TextStrong':
            temp = await mapAsync(node.value, node => compile(node, rootpath));
            return `<strong>${typography(temp.join(''))}</strong>`;
        case 'TextEmph':
            temp = await mapAsync(node.value, node => compile(node, rootpath));
            return `<em>${typography(temp.join(''))}</em>`;
        case 'TextMono':
            temp = await compile(node.value, rootpath);
            return `<code>${temp}</code>`;
        case 'TextMacro':
            temp = await applyMacro(node, rootpath);
            return typography(temp);
        case 'SpecialBlock':
            return applyBlock(node);
        default:
            warn(IMPLEMENTATION_ERROR_MESSAGE);
            return '';
    }
}
