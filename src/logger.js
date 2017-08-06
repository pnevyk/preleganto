// @flow

import chalk from 'chalk';

export const IMPLEMENTATION_ERROR_MESSAGE = 'This is an implementation error. I will try to go on but the results are '
    + 'undefined. Please fill an issue on https://github.com/pnevyk/preleganto.';

export function log(message: string) {
    process.stdout.write(`${chalk.cyan('[preleganto]')} ${chalk.gray(message)}\n`);
}

export function warn(message: string) {
    process.stderr.write(`${chalk.cyan(`[preleganto ${chalk.yellow('warning')}]`)} ${chalk.gray(message)}\n`);
}

export function error(message: string) {
    process.stderr.write(`${chalk.cyan(`[preleganto ${chalk.red('error')}]`)} ${chalk.gray(message)}\n`);
    process.exit(1);
}

export function newline(error: boolean = false) {
    if (error) {
        process.stderr.write('\n');
    } else {
        process.stdout.write('\n');
    }
}

export function logo() {
    /* eslint-disable */
    const text =
        "  _____          _                        _        \n" +
        " |  __ \\        | |                      | |       \n" +
        " | |__) | __ ___| | ___  __ _  __ _ _ __ | |_ ___  \n" +
        " |  ___/ '__/ _ \\ |/ _ \\/ _` |/ _` | '_ \\| __/ _ \\ \n" +
        " | |   | | |  __/ |  __/ (_| | (_| | | | | || (_) |\n" +
        " |_|   |_|  \\___|_|\\___|\\__, |\\__,_|_| |_|\\__\\___/ \n" +
        "                         __/ |                     \n" +
        "                        |___/                      \n";
    /* eslint-enable */

    process.stdout.write(`\n${chalk.gray(text)}\n`);
}
