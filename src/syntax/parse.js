// @flow

import type { Token } from './tokenize';

import tokenize from './tokenize';
import { error, warn, IMPLEMENTATION_ERROR_MESSAGE } from '../logger';

type State = 'ROOT' | 'SLIDE' | 'ORDERED_LIST' | 'UNORDERED_LIST';

export default function (content: string): Node {
    return parse(tokenize(content), 0, 'ROOT')[0];
}

export type NodePresentation = {
    name: 'Presentation',
    metadata: Array<NodeMetadata>,
    slides: Array<NodeSlide>,
};

export type NodeMetadata = {
    name: 'Metadata',
    key: string,
    value: string
};

export type NodeSlide = {
    name: 'Slide',
    metadata: Array<NodeMetadata>,
    value: Array<NodeContent>,
};

export type NodeHeading = {
    name: 'Heading',
    level: number,
    value: Array<NodeText>,
};

export type NodeParagraph = {
    name: 'Paragraph',
    value: Array<NodeText>,
};

export type NodeListItem = {
    name: 'ListItem',
    value: Array<NodeText>,
} | NodeOrderedList | NodeUnorderedList;

export type NodeOrderedList = {
    name: 'OrderedList',
    value: Array<NodeListItem>,
};

export type NodeUnorderedList = {
    name: 'UnorderedList',
    value: Array<NodeListItem>,
};

export type NodeContent =
    NodeHeading |
    NodeParagraph |
    NodeOrderedList |
    NodeUnorderedList |
    NodeSpecialBlock |
    NodeComment;

export type NodeText = {
    name: 'Text',
    value: string,
} | NodeTextStrong | NodeTextEmph | NodeTextMono | NodeTextMacro;

export type NodeTextStrong = {
    name: 'TextStrong',
    value: Array<NodeText>,
};

export type NodeTextEmph = {
    name: 'TextEmph',
    value: Array<NodeText>,
};

export type NodeTextMono = {
    name: 'TextMono',
    value: NodeText,
};

export type NodeTextMacro = {
    name: 'TextMacro',
    macro: string,
    value: string,
    args: Array<string>,
};

export type NodeSpecialBlock = {
    name: 'SpecialBlock',
    block: string,
    value: string,
    args: Array<string>,
};

export type NodeComment = {
    name: 'Comment',
    value: string,
};

export type Node =
    NodePresentation |
    NodeMetadata |
    NodeSlide |
    NodeContent |
    NodeListItem |
    NodeText;

const node = {
    presentation(metadata: Array<NodeMetadata>, slides: Array<NodeSlide>): NodePresentation {
        return {
            name: 'Presentation',
            metadata,
            slides
        };
    },
    metadata(key: string, value: string): NodeMetadata {
        return {
            name: 'Metadata',
            key,
            value
        };
    },
    slide(metadata: Array<NodeMetadata>, value: Array<NodeContent>): NodeSlide {
        return {
            name: 'Slide',
            metadata,
            value
        };
    },
    heading(level: number, value: Array<NodeText>): NodeHeading {
        return {
            name: 'Heading',
            level,
            value
        };
    },
    paragraph(value: Array<NodeText>): NodeParagraph {
        return {
            name: 'Paragraph',
            value
        };
    },
    orderedList(value: Array<NodeListItem>): NodeOrderedList {
        return {
            name: 'OrderedList',
            value
        };
    },
    unorderedList(value: Array<NodeListItem>): NodeUnorderedList {
        return {
            name: 'UnorderedList',
            value
        };
    },
    listItem(value: Array<NodeText>): NodeListItem {
        return {
            name: 'ListItem',
            value
        };
    },
    text(value: string): NodeText {
        return {
            name: 'Text',
            value
        };
    },
    textStrong(value: Array<NodeText>): NodeText {
        return {
            name: 'TextStrong',
            value
        };
    },
    textEmph(value: Array<NodeText>): NodeText {
        return {
            name: 'TextEmph',
            value
        };
    },
    textMono(value: NodeText): NodeText {
        return {
            name: 'TextMono',
            value
        };
    },
    textMacro(macro: string, value: string, args: Array<string>): NodeText {
        return {
            name: 'TextMacro',
            macro,
            value,
            args
        };
    },
    specialBlock(block: string, value: string, args: Array<string>): NodeSpecialBlock {
        return {
            name: 'SpecialBlock',
            block,
            value,
            args
        };
    },
    comment(value: string): NodeComment {
        return {
            name: 'Comment',
            value
        };
    }
};

function parse(tokens: Array<Token>, pointer: number, state: State, level: number = 0): [Node, number] {
    if (state === 'ROOT') {
        let metadata = [];
        while (pointer < tokens.length && tokens[pointer].name === 'Metadata') {
            metadata.push(node.metadata(tokens[pointer].key, tokens[pointer].value));
            pointer++;
        }

        let slides = [];
        if (pointer < tokens.length) {
            if (tokens[pointer].name === 'SlideSeparator') {
                if (pointer < tokens.length - 1) {
                    while (pointer < tokens.length) {
                        let slide;
                        [slide, pointer] = parse(tokens, pointer + 1, 'SLIDE');

                        if (slide.name === 'Slide') {
                            slides.push(slide);
                        } else {
                            warn(IMPLEMENTATION_ERROR_MESSAGE);
                        }
                    }
                }
            } else {
                error('syntax error: a slide separator must follow presentation metadata');
            }
        }

        return [node.presentation(metadata, slides), pointer];
    } else if (state === 'SLIDE') {
        let metadata = [];
        let value = [];
        let parsed;

        let token = tokens[pointer];
        while (pointer < tokens.length && token.name !== 'SlideSeparator') {
            if (token.name === 'Metadata') {
                metadata.push(node.metadata(token.key, token.value));
            } else if (token.name === 'Heading') {
                value.push(node.heading(token.level, parseInline(token.value)));
            } else if (token.name === 'Paragraph') {
                value.push(node.paragraph(parseInline(token.value)));
            } else if (token.name === 'OrderedListItem') {
                if (token.level === 1) {
                    [parsed, pointer] = parse(tokens, pointer, 'ORDERED_LIST', 1);

                    if (parsed.name === 'OrderedList') {
                        value.push(parsed);
                    } else {
                        warn(IMPLEMENTATION_ERROR_MESSAGE);
                    }
                } else {
                    error('syntax error: list must start at the first level');
                }
            } else if (token.name === 'UnorderedListItem') {
                if (token.level === 1) {
                    [parsed, pointer] = parse(tokens, pointer, 'UNORDERED_LIST', 1);

                    if (parsed.name === 'UnorderedList') {
                        value.push(parsed);
                    } else {
                        warn(IMPLEMENTATION_ERROR_MESSAGE);
                    }
                } else {
                    error('syntax error: list must start at the first level');
                }
            } else if (token.name === 'SpecialBlock') {
                value.push(node.specialBlock(token.block, token.value, token.args));
            } else if (token.name === 'Comment') {
                value.push(node.comment(token.value));
            } else {
                warn(`unimplemented token: ${token.name}`);
            }

            token = tokens[++pointer];
        }

        return [node.slide(metadata, value), pointer];
    } else if (state === 'ORDERED_LIST') {
        let items = [];
        let token = tokens[pointer];
        while (pointer < tokens.length) {
            let item;

            if (token.name === 'OrderedListItem') {
                if (token.level > level) {
                    [item, pointer] = parse(tokens, pointer, 'ORDERED_LIST', token.level);

                    if (item.name === 'OrderedList') {
                        items.push(item);
                    } else {
                        warn(IMPLEMENTATION_ERROR_MESSAGE);
                    }
                } else if (token.level < level) {
                    pointer--;
                    break;
                } else {
                    items.push(node.listItem(parseInline(token.value)));
                }
            } else if (token.name === 'UnorderedListItem') {
                if (token.level > level) {
                    [item, pointer] = parse(tokens, pointer, 'UNORDERED_LIST', token.level);

                    if (item.name === 'UnoderedList') {
                        items.push(item);
                    } else {
                        warn(IMPLEMENTATION_ERROR_MESSAGE);
                    }
                } else {
                    pointer--;
                    break;
                }
            } else {
                pointer--;
                break;
            }

            token = tokens[++pointer];
        }

        return [node.orderedList(items), pointer];
    } else if (state === 'UNORDERED_LIST') {
        let items = [];
        let token = tokens[pointer];
        while (pointer < tokens.length) {
            let item;

            if (token.name === 'UnorderedListItem') {
                if (token.level > level) {
                    [item, pointer] = parse(tokens, pointer, 'UNORDERED_LIST', token.level);

                    if (item.name === 'UnorderedList') {
                        items.push(item);
                    } else {
                        warn(IMPLEMENTATION_ERROR_MESSAGE);
                    }
                } else if (token.level < level) {
                    pointer--;
                    break;
                } else {
                    items.push(node.listItem(parseInline(token.value)));
                }
            } else if (token.name === 'OrderedListItem') {
                if (token.level > level) {
                    [item, pointer] = parse(tokens, pointer, 'ORDERED_LIST', token.level);

                    if (item.name === 'OrderedList') {
                        items.push(item);
                    } else {
                        warn(IMPLEMENTATION_ERROR_MESSAGE);
                    }
                } else {
                    pointer--;
                    break;
                }
            } else {
                pointer--;
                break;
            }

            token = tokens[++pointer];
        }

        return [node.unorderedList(items), pointer];
    } else {
        warn(IMPLEMENTATION_ERROR_MESSAGE);
        return [node.presentation([], []), pointer + 1];
    }
}

const REGEX_INLINE_MACRO = /^([A-Za-z]+):([^[\s][^[]+)\[([^\]]*)\]/;
const REGEX_INLINE_PLAIN = /^([^*_`]+)/;
const REGEX_INLINE_INNER_STRONG = /^\*\*(?!\s)([^(?:**)]+)\*\*/;
const REGEX_INLINE_INNER_EMPH = /^__(?!\s)([^(?:__)]+)__/;
const REGEX_INLINE_INNER_MONO = /^``(?!\s)([^(?:``)]+)``/;
const REGEX_INLINE_STRONG = /^\*(?!\s)([^*]*\S)\*/;
const REGEX_INLINE_EMPH = /^_(?!\s)([^_]*\S)_/;
const REGEX_INLINE_MONO = /^`(?!\s)([^`]*\S)`/;

function parseInline(value: string): Array<any> {
    let output = [];

    while (value !== '') {
        if (REGEX_INLINE_MACRO.test(value)) {
            value = value.replace(REGEX_INLINE_MACRO, (match: string, macro: string, value: string, args: string) => {
                output.push(node.textMacro(macro, value, args.split(',').map(arg => arg.trim())));
                return '';
            });
        } else if (REGEX_INLINE_INNER_STRONG.test(value)) {
            value = value.replace(REGEX_INLINE_INNER_STRONG, (match: string, value: string) => {
                output.push(node.textStrong(parseInline(value)));
                return '';
            });
        } else if (REGEX_INLINE_INNER_EMPH.test(value)) {
            value = value.replace(REGEX_INLINE_INNER_EMPH, (match: string, value: string) => {
                output.push(node.textEmph(parseInline(value)));
                return '';
            });
        } else if (REGEX_INLINE_INNER_MONO.test(value)) {
            value = value.replace(REGEX_INLINE_INNER_MONO, (match: string, value: string) => {
                output.push(node.textMono(node.text(value)));
                return '';
            });
        } else if (REGEX_INLINE_STRONG.test(value)) {
            value = value.replace(REGEX_INLINE_STRONG, (match: string, value: string) => {
                output.push(node.textStrong(parseInline(value)));
                return '';
            });
        } else if (REGEX_INLINE_EMPH.test(value)) {
            value = value.replace(REGEX_INLINE_EMPH, (match: string, value: string) => {
                output.push(node.textEmph(parseInline(value)));
                return '';
            });
        } else if (REGEX_INLINE_MONO.test(value)) {
            value = value.replace(REGEX_INLINE_MONO, (match: string, value: string) => {
                output.push(node.textMono(node.text(value)));
                return '';
            });
        } else if (REGEX_INLINE_PLAIN.test(value)) {
            const regex = /[A-Za-z]+:[^[\s][^[]+\[[^\]]*\]/;

            // NOTE: there must be a better way how to handle macros
            if (regex.test(value)) {
                let macroLocation = value.indexOf(regex.exec(value)[0]);
                let plainLength = REGEX_INLINE_PLAIN.exec(value)[0].length;

                if (plainLength < macroLocation) {
                    value = value.replace(REGEX_INLINE_PLAIN, (match: string, value: string) => {
                        output.push(node.text(value));
                        return '';
                    });
                } else {
                    output.push(node.text(value.slice(0, macroLocation)));
                    value = value.slice(macroLocation);
                }
            } else {
                value = value.replace(REGEX_INLINE_PLAIN, (match: string, value: string) => {
                    output.push(node.text(value));
                    return '';
                });
            }
        } else {
            warn(IMPLEMENTATION_ERROR_MESSAGE);
        }
    }

    return output;
}
