// @flow

import Input from './input';
import { error, warn, IMPLEMENTATION_ERROR_MESSAGE } from '../logger';

export default function (content: string): Array<Token> {
    return tokenize(content);
}

export type TokenMetadata = {
    name: 'Metadata',
    key: string,
    value: string,
};

export type TokenSlideSepataror = {
    name: 'SlideSeparator',
};

export type TokenHeading = {
    name: 'Heading',
    level: number,
    value: string
};

export type TokenOrderedListItem = {
    name: 'OrderedListItem',
    level: number,
    value: string,
};

export type TokenUnorderedListItem = {
    name: 'UnorderedListItem',
    level: number,
    value: string,
};

export type TokenLayoutBlockOpen = {
    name: 'LayoutBlockOpen',
    block: string,
};

export type TokenLayoutBlockClose = {
    name: 'LayoutBlockOpen',
};

export type TokenSpecialBlock = {
    name: 'SpecialBlock',
    block: string,
    value: string,
    args: Array<string>,
};

export type TokenParagraph = {
    name: 'Paragraph',
    value: string,
};

export type TokenComment = {
    name: 'Comment',
    value: string,
};

export type Token =
    TokenMetadata |
    TokenSlideSepataror |
    TokenHeading |
    TokenOrderedListItem |
    TokenUnorderedListItem |
    TokenLayoutBlockOpen |
    TokenLayoutBlockClose |
    TokenSpecialBlock |
    TokenParagraph |
    TokenComment;

const token = {
    metadata(key: string, value: string): TokenMetadata {
        return {
            name: 'Metadata',
            key,
            value
        };
    },
    slideSeparator(): TokenSlideSepataror {
        return {
            name: 'SlideSeparator'
        };
    },
    heading(level: number, value: string): TokenHeading {
        return {
            name: 'Heading',
            level,
            value
        };
    },
    orderedListItem(level: number, value: string): TokenOrderedListItem {
        return {
            name: 'OrderedListItem',
            level,
            value
        };
    },
    unorderedListItem(level: number, value: string): TokenUnorderedListItem {
        return {
            name: 'UnorderedListItem',
            level,
            value
        };
    },
    layoutBlockOpen(block: string): TokenLayoutBlockOpen {
        return {
            name: 'LayoutBlockOpen',
            block
        };
    },
    layoutBlockClose(): TokenLayoutBlockClose {
        return {
            name: 'LayoutBlockOpen'
        };
    },
    specialBlock(block: string, value: string, args: Array<string>): TokenSpecialBlock {
        return {
            name: 'SpecialBlock',
            block,
            value,
            args
        };
    },
    paragraph(value: string): TokenParagraph {
        return {
            name: 'Paragraph',
            value
        };
    },
    comment(value: string): TokenComment {
        return {
            name: 'Comment',
            value
        };
    }
};

const REGEX_PLAIN_LINE = /^((?:[^:\-=.[*']|(?:\*(?![\s*]))).*)$/;
const REGEX_METADATA = /^:([^:]+):\s*(.*)$/;
const REGEX_SLIDE_SEPARATOR = /^'''$/;
const REGEX_HEADING = /^(={1,6})\s+(.*)$/;
const REGEX_ORDERED_LIST_ITEM = /^(\.{1,5})\s+(.*)$/;
const REGEX_UNORDERED_LIST_ITEM = /^(\*{1,5})\s+(.*)$/;
const REGEX_BLOCK_HEADER = /^\[(.+)\]$/;
const REGEX_LAYOUT_BLOCK_MARKER = /^--$/;
const REGEX_SPECIAL_BLOCK_MARKER = /^----$/;
const REGEX_INLINE_COMMENT = /^\/\/.*$/;

function tokenize(content: string): Array<Token> {
    const input = new Input(content);
    let tokens = [];

    while (!input.eof()) {
        let line = input.nextLine();

        if (line === '') {
            continue;
        } else if (REGEX_METADATA.test(line)) {
            const match = REGEX_METADATA.exec(line);
            tokens.push(token.metadata(match[1], match[2]));

        } else if (REGEX_SLIDE_SEPARATOR.test(line)) {
            tokens.push(token.slideSeparator());

        } else if (REGEX_HEADING.test(line)) {
            const match = REGEX_HEADING.exec(line);
            tokens.push(token.heading(match[1].length, match[2]));

        } else if (REGEX_ORDERED_LIST_ITEM.test(line)) {
            const match = REGEX_ORDERED_LIST_ITEM.exec(line);
            const level = Number(match[1].length);
            const value = match[2] + eatPlainLines(input);
            tokens.push(token.orderedListItem(level, value));

        } else if (REGEX_UNORDERED_LIST_ITEM.test(line)) {
            const match = REGEX_UNORDERED_LIST_ITEM.exec(line);
            const level = Number(match[1].length);
            const value = match[2] + eatPlainLines(input);
            tokens.push(token.unorderedListItem(level, value));

        } else if (REGEX_BLOCK_HEADER.test(line)) {
            const match = REGEX_BLOCK_HEADER.exec(line);
            line = input.nextLine();
            if (REGEX_LAYOUT_BLOCK_MARKER.test(line)) {
                tokens.push(token.layoutBlockOpen(match[1]));
            } else if (REGEX_SPECIAL_BLOCK_MARKER.test(line)) {
                let value = '';
                while (!REGEX_SPECIAL_BLOCK_MARKER.test((line = input.nextLine())) && !input.eof()) {
                    value += line + '\n';
                }

                let args = match[1].split(',').map(arg => arg.trim());
                tokens.push(token.specialBlock(args[0], value, args.slice(1)));
            } else {
                error(`syntax error on line ${input.current()}: block header requires a block opening marker`);
            }

        } else if (REGEX_LAYOUT_BLOCK_MARKER.test(line)) {
            tokens.push(token.layoutBlockClose());

        } else if (REGEX_INLINE_COMMENT.test(line)) {
            const value = line.slice(2);
            tokens.push(token.comment(value));

        } else if (REGEX_PLAIN_LINE.test(line)) {
            const value = line + eatPlainLines(input);
            tokens.push(token.paragraph(value));

        } else {
            warn(IMPLEMENTATION_ERROR_MESSAGE);
        }
    }

    return tokens;
}

function eatPlainLines(input: Input): string {
    let value = ' ';
    do {
        let line = input.peekLine();
        if (REGEX_PLAIN_LINE.test(line)) {
            line = input.nextLine();
            value += ' ' + line;
        } else {
            return value === ' ' ? '' : value;
        }
    } while (!input.eof());

    return value;
}
