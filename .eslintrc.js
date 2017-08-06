module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "plugins": [
        "flowtype"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:flowtype/recommended"
    ],
    "parser": "babel-eslint",
    "parserOptions": {
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            4,
            { "SwitchCase": 1 }
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "curly": "error",
        "block-spacing": "error",
        "brace-style": "error",
        "eqeqeq": "error",
        "keyword-spacing": "error",
        "key-spacing": "error",
        "max-lines": ["warn", { "max": 500 }],
        "max-len": ["warn", 120],
        "no-trailing-spaces": "error",
        "eol-last": "error",
        "no-var": "error",
        "no-unused-vars": [
            "error",
            { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
        ],
        "no-console": ["error", { allow: ["warn", "error"] }],
    }
};
