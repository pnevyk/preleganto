// @flow

(function () {
    type ServerAction = {
        name: 'goTo',
        index: number,
    } | {
        name: 'sync'
    };

    function select(selector: string): ?HTMLElement {
        return document.querySelector(selector);
    }

    function selectAll(selector: string): Array<HTMLElement> {
        return Array.from(document.querySelectorAll(selector));
    }

    const LEFT = 37;
    const UP = 38;
    const RIGHT = 39;
    const DOWN = 40;
    const SPACE = 32;
    const ENTER = 13;

    const CONTROL_KEYS = [LEFT, UP, RIGHT, DOWN, SPACE, ENTER];

    function mapKey(e) {
        if (e.keyCode === 0) {
            return e.charCode;
        } else {
            return e.keyCode;
        }
    }

    class Preleganto {
        _metadata: { [key: string]: string };
        _slides: Array<HTMLElement>;
        _current: number;

        _socket: WebSocket;
        _actionQueue: Array<ServerAction>;

        constructor() {
            let metadataScript = select('script[type="text/preleganto-metadata"]');

            if (metadataScript) {
                this._metadata = JSON.parse(metadataScript.textContent);
            } else {
                console.warn('Cannot find Preleganto metadata. The presentation will run in limited mode.');
                this._metadata = {
                    ratio: '16:10'
                };
            }

            this._slides = selectAll('.preleganto-slide');

            this._actionQueue = [];
            this._socket = new WebSocket(`ws://${window.location.host}`);

            if (/view-\d+/.test(window.location.hash)) {
                this.goTo(Number(window.location.hash.match(/view-(\d+)/)[1]) - 1, false);
            } else {
                this._current = 0;
                window.location.hash = 'view-1';
            }

            this._attachEventHandlers();
            this._setSlidesSize([window.innerWidth, window.innerHeight]);
        }

        goTo(index: number, notify: boolean = true): number {
            if (index >= this._slides.length) {
                this._current = this._slides.length - 1;
            } else if (index < 0) {
                this._current = 0;
            } else {
                this._current = index;
            }

            if (notify) {
                const action = { name: 'goTo', index };
                if (this._socket.readyState === WebSocket.OPEN) {
                    this._send(action);
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

        getMetadata(): { [key: string]: string } {
            return this._metadata;
        }

        parseRatio(): [number, number] {
            return [
                Number(this._metadata.ratio.split(':')[0]),
                Number(this._metadata.ratio.split(':')[1])
            ];
        }

        _send(action: ServerAction) {
            this._socket.send(JSON.stringify(action));
        }

        _attachEventHandlers() {
            // resize slides when window changed its size
            window.addEventListener('resize', ev => {
                this._setSlidesSize([ev.target.innerWidth, ev.target.innerHeight]);
                this.goTo(this._current, false);
            });

            // disable control keys
            window.addEventListener('keypress', ev => {
                if (CONTROL_KEYS.indexOf(mapKey(ev)) !== -1) {
                    ev.preventDefault();
                }
            });

            // attach control keys' handlers
            window.addEventListener('keyup', ev => {
                switch (mapKey(ev)) {
                    case LEFT:
                    case UP:
                        this.previous();
                        break;
                    case RIGHT:
                    case DOWN:
                    case SPACE:
                    case ENTER:
                        this.next();
                        break;
                }
            });

            this._socket.onopen = () => {
                this._send({ name: 'sync' });
                this._actionQueue.forEach(action => this._send(action));
            };

            this._socket.onmessage = event => {
                const action: ServerAction = JSON.parse(String(event.data));
                switch (action.name) {
                    case 'goTo':
                        this.goTo(action.index, false);
                        break;
                    case 'sync':
                        this._send({ name: 'goTo', index: this._current });
                        break;
                }
            };
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
    }

    window.preleganto = new Preleganto();
})();
