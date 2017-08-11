// @flow

import test from 'ava';

import { preleganto, run } from '../runner';

let server = null;

test.before('preleganto serve', async function () {
    server = await preleganto('serve', [
        '--input', 'test/sources/all-features.adoc'
    ]);
});

test.after.always('shutdown the server', () => {
    if (server !== null) {
        server.kill('SIGINT');
    }
});

test('go through presentation using API', async function (t) {
    await run(async function (client) {
        const { Page, Runtime } = client;

        await Promise.all([Page.enable(), Runtime.enable()]);

        async function getCurrent(): Promise<number> {
            const script = 'preleganto.getCurrent();';
            const { result } = await Runtime.evaluate({ expression: script });
            t.is(result.type, 'number', 'preleganto.getCurrent() did not return a number');
            return result.value;
        }

        async function next() {
            const script = 'preleganto.next();';
            await Runtime.evaluate({ expression: script });
        }

        await Page.navigate({ url: 'http://localhost:8080/'});
        await Page.loadEventFired();

        for (let expected of [0, 1, 2, 3, 4, 5, 6, 7]) {
            let index = await getCurrent();
            t.is(index, expected);
            await next();
        }
    });
});
