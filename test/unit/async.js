// @flow

import test from 'ava';
import { map, replace } from '../../src/async';

test('async.map', async t => {
    const result = await map(['foo', 'bar'], value => Promise.resolve(value.toUpperCase()));
    t.deepEqual(result, ['FOO', 'BAR']);
});

test('async.replace', async t => {
    const pattern = /a(.)/;
    const patternGlobal = /a(.)/g;
    const replacer = (match, group) => Promise.resolve(group.toUpperCase());

    t.is(await replace('acab', pattern, replacer), 'Cab');
    t.is(await replace('acab', patternGlobal, replacer), 'CB');

    t.is(await replace('dcab', pattern, replacer), 'dcB');
    t.is(await replace('dcab', patternGlobal, replacer), 'dcB');

    t.is(await replace('dc', pattern, replacer), 'dc');
    t.is(await replace('dc', patternGlobal, replacer), 'dc');
});
