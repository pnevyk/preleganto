// @flow

import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';

export async function read(filepath: string, rootpath: string = ''): Promise<string> {
    return new Promise((resolve, reject) => {
        if (/^https/.test(filepath)) {
            let content = '';

            https.get(filepath, res => {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    res.on('data', data => {
                        content += data.toString();
                    });

                    res.on('end', () => {
                        resolve(content);
                    });

                    res.on('error', err => {
                        reject(err);
                    });
                }
            });
        } else if (/^http/.test(filepath)) {
            let content = '';

            http.get(filepath, res => {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    res.on('data', data => {
                        content += data.toString();
                    });

                    res.on('end', () => {
                        resolve(content);
                    });

                    res.on('error', err => {
                        reject(err);
                    });
                }
            });
        } else if (path.isAbsolute(filepath)) {
            fs.readFile(filepath, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.toString());
                }
            });
        } else {
            if (/^~/.test(filepath) && typeof process.env.HOME === 'string') {
                filepath = filepath.replace(/^~/, process.env.HOME);
            }

            fs.readFile(path.join(rootpath, filepath), (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.toString());
                }
            });
        }
    });
}
