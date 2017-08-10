// @flow

type Metadata = {
    ratio: string,
    title?: string,
    author?: string,
    theme?: string,
};

type InputEvent = 'previous' | 'next';

type ServerAction = {
    name: 'goTo',
    index: number,
} | {
    name: 'sync'
} | {
    name: 'reload'
};

(function () {
    const utils = {
        select(selector: string): ?HTMLElement {
            return document.querySelector(selector);
        },
        selectAll(selector: string): Array<HTMLElement> {
            return Array.from(document.querySelectorAll(selector));
        }
    };

    class Input {
        _handlers: Array<{ event: InputEvent, listener: () => mixed }>;

        constructor() {
            this._handlers = [];

            // disable control keys
            window.addEventListener('keypress', ev => {
                if (this._mapKeyboardEvent(ev) !== null) {
                    ev.preventDefault();
                }
            });

            // attach control keys' handlers
            // use keyup so it should get rid of accidental multiple slides moves
            window.addEventListener('keyup', ev => {
                const inputEvent = this._mapKeyboardEvent(ev);

                if (inputEvent !== null) {
                    this._emit(inputEvent);
                }
            });
        }

        on(event: InputEvent, listener: () => mixed): Input {
            this._handlers.push({ event, listener });
            return this;
        }

        _emit(event: InputEvent) {
            this._handlers.forEach(handler => {
                if (handler.event === event) {
                    handler.listener();
                }
            });
        }

        _mapKeyboardEvent(ev: KeyboardEvent): InputEvent | null {
            switch (ev.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    return 'previous';
                case 'ArrowRight':
                case 'ArrowDown':
                case ' ':
                case 'Enter':
                    return 'next';
                default:
                    return null;
            }
        }
    }

    class Preleganto {
        _metadata: Metadata;

        _slides: Array<HTMLElement>;
        _current: number;

        _input: Input;

        _socket: WebSocket | null;
        _actionQueue: Array<ServerAction>;

        constructor() {
            this._initMetadata();
            this._initSlides();
            this._initInput();
            this._initSocket();
        }

        goTo(index: number, notify: boolean = true): number {
            if (index >= this._slides.length) {
                this._current = this._slides.length - 1;
            } else if (index < 0) {
                this._current = 0;
            } else {
                this._current = index;
            }

            if (notify && this._socket !== null) {
                const action = { name: 'goTo', index };
                if (this._socket.readyState === WebSocket.OPEN) {
                    this._sendServerEvent(action);
                } else {
                    this._actionQueue.push(action);
                }
            }

            window.scrollTo(0, this._slides[this._current].offsetTop);
            window.location.hash = `view-${this._current + 1}`;
            return this._current;
        }

        previous(): number {
            return this.goTo(this._current - 1);
        }

        next(): number {
            return this.goTo(this._current + 1);
        }

        getCurrent(): number {
            return this._current;
        }

        getTotal(): number {
            return this._slides.length;
        }

        getMetadata(): Metadata {
            return this._metadata;
        }

        parseRatio(): [number, number] {
            return [
                Number(this._metadata.ratio.split(':')[0]),
                Number(this._metadata.ratio.split(':')[1])
            ];
        }

        _initMetadata() {
            let metadataScript = utils.select('script[type="text/preleganto-metadata"]');

            if (metadataScript) {
                this._metadata = JSON.parse(metadataScript.textContent);
            } else {
                console.warn('Cannot find Preleganto metadata. The presentation will run in limited mode.');
                this._metadata = {
                    ratio: '16:10'
                };
            }
        }

        _initSlides() {
            this._slides = utils.selectAll('.preleganto-slide');

            if (/view-\d+/.test(window.location.hash)) {
                this.goTo(Number(window.location.hash.match(/view-(\d+)/)[1]) - 1, false);
            } else {
                this._current = 0;
                window.location.hash = 'view-1';
            }

            // resize slides when window changed its size
            window.addEventListener('resize', ev => {
                this._setSlidesSize([ev.target.innerWidth, ev.target.innerHeight]);
                this.goTo(this._current, false);
            });

            this._setSlidesSize([window.innerWidth, window.innerHeight]);
        }

        _initInput() {
            this._input = new Input();

            this._input.on('previous', () => this.previous());
            this._input.on('next', () => this.next());
        }

        _initSocket() {
            this._actionQueue = [];
            if (window.location.host === '') {
                // presentation is served from filesystem
                this._socket = null;
            } else {
                // presentation is served from a server
                this._socket = new WebSocket(`ws://${window.location.host}`);

                this._socket.onopen = () => {
                    this._sendServerEvent({ name: 'sync' });
                    this._actionQueue.forEach(action => this._sendServerEvent(action));
                };

                this._socket.onmessage = event => {
                    const action: ServerAction = JSON.parse(String(event.data));
                    switch (action.name) {
                        case 'goTo':
                            this.goTo(action.index, false);
                            break;
                        case 'sync':
                            this._sendServerEvent({ name: 'goTo', index: this._current });
                            break;
                        case 'reload':
                            // force browser to reload presentation from server
                            window.location.reload(true);
                            break;
                    }
                };
            }
        }

        _setSlidesSize(dimensions: [number, number]) {
            let ratio = this.parseRatio();
            let width = Math.min(ratio[0] / ratio[1] * dimensions[1], dimensions[0]);
            let height = dimensions[1];

            this._slides.forEach(node => {
                node.style.width = `${width}px`;
                node.style.height = `${height}px`;
            });
        }

        _sendServerEvent(action: ServerAction) {
            if (this._socket !== null) {
                this._socket.send(JSON.stringify(action));
            }
        }
    }

    window.preleganto = new Preleganto();
})();
