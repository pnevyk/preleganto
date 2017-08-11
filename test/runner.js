// @flow

import { spawn } from 'child_process';
import util from 'util';
import fs from 'fs';

import cdp from 'chrome-remote-interface';
import chalk from 'chalk';

export async function preleganto(command: string, args: Array<string>) {
    return new Promise((resolve, reject) => {
        const proc = spawn('node', ['index.js', command, ...args]);

        proc.stdout.on('data', () => setTimeout(() => resolve(proc), 10));
        proc.stderr.on('data', error => reject({ type: 'stderr', message: error.toString() }));
        proc.on('error', error => reject(error));
    });
}

export async function run(runner: (client: any) => mixed) {
    let client;

    try {
        client = await cdp();
        await runner(client);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            const command = 'chromium --headless --disable-gpu --remote-debugging-port=9222';
            const link = 'https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md';
            process.stdout.write(`Connection to a running chrome instance ${chalk.red('failed')}.\n`);
            process.stdout.write('To execute this test, you have to first run a chrome instance\n\n');
            process.stdout.write(`Try to run ${chalk.yellow(command)}.\n`);
            process.stdout.write(`Or see ${chalk.magenta(link)}.\n\n\n`);
        } else {
            process.stdout.write(util.inspect(error, { depth: null }));
        }
    } finally {
        if (client) {
            await client.close();
        }
    }
}

export async function clean(files: Array<string>) {
    async function remove(file: string) {
        return new Promise(resolve => {
            fs.unlink(file, () => resolve());
        });
    }

    return Promise.all(files.map(file => remove(file)));
}
