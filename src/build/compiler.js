// @flow

import type { Config } from '../config';
import type { Node, NodeMetadata } from '../syntax/parse';

type PresentationAsset = 'control.js' | 'layout.css';

import path from 'path';

import tipograph from 'tipograph';

import parse from '../syntax/parse';
import Template from './template';
import Theme from './theme';
import { readFile, embedFonts } from './embedding';
import { map } from '../async';
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

            template.addCss(
                await this._loadExternalCss('https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.min.css')
            );

            template.addCss(
                await this._loadExternalCss(
                    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.6.0/themes/prism-okaidia.min.css'
                )
            );

            template.addCss(
                await this._loadExternalCss('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/katex.min.css')
            );

            template.addJs(
                await this._loadExternalJs('https://cdnjs.cloudflare.com/ajax/libs/prism/1.6.0/prism.min.js'),
                { 'data-manual': true }
            );

            template.addCss(await this._loadRequiredAsset('layout.css'));

            template.addCss(await embedFonts(await theme.renderStyle(), theme.getThemedir()));

            template.addJs(await this._loadRequiredAsset('control.js'));

            template.addJs(
                await this._loadExternalJs('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/katex.min.js')
            );

            if (metadata.customStyle) {
                template.addCss(await embedFonts(await this._loadCustomAsset(metadata.customStyle), this._rootpath));
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
                const content = await map(slide.value, element => compile(element, this._rootpath));
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
            return readFile(asset, path.join(__dirname, '..', 'presentation')).then(content => content.toString());
        } catch (ex) {
            warn(IMPLEMENTATION_ERROR_MESSAGE);
            return '';
        }
    }

    async _loadCustomAsset(asset: string): Promise<string> {
        const filepath = path.join(this._rootpath, asset);
        try {
            return readFile(asset, this._rootpath).then(content => content.toString());
        } catch (ex) {
            error(`load error of ${filepath}: you specified non-existent custom file`);
            return '';
        }
    }

    async _loadExternalCss(url: string): Promise<string> {
        try {
            const rootpath = path.dirname(url);
            return embedFonts(await readFile(url, rootpath).then(content => content.toString()), rootpath);
        } catch (ex) {
            error(`load error of ${url}: there may be a problem with your internet connection`);
            return '';
        }
    }

    async _loadExternalJs(url: string): Promise<string> {
        try {
            return readFile(url).then(content => content.toString());
        } catch (ex) {
            error(`load error of ${url}: there may be a problem with your internet connection`);
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

async function compile(node: Node, rootpath: string): Promise<string> {
    let temp;

    switch (node.name) {
        case 'Heading':
            temp = await map(node.value, node => compile(node, rootpath));
            return `<h${node.level}>${typography(temp.join(''))}</h${node.level}>`;
        case 'Paragraph':
            temp = await map(node.value, node => compile(node, rootpath));
            return `<p>${typography(temp.join(''))}</p>`;
        case 'ListItem':
            temp = await map(node.value, node => compile(node, rootpath));
            return `<li>${typography(temp.join(''))}</li>`;
        case 'OrderedList':
            temp = await map(node.value, node => compile(node, rootpath));
            return `<ol>${typography(temp.join(''))}</ol>`;
        case 'UnorderedList':
            temp = await map(node.value, node => compile(node, rootpath));
            return `<ul>${typography(temp.join(''))}</ul>`;
        case 'Text':
            return node.value;
        case 'TextStrong':
            temp = await map(node.value, node => compile(node, rootpath));
            return `<strong>${typography(temp.join(''))}</strong>`;
        case 'TextEmph':
            temp = await map(node.value, node => compile(node, rootpath));
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
