// @flow

import type { Config, BuildOptions } from '../config';
import type { Node, NodeMetadata, NodeSlide } from '../syntax/parse';

import path from 'path';

import tipograph from 'tipograph';

import parse from '../syntax/parse';
import Template from './template';
import Theme from './theme';
import { map } from '../async';
import applyMacro from './macros';
import applyBlock from './blocks';
import { warn, IMPLEMENTATION_ERROR_MESSAGE } from '../logger';

const PRESENTATION_ASSETS_DIR = path.join(__dirname, '..', 'presentation');

export default class Compiler {
    _options: BuildOptions;

    constructor(options: BuildOptions) {
        this._options = options;
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

            const template = new Template(this._options);
            const theme = new Theme(metadata.theme, this._options);

            // external styles
            template.addCss('https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.min.css');
            template.addCss('https://cdnjs.cloudflare.com/ajax/libs/prism/1.6.0/themes/prism-okaidia.min.css');
            template.addCss('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/katex.min.css');

            // external scripts
            template.addJs('https://cdnjs.cloudflare.com/ajax/libs/prism/1.6.0/prism.min.js', {
                'data-manual': true
            });
            template.addJs('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/katex.min.js');

            // local styles
            template.addCss(path.join(PRESENTATION_ASSETS_DIR, 'layout.css'));
            template.addCss(theme.getStyle());

            // local scripts
            template.addJs(path.join(PRESENTATION_ASSETS_DIR, 'control.js'));

            // custom styles
            if (metadata.customStyle) {
                template.addCss(path.join(this._options.rootpath, metadata.customStyle));
            }

            // custom scripts
            if (metadata.customScript) {
                template.addJs(path.join(this._options.rootpath, metadata.customScript));
            }

            if (metadata.title) {
                template.setTitle(metadata.title);
            }

            // metadata
            template.setMetadata(metadata);

            // content
            template.addSlide(theme.renderOpening({ ...metadata }));

            const slidesInfo = getSlidesInfo(tree.slides);

            for (let i = 0; i < tree.slides.length; i++) {
                const content = await map(tree.slides[i].value, element => compile(element, this._options.rootpath));
                template.addSlide(theme.renderContent({
                    content: content.join('\n'),
                    ...slidesInfo[i],
                    ...metadata,
                }));
            }

            template.addSlide(theme.renderClosing({ ...metadata }));


            return template.toHtml();
        } else {
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

type SlideInfo = {
    currentSlide: number,
    slidesTotal: number,
    currentView: number,
    viewsTotal: number,
    viewsCountInSlide: number,
    currentViewInSlide: number,
};

function getSlidesInfo(slides: Array<NodeSlide>): Array<SlideInfo> {
    if (slides.length === 0) {
        return [];
    }

    let slidesTotal = 0;
    let viewsTotal = 0;

    let slidesInfo: Array<SlideInfo> = [];

    for (let slide of slides) {
        let metadata = getMetadata(slide.metadata);
        if (metadata.previousSlideNumber !== '') {
            slidesTotal++;
        }

        viewsTotal++;

        slidesInfo.push({
            currentSlide: slidesTotal,
            slidesTotal: 0,
            currentView: viewsTotal,
            viewsTotal: 0,
            currentViewInSlide: 0,
            viewsCountInSlide: 0,
        });
    }

    for (let i = 0; i < slidesInfo.length;) {
        let currentSlide = slidesInfo[i].currentSlide;
        let startView = slidesInfo[i].currentView;

        let nextSlide;
        for (nextSlide = i + 1; nextSlide < slidesInfo.length; nextSlide++) {
            if (slidesInfo[nextSlide].currentSlide !== currentSlide) {
                break;
            }
        }

        let viewsCountInSlide;
        if (nextSlide !== slidesInfo.length) {
            viewsCountInSlide = slidesInfo[nextSlide].currentView - startView;
        } else {
            viewsCountInSlide = viewsTotal - startView + 1;
        }

        for (let j = i; j < nextSlide; j++) {
            slidesInfo[j].slidesTotal = slidesTotal;
            slidesInfo[j].viewsTotal = viewsTotal;
            slidesInfo[j].currentViewInSlide = j - i + 1;
            slidesInfo[j].viewsCountInSlide = viewsCountInSlide;
        }

        i = nextSlide;
    }

    return slidesInfo;
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
