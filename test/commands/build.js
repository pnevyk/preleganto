// @flow

import path from 'path';

import test from 'ava';

import { preleganto, run, clean } from '../runner';

const output = 'test/sources/all-features.html';

test.before('preleganto build', async function () {
    await preleganto('build', [
        '--input', 'test/sources/all-features.adoc',
        '--output', output
    ]);
});

test.after.always('remove built files', async function () {
    await clean([output]);
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

        await Page.navigate({ url: `file://${path.join(process.cwd(), output)}`});
        await Page.loadEventFired();

        for (let expected of [0, 1, 2, 3, 4, 5, 6, 7]) {
            let index = await getCurrent();
            t.is(index, expected);
            await next();
        }
    });
});
