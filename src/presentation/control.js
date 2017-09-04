// @flow
/* eslint max-lines: 0 */

type Metadata = {
    ratio: string,
    title?: string,
    author?: string,
    theme?: string,
    notes: Array<string>,
};

type InputEvent = 'previous' | 'next' | 'ratio' | 'beginning' | 'end' | 'backward' | 'forward' | 'speakermode';

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

            // wait on dom load so touch events can be listened on document body
            document.addEventListener('DOMContentLoaded', () => {
                let command: 'slides' | 'speakermode' | null = null;
                let startXFactors = [];
                let startYFactors = [];
                let endYFactors = [];

                const body = document.body;

                if (body) {
                    body.addEventListener('touchstart', (ev: TouchEvent) => {
                        if (ev.touches.length === 1) {
                            // move slides using just one finger
                            command = 'slides';
                            startXFactors.push(ev.touches[0].clientX / window.innerWidth);
                            startYFactors.push(ev.touches[0].clientY / window.innerHeight);
                        } else if (ev.touches.length === 2) {
                            // toggle speaker mode with two fingers in vertical direction
                            command = 'speakermode';
                            startYFactors.push(ev.touches[0].clientY / window.innerHeight);
                            startYFactors.push(ev.touches[1].clientY / window.innerHeight);
                        }
                    });

                    body.addEventListener('touchmove', (ev: TouchEvent) => {
                        if (command !== null) {
                            ev.preventDefault();
                        }
                    });

                    body.addEventListener('touchend', (ev: TouchEvent) => {
                        if (command) {
                            if (command === 'slides') {
                                let endXFactor = ev.changedTouches[0].clientX / window.innerWidth;
                                let endYFactor = ev.changedTouches[0].clientY / window.innerHeight;

                                let deltaX = startXFactors[0] - endXFactor;
                                let deltaY = startYFactors[0] - endYFactor;

                                // select direction where the move was more significant
                                // then require some threshold of move distance
                                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                                    if (deltaX > 0.1) {
                                        this._emit('next');
                                    } else if (deltaX < -0.1) {
                                        this._emit('previous');
                                    }
                                } else {
                                    if (deltaY > 0.1) {
                                        this._emit('next');
                                    } else if (deltaY < -0.1) {
                                        this._emit('previous');
                                    }
                                }
                            } else if (command === 'speakermode') {
                                for (let touch of ev.changedTouches) {
                                    endYFactors.push(touch.clientY / window.innerHeight);
                                }

                                if (endYFactors.length === 2) {
                                    let deltaFirst = startYFactors[0] - endYFactors[0];
                                    let deltaSecond = startYFactors[1] - endYFactors[1];

                                    if (Math.max(deltaFirst, deltaSecond) < -0.1) {
                                        this._emit('speakermode');
                                    }
                                } else {
                                    return;
                                }
                            }

                            // reset variables
                            command = null;
                            startXFactors = [];
                            startYFactors = [];
                            endYFactors = [];
                            // ev.preventDefault();
                        }
                    });

                    body.addEventListener('touchcancel', () => {
                        if (command) {
                            // reset variables
                            command = null;
                            startXFactors = [];
                            startYFactors = [];
                            endYFactors = [];
                        }
                    });
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
                case 'Home':
                    return 'beginning';
                case 'End':
                    return 'end';
                case 'PageUp':
                    return 'backward';
                case 'PageDown':
                    return 'forward';
                case 'r':
                case 'R':
                    return 'ratio';
                case 's':
                case 'S':
                    return 'speakermode';
                default:
                    return null;
            }
        }
    }

    class SpeakerMode {
        _isEnabled: boolean;
        _timer: number;
        _running: boolean;
        _timerId: number;

        _elements: {
            view: HTMLElement,
            timer: HTMLElement,
            startStop: HTMLElement,
            reset: HTMLElement,
            notes: HTMLElement,
        }

        constructor() {
            this._isEnabled = false;
            this._timer = 0;
            this._running = false;

            let view = utils.select('#preleganto-speaker-view');
            let timer = utils.select('#preleganto-speaker-view-timer');
            let startStop = utils.select('#preleganto-speaker-view-timer-start-stop');
            let reset = utils.select('#preleganto-speaker-view-timer-reset');
            let notes = utils.select('#preleganto-speaker-view-notes');

            if (view instanceof HTMLElement && timer instanceof HTMLElement && startStop instanceof HTMLElement &&
                reset instanceof HTMLElement && notes instanceof HTMLElement) {
                this._elements = { view, timer, startStop, reset, notes };

                this._displayTime();

                startStop.addEventListener('click', (ev: MouseEvent) => {
                    if (ev.target instanceof HTMLElement) {
                        if (ev.target.textContent === 'Start') {
                            ev.target.textContent = 'Stop';
                            this._startTimer();
                        } else {
                            ev.target.textContent = 'Start';
                            this._stopTimer();
                        }
                    }
                });

                reset.addEventListener('click', (ev: MouseEvent) => {
                    if (ev.target instanceof HTMLElement) {
                        this._timer = 0;
                        this._stopTimer();
                        this._displayTime();

                        if (startStop) {
                            startStop.textContent = 'Start';
                        }
                    }
                });
            } else {
                throw new Error('Cannot find a HTML element in Speaker view');
            }
        }

        isEnabled(): boolean {
            return this._isEnabled;
        }

        toggle() {
            this._isEnabled = !this._isEnabled;

            if (this._isEnabled) {
                this._elements.view.style.display = 'block';
            } else {
                this._elements.view.style.display = 'none';
            }
        }

        setNotes(html: string) {
            this._elements.notes.innerHTML = html;
        }

        _startTimer() {
            this._running = true;
            this._timerId = setInterval(() => {
                this._timer++;
                this._displayTime();
            }, 1000);
        }

        _stopTimer() {
            this._running = false;
            clearInterval(this._timerId);
        }

        _displayTime() {
            let seconds = this._timer % 60;
            let minutes = ((this._timer - seconds) / 60) % 60;
            let hours = ((this._timer - seconds) / 60 - minutes) / 60;

            function pad(value: number): string {
                if (value < 10) {
                    return '0' + value;
                } else {
                    return String(value);
                }
            }

            this._elements.timer.textContent = `${hours}:${pad(minutes)}:${pad(seconds)}`;
        }
    }

    class Preleganto {
        _metadata: Metadata;

        _slides: Array<HTMLElement>;
        _current: number;

        _input: Input;

        _socket: WebSocket | null;
        _actionQueue: Array<ServerAction>;

        _supportedRatios: Array<string>;
        _currentRatio: string;

        _speakerMode: SpeakerMode;

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

            if (!this._speakerMode.isEnabled()) {
                window.scrollTo(0, this._slides[this._current].offsetTop);
            } else {
                this._speakerMode.setNotes(this._metadata.notes[this._current]);
            }

            window.location.hash = `view-${this._current + 1}`;
            return this._current;
        }

        previous(): number {
            return this.goTo(this._current - 1);
        }

        next(): number {
            return this.goTo(this._current + 1);
        }

        beginning(): number {
            return this.goTo(0);
        }

        end(): number {
            return this.goTo(this._slides.length - 1);
        }

        backward(): number {
            return this.goTo(this._current - 5);
        }

        forward(): number {
            return this.goTo(this._current + 5);
        }

        switchRatio() {
            let index = this._supportedRatios.indexOf(this._currentRatio);
            index = (index + 1) % this._supportedRatios.length;
            this._currentRatio = this._supportedRatios[index];
            this._setSlidesSize([window.innerWidth, window.innerHeight]);
        }

        toggleSpeakerMode() {
            if (this._speakerMode.isEnabled()) {
                this._slides.forEach(element => {
                    element.style.display = 'block';
                });

                this.goTo(this._current, false);
            } else {
                this._slides.forEach(element => {
                    element.style.display = 'none';
                });

                window.scrollTo(0, 0);
                this._speakerMode.setNotes(this._metadata.notes[this._current]);
            }

            this._speakerMode.toggle();
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
                Number(this._currentRatio.split(':')[0]),
                Number(this._currentRatio.split(':')[1])
            ];
        }

        _initMetadata() {
            let metadataScript = utils.select('script[type="text/preleganto-metadata"]');

            if (metadataScript) {
                this._metadata = JSON.parse(metadataScript.textContent);
            } else {
                console.warn('Cannot find Preleganto metadata. The presentation will run in limited mode.');
                this._metadata = {
                    ratio: '16:10',
                    notes: []
                };
            }

            this._supportedRatios = ['16:10', '4:3', '16:9'];

            if (this._supportedRatios.indexOf(this._metadata.ratio) === -1) {
                this._supportedRatios.push(this._metadata.ratio);
            }

            this._currentRatio = this._metadata.ratio;
            this._speakerMode = new SpeakerMode();
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
            this._input.on('beginning', () => this.beginning());
            this._input.on('end', () => this.end());
            this._input.on('backward', () => this.backward());
            this._input.on('forward', () => this.forward());
            this._input.on('ratio', () => this.switchRatio());
            this._input.on('speakermode', () => this.toggleSpeakerMode());
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
