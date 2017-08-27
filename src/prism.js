// @flow

import Prism from 'prismjs';

let loaded = [];

export function highlight(source: string, language: string): string {
    language = mapAliases(language);
    if (loaded.indexOf(language) !== -1 || supports(language)) {
        return Prism.highlight(source, Prism.languages[language]);
    } else {
        return source;
    }
}

export function supports(language: string): boolean {
    language = mapAliases(language);
    try {
        require(`prismjs/components/prism-${language}`);
        loaded.push(language);
        return true;
    } catch (ex) {
        return false;
    }
}

export function mapAliases(language: string): string {
    switch (language) {
        case 'js':
            return 'javascript';
        default:
            return language;
    }
}
