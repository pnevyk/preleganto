// @flow

import Prism from 'prismjs';

let loaded = [];

export function highlight(source: string, language: string): string {
    if (loaded.indexOf(language) !== -1 || supports(language)) {
        return Prism.highlight(source, Prism.languages[language]);
    } else {
        return source;
    }
}

export function supports(language: string): boolean {
    try {
        require(`prismjs/components/prism-${language}`);
        loaded.push(language);
        return true;
    } catch (ex) {
        return false;
    }
}
