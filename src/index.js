// @flow

import path from 'path';
import fs from 'fs';

import yargs from 'yargs';
import moment from  'moment';

import Compiler from './build/compiler';
import Server from './server';
import { log, error, newline, logo } from './logger';

const commands = {
    build: 'Build a preleganto presentation into HTML file',
    serve: 'Serve a preleganto presentation on local server',
};

const options = {
    build: {
        input: {
            alias: 'i',
            required: true,
            description: 'A file with preleganto content',
        },
        output: {
            alias: 'o',
            default: 'slides.html',
            description: 'An output file',
        },
        watch: {
            alias: 'w',
            boolean: true,
            default: false,
            description: 'Watch the source file and rebuild presentation on change',
        }
    },
    serve: {
        input: {
            alias: 'i',
            required: true,
            description: 'A file with preleganto content',
        },
        port: {
            alias: 'p',
            default: 8080
        }
    }
};

function build(input: string, output: string, options: { rootpath: string }) {
    const compiler = new Compiler(options.rootpath);

    let source = '';
    try {
        source = fs.readFileSync(input).toString();
    } catch (ex) {
        error(`I can't find '${input}' :(`);
    }

    const html = compiler.compile(source);

    try {
        fs.writeFileSync(output, html);
    } catch (ex) {
        error(`I can't manage to write '${output}' :(`);
    }
}

yargs
    .version()
    .command('build', commands.build, options.build, argv => {
        const options = {
            rootpath: path.join(process.cwd(), path.dirname(argv.input))
        };

        logo();
        newline();
        log(`I will try to build '${argv.input}'`);

        build(argv.input, argv.output, options);

        log(`I managed to build '${argv.input}' so I created '${argv.output}'`);
        newline();

        if (argv.watch) {
            log(`I will watch '${argv.input}' for changes`);
            newline();

            let lastTime = moment();
            fs.watch(argv.input, eventType => {
                if (eventType === 'rename') {
                    log(`'${argv.input}' was renamed or deleted wo I will stop watch it`);
                    process.exit();
                } else if (eventType === 'change') {
                    let time = moment().format('H:mm:ss');

                    // listener is triggered twice (empty file, write content)
                    if (time !== lastTime) {
                        lastTime = time;

                        log(`(${time}) '${argv.input}' was changed so I will try to build it again`);
                        build(argv.input, argv.output, options);
                        log(`I managed to build '${argv.input}' so I created '${argv.output}'`);
                    }
                }
            });
        }
    })
    .command('serve', commands.serve, options.serve, argv => {
        const options = {
            rootpath: path.join(process.cwd(), path.dirname(argv.input))
        };

        const tempfile = path.join(options.rootpath, path.basename(argv.input, path.extname(argv.input)));

        logo();
        newline();
        log(`I will try to build '${argv.input}'`);

        build(argv.input, tempfile, options);

        log(`I managed to build '${argv.input}'`);
        log('Now I am spawning local server which will serve the presentation');

        const server = new Server({
            port: argv.port
        });

        server.run(tempfile);

        process.on('exit', () => {
            fs.unlinkSync(tempfile);
            log('Good job! I am shutting down the server now');
        });

        process.on('SIGINT', () => {
            process.exit(0);
        });
    })
    .help()
    .strict(true)
    .demandCommand()
    .recommendCommands()
    .argv;
