// @flow

export default class Input {
    _lines: Array<string>;
    _currentLine: number;

    constructor(input: string) {
        this._lines = input.split(/\r?\n/);
        this._currentLine = 0;
    }

    peekLine(): string {
        return this._lines[this._currentLine];
    }

    nextLine(): string {
        return this._lines[this._currentLine++];
    }

    eof(): boolean {
        return this._currentLine === this._lines.length;
    }

    current(): number {
        return this._currentLine;
    }
}
