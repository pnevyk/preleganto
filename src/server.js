// @flow

import fs from 'fs';

import express from 'express';
import http from 'http';
import ws from 'ws';
import chalk from 'chalk';

import { log, newline } from './logger';

export type Options = {
    port: number
};

export default class Server {
    _options: Options;

    constructor(options: Options) {
        this._options = options;
    }

    run(filepath: string) {
        const app = express();

        app.get(/.*/, (req, res) => {
            // load file on each request since it could be rebuilt
            res.send(fs.readFileSync(filepath).toString());
        });

        const server = http.createServer(app);
        const wss = new ws.Server({ server });

        wss.on('connection', socket => {
            log('Someone has connected');
            socket.on('message', (action: string) => {
                wss.clients.forEach(client => {
                    if (client !== socket && client.readyState === ws.OPEN) {
                        client.send(action);
                    }
                });
            });
        });

        server.listen(this._options.port);
        server.on('listening', () => {
            // use server.address().port because when port given by user is invalid, server can assign different port
            const address = chalk.magenta(`http://localhost:${server.address().port}`);
            log(`Local server running at ${address}`);
            newline();
        });
    }
}
