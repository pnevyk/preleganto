// @flow

type Replacer = (match: string, ...groups: Array<string>) => Promise<string>;

export async function map<T, R>(values: Array<T>, callback: T => Promise<R>): Promise<Array<R>> {
    return Promise.all(values.map(value => callback(value)));
}

export async function replace(input: string, regex: RegExp, replacer: Replacer): Promise<string> {
    let execResult;

    if (regex.global) {
        let output = '';
        let lastIndex = 0;

        while ((execResult = regex.exec(input)) !== null) {
            let match = execResult[0];
            let groups = execResult.slice(1);
            let replaced = await replacer(match, ...groups);
            output += input.slice(lastIndex, execResult.index);
            output += replaced;
            lastIndex = execResult.index + match.length;
        }

        output += input.slice(lastIndex);
        return output;
    } else {
        execResult = regex.exec(input);

        if (execResult !== null) {
            let match = execResult[0];
            let groups = execResult.slice(1);
            let replaced = await replacer(match, ...groups);
            return input.slice(0, execResult.index) + replaced + input.slice(execResult.index + match.length);
        } else {
            return input;
        }
    }
}
