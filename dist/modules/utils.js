(function(root, factory){
    /* globals define, require, module, self, EventTarget */
    const
            name = 'utils',
            dependencies = ['sprintf', 'GM'];
    if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    } else if (typeof exports === 'object' && module.exports) {
        module.exports = factory(...dependencies.map(dep => require(dep)));
    } else {
        root.require = root.require || function(dep){
            let result;
            Object.keys(Object.getOwnPropertyDescriptors(root)).some(key => {
                if (key.toLowerCase() === dep.toLowerCase()) result = root[key];
                return typeof result !== "undefined";
            });
            return result;
        };
        root[name] = factory(...dependencies.map(dep => require(dep)));/*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function utils(sprintf, gm, undef){

    const {GM_info} = gm;

    const
            GMinfo = (typeof GM_info !== 'undefined' ? GM_info : (typeof GM === 'object' && GM !== null && typeof GM.info === 'object' ? GM.info : null)),
            scriptname = GMinfo ? `${GMinfo.script.name} @${GMinfo.script.version}` : "",
            UUID = GMinfo ? GMinfo.script.uuid : "",
            // Scallar types
            s = "string",
            b = "boolean",
            f = "function",
            o = "object",
            u = "undefined",
            n = "number",
            //time
            second = 1000,
            minute = 60 * second,
            hour = minute * 60,
            day = hour * 24,
            week = day * 7,
            year = 365 * day,
            month = Math.round(year / 12),
            doc = document;

    /**
     * Test if given argument is a plain object
     * @param {any} v
     * @returns {Boolean}
     */
    function isPlainObject(v){
        return v instanceof Object && Object.getPrototypeOf(v) === Object.prototype;
    }


    /**
     * Get the type of the current value
     * @param {any} value
     * @param {string} [compare]
     * @returns {string|boolean}
     */
    function gettype(value, compare){
        let type = typeof value;
        if (type === o) {
            if (value === null) type = "null";
            else if (Array.isArray(value)) type = "array";
        } else if (type === n) {
            type = "float";
            if (Number.isInteger(value)) type = "int";
        }
        if (typeof compare === s) return type === compare;
        return type;
    }


    /**
     * Creates an HTMLElement from html code
     * @param {string} html
     * @returns {HTMLElement}
     */
    function html2element(html){
        if (typeof html === "string") {
            let template = doc.createElement('template');
            html = html.trim();
            template.innerHTML = html;
            return template.content.firstChild;
        }
    }


    /**
     * Creates a Document from html code
     * @param {string} html
     * @returns {documentElement}
     */
    function html2doc(html){
        let node = doc.implementation.createHTMLDocument().documentElement;
        if (typeof html === 'string' && html.length > 0) {
            node.innerHTML = html;
        }
        return node;
    }



    /**
     * Tests whenever the given selector is valid
     * @param {string} selector
     * @returns {Boolean}
     */
    function isValidSelector(selector){

        if (typeof selector !== s) return false;
        let valid = true;
        try {
            //throws syntax error on invalid selector
            valid = doc.createElement('template').querySelector(selector) === null;
        } catch (e) {
            valid = false;
        }
        return valid;
    }


    /**
     * Adds CSS to the bottom of the head
     * @param {string} css
     * @returns {undefined}
     */
    function addstyle(css){
        if (typeof css === "string" && css.length > 0) {
            let s = doc.createElement('style');
            s.setAttribute('type', "text/css");
            s.appendChild(doc.createTextNode('<!-- ' + css + ' -->'));
            doc.head.appendChild(s);
        }
    }


    /**
     * Adds script to the bottom of the head
     * @param {string} src
     * @returns {undefined}
     */
    function addscript(src){
        if (typeof src === s && src.length > 0) {
            let s = doc.createElement("script");
            s.setAttribute("type", "text/javascript");
            s.appendChild(doc.createTextNode(src));
            doc.head.appendChild(s);
        }
    }



    /**
     * Checks if url is valid
     * @param {string} url
     * @returns {boolean}
     */
    function isValidUrl(url){
        const weburl = new RegExp("^(?:(?:(?:https?|ftp):)?\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z0-9\\u00a1-\\uffff][a-z0-9\\u00a1-\\uffff_-]{0,62})?[a-z0-9\\u00a1-\\uffff]\\.)+(?:[a-z\\u00a1-\\uffff]{2,}\\.?))(?::\\d{2,5})?(?:[/?#]\\S*)?$", "i");
        if (typeof url === s && url.length > 0) {
            return weburl.test(url);
        }
        return false;
    }




    /**
     * Convert uri into full url
     * @param {string} uri
     * @returns {string|undefined}
     */
    function getURL(uri){
        let retval;
        if (typeof uri === s && uri.length > 0) {
            try {
                let a = doc.createElement("a"),
                        url;
                a.href = uri;
                //throws error if url not valid
                url = new URL(a.href);
                retval = url.href;
            } catch (error) {
                retval = undef;
            }

        }
        return retval;

    }


    /**
     * Sanitize a given filename
     * @param {string} input
     * @param {string} replacement
     * @returns {string}
     */
    function sanitizeFileName(input, replacement){
        replacement = typeof replacement === s ? replacement : "";
        if (typeof input === s) return input
                    .replace(/[\/\?<>\\:\*\|":\'\`\’]/g, replacement)
                    .replace(/[\x00-\x1f\x80-\x9f]/g, replacement)
                    .replace(/^\.+$/, replacement)
                    .replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, replacement)
                    .replace(/[\. ]+$/, replacement)
                    .substring(0, 255);
    }



    /**
     * Generate a unique ID
     * @returns {String}
     */
    function uniqid(){
        return  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }


    function loadRejectMessage(e, reject){
        let

                target = e.target,
                error = new Error('Cannot load resource');
        Object.assign(error, {target});
        target.remove();
        console.warn(error.message, target.src || target.href);
        reject(error);

    }


    /**
     * Loads an external script
     * @param {string} src
     * @param {boolean} defer
     * @returns {Promise}
     */
    function loadjs(src, defer){
        return new Promise((resolve, reject) => {
            if (typeof src !== s) {
                reject(new Error("Invalid argument src."));
                return;
            }
            let script = doc.createElement('script');
            Object.assign(script, {
                type: 'text/javascript',
                onload: e => resolve(e.target),
                onerror: e => loadRejectMessage(e,reject),
                src: src
            });
            if (defer === true) script.defer = true;
            document.head.appendChild(script);
        });
    }

    /**
     * Loads an external CSS
     * @param {string} src
     * @returns {Promise}
     */
    function loadcss(src){

        return new Promise((resolve, reject) => {
            if (typeof src !== s) {
                reject(new Error('Invalid argument src'));
                return;
            }
            let style = doc.createElement('link');
            Object.assign(style, {
                rel: "stylesheet",
                type: "text/css",
                onload: e => resolve(e.target),
                onerror: e => loadRejectMessage(e, reject),
                href: src
            });
            document.head.appendChild(style);
        });
    }

    /**
     * Copy given text to clipboard
     * @param {string} text
     * @returns {boolean}
     */
    function copyToClipboard(text){
        let r = false;
        if (typeof text === "string" && text.length > 0) {
            let el = doc.createElement('textarea');
            el.innerHTML = text;
            el.style.opacity = 0;
            doc.body.appendChild(el);
            el.select();
            r = doc.execCommand("copy") === true;
            doc.body.removeChild(el);
        }
        return r;
    }


    /**
     * Download given text as a file
     * @param {string} text
     * @param {string} filename
     * @returns {undefined}
     * @link https://stackoverflow.com/questions/32225904/programmatical-click-on-a-tag-not-working-in-firefox
     */
    function Text2File(text, filename){
        if (typeof text === s && typeof filename === s) {
            let link = doc.createElement("a"), blob = new Blob([text], {type: "application/octet-stream"});
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.dispatchEvent(new MouseEvent(`click`));
        }
    }



    class ON {
        /**
         * Resolves when body is created
         * @returns {Promise}
         */
        get body(){
            return new Promise(resolve => {

                if (doc.body === null) {
                    const observer = new MutationObserver(mutations => {
                        let ready = false;
                        mutations.forEach(mutation => {
                            mutation.addedNodes.forEach(node => {
                                if (typeof node.matches === f ? node.matches('body') : false) {
                                    ready = true;
                                }
                            });
                        });
                        if (ready === true) {
                            observer.disconnect();
                            resolve(doc.body);
                        }

                    });
                    observer.observe(doc.documentElement, {childList: true});
                } else resolve(doc.body);

            });
        }

        /**
         * Resolves when page is loading DOMContentLoaded
         * @returns {Promise}
         */
        get load(){
            return new Promise(resolve => {
                if (doc.readyState === "loading") {
                    doc.addEventListener("DOMContentLoaded", function(){
                        resolve(doc.body);
                    });
                } else resolve(doc.body);
            });
        }



        /**
         * Resolves when page is completely loaded
         * @returns {Promise}
         */
        get loaded(){
            return new Promise(resolve => {
                if (doc.readyState !== "complete") {
                    addEventListener("load", function(){
                        resolve(doc.body);
                    });

                } else resolve(doc.body);

            });
        }
    }



    /**
     * Resize Sensor
     * @param {HTMLElement|string} element Element or selector
     * @param {function} callback Callback to use ob resize
     */
    const ResizeSensor = (function(){

        const
                sensors = [],
                domObserver = new MutationObserver((mutations, obs) => {
                    mutations.forEach(mutation => {
                        if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
                            sensors.filter(x => x.started === true).forEach(sensor => {
                                if (!doc.body.contains(sensor.element)) sensor.stop();
                            });
                            if (sensors.every(x => x.started === false)) obs.stop();
                        }
                    });
                });
        Object.assign(domObserver, {
            started: false,
            start(){
                if (this.started === false) {
                    this.started = true;
                    this.observe(doc.body, {childList: true, subtree: true});
                }
            },
            stop(){
                if (this.started === true) {
                    this.started = false;
                    this.disconnect();
                }
            }
        });


        class ResizeSensor {

            get element(){
                return this._params.element;
            }
            get started(){
                return this._params.started;
            }
            get currentWidth(){
                return this.element.offsetWidth;
            }
            get currentHeight(){
                return this.element.offsetHeight;
            }
            get previousWidth(){
                return this._params.width;
            }
            get previousHeight(){
                return this._params.height;
            }

            start(){
                if (this._params.started === false) {
                    this._params.width = this.currentWidth;
                    this._params.height = this.currentHeight;
                    this._params.started = true;
                    this._params.observer.observe(this.element, {attributes: true, characterData: true, childList: true, subtree: true});
                    domObserver.start();
                }
            }
            stop(){
                if (this._params.started === true) {
                    this._params.started = false;
                    this._params.observer.disconnect();
                }
            }

            constructor(element, callback){
                const
                        self = this,
                        params = this._params = {
                            element: element,
                            width: null,
                            height: null,
                            started: false
                        };
                let
                        width = self.currentWidth,
                        height = self.currentHeight;
                params.observer = new MutationObserver(m => {
                    if (self.currentWidth !== width || self.currentHeight !== height) {
                        self._params.width = width;
                        self._params.height = height;
                        width = self.currentWidth;
                        height = self.currentHeight;
                        callback.call(element, self);
                    }
                });
                sensors.push(this);
                this.start();
            }
        }

        function sensor(element, callback){
            if (typeof callback !== f) throw new Error('ResizeSensor invalid callback.');
            if (typeof element === s) element = doc.querySelectorAll(element);
            if (element instanceof NodeList) return Array.from(element).map(el => sensor(el, callback));
            if (!(element instanceof Element)) throw new Error('ResizeSensor invalid element.');
            return new ResizeSensor(element, callback);
        }
        return sensor;
    })();




    class NodeFinderResults extends Array {

        get current(){
            return this[this.length - 1];
        }


        /**
         * Use current result as root to find children matching selector
         * @param {string} selector
         * @param {function} callback
         * @returns {NodeFinder}
         */
        find(selector, callback, limit = 0){
            return NodeFinder(this.current).find(selector, callback, limit);
        }

        /**
         * Use current result as root to find one children matching selector
         * @param {string} selector
         * @param {function} callback
         * @returns {NodeFinder}
         */
        findOne(selector, callback){
            return NodeFinder(this.current).find(selector, callback, 1);
        }


        /**
         * Starts thee dom observer
         * @returns {NodeFinderResults}
         */
        start(){
            if (this.started === false) {
                const $this = this;
                if (doc.readyState === "loading") {
                    doc.addEventListener("DOMContentLoaded", function(){
                        $this.start();
                    });
                    return this;
                }
                this.started = true;
                //initial search (nodes already in dom)
                this.root.querySelectorAll(this.selector).forEach(node => {
                    if (!$this.includes(node)) {
                        $this.push(node);
                        $this.callback.call(node, node, $this);
                    }
                });

                this.observer.observe(this.root, {attributes: true, childList: true, subtree: true});
                return this;
            }
        }
        /**
         * Stops the dom observer
         * @returns {NodeFinderResults}
         */
        stop(){
            if (this.started === true) {
                this.started = false;
                this.observer.disconnect();
            }
            return this;
        }


        constructor(root, selector, callback, limit, finder){

            if (!isValidSelector(selector)) throw new Error('NodeFinder invalid selector.');
            if (typeof callback !== f) throw new Error('NodeFinder invalid callback.');
            if (typeof limit !== n) throw new Error('NodeFinder invalid limit.');

            super();

            Object.defineProperties(this, {
                root: {value: root, enmerable: false, configurable: true, writable: false},
                selector: {value: selector, enmerable: false, configurable: true, writable: false},
                callback: {value: callback, enmerable: false, configurable: true, writable: false},
                observer: {value: callback, enmerable: false, configurable: true, writable: true},
                limit: {value: limit, enmerable: false, configurable: true, writable: false},
                started: {value: false, enmerable: false, configurable: true, writable: true},
                NodeFinder: {value: finder, enmerable: false, configurable: true, writable: false}
            });


            const
                    $this = this,
                    $callback = function(mutations){
                        let nodes = [];
                        mutations.forEach(m => {
                            let node = m.target;
                            if (nodes.includes(node)) return;
                            if (node instanceof Element) {
                                if (nodes.includes(node) === false ? $this.includes(node) === false : false) {
                                    if (node.matches(selector)) nodes.push(node);
                                }
                            }
                            if (m.type === 'childList') {
                                [m.addedNodes, m.removedNodes].forEach(list => {
                                    list.forEach(node => {
                                        if (nodes.includes(node) || $this.includes(node)) return;
                                        if (node instanceof Element ? node.matches(selector) : false) nodes.push(node);

                                    });
                                });
                            }
                        });
                        root.querySelectorAll(selector).forEach(node => {
                            if (nodes.includes(node) || $this.includes(node)) return;
                            nodes.push(node);
                        });

                        if (nodes.length > 0) {
                            nodes.forEach(node => {
                                if (limit > 0 ? $this.length === limit : false) return;
                                if ($this.includes(node)) return;
                                if (root.contains(node)) {
                                    $this.push(node);
                                    callback.call(node, node, $this);
                                }
                            });
                        }
                        if (limit > 0 ? $this.length === limit : false) $this.stop();
                    };
            this.observer = new MutationObserver($callback);
            this.start();
        }
    }


    /**
     * Node Finder v2
     * @param {DocumentElement|HTMLElement|string} root single node, selector to use as root for the search
     * @returns {NodeFinder}
     */
    function NodeFinder(root){
        if (this instanceof NodeFinder == false) return new NodeFinder(root);
        //throw new Error('NodeFinder cannot be instanciated using |new|.');
        if (typeof root === s) root = doc.querySelector(root);
        if (root instanceof EventTarget ? typeof root.querySelectorAll === f : false) {
            Object.defineProperties(this, {
                root: {value: root, enmerable: false, configurable: true, writable: false},
                observers: {value: [], enmerable: false, configurable: true, writable: false}
            });
            NodeFinder.instances.push(this);
            return this;
        }
        throw new Error('NodeFinder invalid root argument');
    }


    NodeFinder.instances = [];


    NodeFinder.fn = NodeFinder.prototype = {
        /**
         * Find Nodes if existing or when created
         * @param {string} selector
         * @param {function} callback
         * @param {number} [limit]
         * @returns {NodeFinderRoot}
         */
        find(selector, callback, limit = 0){
            this.observers.push(new NodeFinderResults(this.root, selector, callback, limit, this));
            return this;
        },

        /**
         * Find One Node if existing or when created
         * @param {string} selector
         * @param {function} callback
         * @param {number} [limit]
         * @returns {NodeFinderRoot}
         */
        findOne(selector, callback){
            this.observers.push(new NodeFinderResults(this.root, selector, callback, 1, this));
            return this;
        },

        /**
         * Stops all observers for the current root
         * @return {NodeFinder}
         */
        stop(){
            this.observers.forEach(obs => obs.stop());
            return this;
        }
    };

    /**
     * Find Nodes if existing or when created using the full document
     * @param {string} selector
     * @param {function} callback
     * @param {number} [limit]
     * @returns {NodeFinder}
     */
    NodeFinder.find = function(selector, callback, limit = 0){
        return NodeFinder(doc).find(selector, callback, limit);
    };
    /**
     * Find Nodes if existing or when created using the full document
     * @param {string} selector
     * @param {function} callback
     * @param {number} [limit]
     * @returns {NodeFinder}
     */
    NodeFinder.findOne = function(selector, callback){
        return NodeFinder(doc).find(selector, callback, 1);
    };

    /**
     * Stops all observers
     * @return {undefined}
     */
    NodeFinder.stop = function(){
        this.instances.forEach(finder => {
            finder.stop();
        });
    };



    /**
     * Creates a new Timer
     * @param {function} callback
     * @param {number|undefined} interval
     * @param {number|undefined} timeout
     * @returns {Timer}
     */
    class Timer {
        
        get started(){
            return this.ids.interval !== null || this.ids.timeout !== null;
        }

        get interval(){
            return this.params.interval;
        }

        get timeout(){
            return this.params.timeout;
        }


        /**
         * Starts the timer
         * @returns {Timer}
         */
        start(){
            
            if (!this.started) {

                if (this.interval > 0) {
                    this.ids.interval = setInterval(() => {
                        this.params.callback.call(null, this);
                    }, this.interval);
                    if (this.timeout > 0) {
                        this.ids.timeout = setTimeout(() => {
                            this.stop();
                        }, this.timeout);
                    }

                } else if (this.timeout > 0) {
                    this.ids.timeout = setTimeout(() => {
                        this.stop();
                        this.params.callback.call(null, this);
                    }, this.timeout);
                }
            }
            return this;

        }
        /**
         * Stops the timer
         * @returns {Timer}
         */
        stop(){
            if (this.started) {
                if (this.ids.interval !== null) {
                    clearInterval(this.ids.interval);
                    this.ids.interval = null;
                }
                if (this.ids.timeout !== null) {
                    clearTimeout(this.ids.timeout);
                    this.ids.timeout = null;
                }
            }
            return this;
        }

        /**
         * Creates a new Timer
         * @param {function} callback
         * @param {number|undefined} interval
         * @param {number|undefined} timeout
         * @param {boolean} autostart
         * @returns {Timer}
         */
        constructor(callback, interval, timeout, autostart = true){
            Object.defineProperties(this, {
                params: {
                    configurable: true, enumerable: false, writable: true,
                    value: {
                        callback: typeof callback === f ? callback : null,
                        interval: typeof interval === n ? interval : 10,
                        timeout: typeof timeout === n ? timeout : 0
                    }
                },
                ids: {
                    configurable: true, enumerable: false, writable: true,
                    value: {interval: null, timeout: null}
                }
            });

            if (typeof callback === f) {
                if (autostart === true) this.start();
            } else throw new Error('Invalid Argument callback.');
        }
    }



    /**
     * Small Event Wrapper
     * @param {EventTarget} target
     * @param {Object} binding
     * @returns {Events}
     */
    function Events(target, binding){

        if (typeof target === s) target = doc.querySelector(target);

        if (this instanceof Events) {
            const self = this;
            binding = binding instanceof Object ? binding : target;
            if (!(target instanceof EventTarget)) target = doc.createElement('div');
            if (!(binding instanceof EventTarget)) {
                ["on", "off", "one", "trigger"].forEach(method => {
                    binding[method] = function(...args){
                        self[method].apply(self, args);
                        return this;
                    };
                });
            }
            Object.assign(this, {
                target: target,
                binding: binding,
                events: []
            });
            return this;
        } else if ((target instanceof EventTarget)) return new Events(...arguments);

    }

    Events.prototype = {
        /**
         * Add an event listener
         * @param {string} type
         * @param {function} listener
         * @param {boolean|Object} options
         * @returns {Events}
         */
        on(type, listener, options){
            if (typeof type === s && typeof listener === f) {
                const self = this,
                        params = {
                            once: false,
                            capture: false
                        },
                        handler = listener.bind(self.binding);
                if (typeof options === b) params.capture = options;
                else if (isPlainObject(options)) Object.keys(params).forEach(key => {
                        params[key] = options[key] === true;
                    });
                type.split(/\s+/).forEach(type => {
                    self.events.push({
                        type: type,
                        listener: listener,
                        handler: handler,
                        options: params
                    });
                    self.target.addEventListener(type, handler, params);
                });
            }
            return this;
        },
        /**
         * Add an event listener that can be triggered once
         * @param {string} type
         * @param {function} listener
         * @param {boolean} capture
         * @returns {Events}
         */
        one(type, listener, capture){
            if (typeof type === s && typeof listener === f) this.on(type, listener, {
                    once: true,
                    capture: capture === true
                });
            return this;
        },
        /**
         * Removes an event listener
         * @param {string} type
         * @param {function} listener
         * @param {boolean} capture
         * @returns {Events}
         */
        off(type, listener, capture){
            if (typeof type === s) {
                const self = this,
                        params = {
                            capture: false
                        };
                let callback;
                for (let i = 1; i < arguments.length; i++) {
                    let arg = arguments[i];
                    switch (typeof arg) {
                        case b:
                            params.capture = arg;
                            break;
                        case f:
                            callback = arg;
                            break;
                        default:
                            break;
                    }
                }
                type.split(/\s+/).forEach(type => {
                    self.events = self.events.filter(evt => {
                        if (typeof callback === f) {
                            if (type === evt.type && params.capture === evt.params.capture && callback === evt.listener) {
                                self.target.removeEventListener(type, evt.handler, params.capture);
                                return false;
                            }
                        } else if (type === evt.type) {
                            self.target.removeEventListener(type, evt.handler, evt.params.capture);
                            return false;
                        }
                        return true;
                    });
                });
            }
            return this;
        },
        /**
         * Dispatches an event
         * @param {string} type
         * @param {any} data
         * @returns {Events}
         */
        trigger(type, data){
            if (typeof type === s) {
                const self = this;
                data = data !== undef ? data : {};
                type.split(/\s+/).forEach(type => {
                    let event;
                    if (self.target.parentElement === null) event = new Event(type);
                    else event = new Event(type, {
                            bubbles: true,
                            cancelable: true
                        });
                    Object.assign(event, data);
                    self.target.dispatchEvent(event);
                });
            }
            return this;
        }


    };


    /**
     * Dispatches an Event
     * @param {EventTarget} el
     * @param {string} type
     * @param {any} data
     * @returns {undefined}
     */
    function trigger(el, type, data){
        if (el instanceof EventTarget) {
            if (typeof type === s) {
                let event;
                type.split(/\s+/).forEach((t) => {
                    if (el.parentElement === null) event = new Event(type);
                    else event = new Event(t, {bubbles: true, cancelable: true});
                    Object.assign(event, data);
                    el.dispatchEvent(event);
                });
            }
        }
    }

    /**
     * Resource Fetch
     * @param {string|URL} url
     * @param {Object} [options]
     * @returns {Promise}
     */
    function rfetch(url, options){
        const params = {
            method: "GET",
            redirect: "follow",
            cache: "no-store"
        };
        if(isPlainObject(options)) Object.assign(options,params);
        let src;
        if (url instanceof URL) src = url;
        else if (typeof url === s) {
            src = getURL(url);
            if(typeof src === s) src = new URL(src);
        }
        if (!(src instanceof URL)) {
            let error = new Error('rfetch: Invalid URL');
            Object.assign(error, {
                url, options
            });
            throw error;
        }
        
        
        return new Promise((resove, reject)=>{
            fetch(src, options)
                    .then(r => {
                        if (r.status !== 200) {
                            let error = new Error('Invalid Status Code');
                            Object.assign(error, {status: r.status});
                            throw error;
                        }
                        resove(r.text());
                    })
                    .catch(err => reject(err));
        });
    }

    /**
     * Assert if a condition is true and throws error if not
     * @param {boolean} compare
     * @param {string} message Message to display on Error
     * @param {string} ...replacements sprintf replacements
     * @returns {Boolean}
     */
    function assert(compare, message, ...replacements){
        if (typeof compare !== b) throw new Error('assert: Invalid Argument: compare');
        if (compare === true) return true;
        if (replacements.length > 0) message = sprintf.sprintf(message, ...replacements);
        throw new Error(message);
    }



    return Object.assign( {
        s, b, f, o, u, n, GMinfo, scriptname, UUID,
        second, minute, hour, day, week, year, month,
        uniqid, html2element, html2doc, copyToClipboard, Text2File, doc, ON, isValidSelector, Timer,
        addstyle, loadjs, addscript, loadcss, isValidUrl, getURL, sanitizeFileName, ResizeSensor, NodeFinder,
        Events, trigger, rfetch, assert, isPlainObject, gettype
    }, sprintf);

}));

