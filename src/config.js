// @flow

export type Config = {
    title: string,
    author?: string,
    theme: string,
    ratio: string,
    customStyle?: string,
    customScript?: string,
};

export type BuildOptions = {
    rootpath: string,
    embed: boolean
};
