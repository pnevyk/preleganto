// @flow

import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';

import { replace } from '../async';

export function isLocal(filepath: string): boolean {
    return !/^https?/.test(filepath);
}

export async function readFile(filepath: string, rootpath: string = ''): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        function readFromNetwork(protocol: typeof http | typeof https, url: string) {
            let size = 0;
            let content = Buffer.alloc(size);

            protocol.get(url, res => {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    res.on('data', data => {
                        size += data.length;
                        content = Buffer.concat([content, data], size);
                    });

                    res.on('end', () => {
                        resolve(content);
                    });

                    res.on('error', err => {
                        reject(err);
                    });
                }
            });
        }

        function readFromFileSystem(fullpath: string) {
            fs.readFile(fullpath, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }

        if (/^https/.test(filepath)) {
            readFromNetwork(https, filepath);
        } else if (/^http/.test(filepath)) {
            readFromNetwork(http, filepath);
        } else if (path.isAbsolute(filepath)) {
            readFromFileSystem(filepath);
        } else if (/^https/.test(rootpath)) {
            readFromNetwork(https, `${rootpath}/${filepath}`);
        } else if (/^http/.test(rootpath)) {
            readFromNetwork(http, `${rootpath}/${filepath}`);
        } else {
            let fullpath;
            if (/^~/.test(filepath) && typeof process.env.HOME === 'string') {
                fullpath = filepath.replace(/^~/, process.env.HOME);
            } else {
                fullpath = path.join(rootpath, filepath);
            }

            readFromFileSystem(fullpath);
        }
    });
}

export async function embedFonts(cssSource: string, rootpath: string = ''): Promise<string> {
    // first, embed all @imports
    const patternImport = /@import\s+url\s*\(\s*('[^']+'|"[^"]+"|[^)]+)\s*\)\s*;/g;
    cssSource = await replace(cssSource, patternImport, async function (match, url) {
        if (url[0] === '\'' || url[1] === '"') {
            url = url.slice(1, -1);
        }

        return readFile(url, rootpath).then(content => content.toString());
    });

    // then, replace all urls in @font-faces with encoded data
    const patternFontFace = /@font-face\s*\{([^}]+)\}/g;
    const patternUrl = /url\s*\(\s*('[^']+'|"[^"]+"|[^)]+)\s*\)/g;
    cssSource = await replace(cssSource, patternFontFace, async function (match, font) {
        const replaced = await replace(font, patternUrl, async function (match, url) {
            if (url[0] === '\'' || url[1] === '"') {
                url = url.slice(1, -1);
            }

            const content = await readFile(url, rootpath);
            const encoded = content.toString('base64');
            const format = path.extname(url).slice(1);
            return `url(data:font/${format};base64,${encoded})`;
        });

        return `@font-face {${replaced}}`;
    });

    return cssSource;
}

export async function embedImage(markup: string, rootpath: string): Promise<string> {
    const patternSrc = /src="([^"]+)"/;
    return replace(markup, patternSrc, async function (match, source) {
        const content = await readFile(source, rootpath);
        const encoded = content.toString('base64');
        const format = path.extname(source).slice(1);
        return `src="data:image/${format};base64,${encoded}"`;
    });
}
