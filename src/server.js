// @flow

import fs from 'fs';
import os from 'os';

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
    _server: http.Server;
    _wss: ws.Server;

    constructor(options: Options) {
        this._options = options;
    }

    run(filepath: string) {
        const app = express();

        app.get(/.*/, (req, res) => {
            // load file on each request since it could be rebuilt
            res.send(fs.readFileSync(filepath).toString());
        });

        this._server = http.createServer(app);
        this._wss = new ws.Server({ server: this._server });

        this._wss.on('connection', socket => {
            log('Someone has connected');
            socket.on('message', (action: string) => {
                this._wss.clients.forEach(client => {
                    if (client !== socket && client.readyState === ws.OPEN) {
                        client.send(action);
                    }
                });
            });
        });

        this._server.listen(this._options.port);
        this._server.on('listening', () => {
            // use server.address().port because when port given by user is invalid, server can assign different port
            const port = this._server.address().port;

            const local = chalk.magenta(`http://localhost:${port}`);
            log(`Local server is running at ${local}`);
            newline();

            const interfaces = os.networkInterfaces();
            const remotes = Object.keys(interfaces)
                .reduce((all, item) => {
                    // filter only ipv4 addresses, because it's not quite common to type ipv6 manually yet
                    const addresses = interfaces[item]
                        .filter(network => !network.internal && network.family === 'IPv4')
                        .map(network => network.address);

                    return all.concat(...addresses);
                }, []);

            if (remotes.length > 0) {
                log('For connecting from a remote device, try addresses below:');

                for (let remote of remotes) {
                    log(chalk.magenta(`http://${remote}:${port}`));
                }

                newline();
            }
        });
    }

    reloadClients() {
        const action = JSON.stringify({ name: 'reload' });

        log('I am asking all connected clients to reload');
        this._wss.clients.forEach(client => {
            if (client.readyState === ws.OPEN) {
                client.send(action);
            }
        });
    }
}
