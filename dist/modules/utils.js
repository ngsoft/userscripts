(function(root, factory){
    /* globals define, require, module, self, EventTarget */
    const
            name = 'utils',
            dependencies = ['config'];
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
}(typeof self !== 'undefined' ? self : this, function(config, undef){

    const

            // Scallar types
            s = string ="string",
            b = bool ="boolean",
            f = "function",
            o = object ="object",
            u = "undefined",
            n = number = "number",
            int = 'int',
            float='float',
            array='array',
            
            //time
            second = 1000,
            minute = 60 * second,
            hour = minute * 60,
            day = hour * 24,
            week = day * 7,
            year = 365 * day,
            month = Math.round(year / 12),
            global = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window),
            doc = global.document;

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

    // Deep extend destination object with N more objects
    function extend(target = {}, ...sources) {
        if (!sources.length) {
            return target;
        }

        const source = sources.shift();

        if (!isPlainObject(source)) {
            return target;
        }

        Object.keys(source).forEach(key => {

            if (isPlainObject(source[key])) {
                if (!Object.keys(target).includes(key)) {
                    Object.assign(target, {
                        [key]: {}
                    });
                }

                extend(target[key], source[key]);
            } else {
                Object.assign(target, {
                    [key]: source[key]
                });
            }
        });

        return extend(target, ...sources);
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
     * Loads an external script (or multiple)
     * @param {string|URL} ...urls
     * @param {boolean} [defer]
     * @returns {Promise}
     */
    function loadjs(...urls){

        let
                defer = false,
                args = Array.from(arguments).filter(x => {
            if (typeof x === b) {
                defer = x;
                return false;
            }
            return true;
        });


        return new Promise((resolve, reject) => {

            let
                    count = 0,
                    resolver = function(e){
                        if (e.type === "error") {
                            loadRejectMessage(e, reject);
                            return;
                        }
                        count++;
                        if (count === args.length) resolve(e.target);
                    };
            args.forEach(src => {
                if (src instanceof URL) src = src.href;
                if (typeof src !== s) {
                    reject(new Error('Invalid argument src'));
                    return;
                }
                let script = doc.createElement('script');
                Object.assign(script, {
                    type: 'text/javascript',
                    onload: resolver,
                    onerror: resolver,
                    src: src
                });
                if (defer === true) script.defer = true;
                document.head.appendChild(script);

            });

        });
    }

    /**
     * Loads an external CSS (or multiple)
     * @param {string|URL} ...urls
     * @returns {Promise}
     */
    function loadcss(url){
        
        let args = Array.from(arguments);

        return new Promise((resolve, reject) => {

            let
                    count = 0,
                    resolver = function(e){
                        if (e.type === "error") {
                            loadRejectMessage(e, reject);
                            return;
                        }

                        count++;
                        if (count === args.length) resolve(e.target);
                    };
            args.forEach(src => {
                if (src instanceof URL) src = src.href;
                if (typeof src !== s) {
                    reject(new Error('Invalid argument src'));
                    return;
                }
                let style = doc.createElement('link');
                Object.assign(style, {
                    rel: "stylesheet",
                    type: "text/css",
                    onload: resolver,
                    onerror: resolver,
                    href: src
                });
                document.head.appendChild(style);

            });

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
        static get body(){
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
        static get load(){
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
        static get loaded(){
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
                root: {value: root, enumerable: false, configurable: true, writable: false},
                selector: {value: selector, enumerable: false, configurable: true, writable: false},
                callback: {value: callback, enumerable: false, configurable: true, writable: false},
                observer: {value: callback, enumerable: false, configurable: true, writable: true},
                limit: {value: limit, enumerable: false, configurable: true, writable: false},
                started: {value: false, enumerable: false, configurable: true, writable: true},
                NodeFinder: {value: finder, enumerable: false, configurable: true, writable: false}
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
                root: {value: root, enumerable: false, configurable: true, writable: false},
                observers: {value: [], enumerable: false, configurable: true, writable: false}
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
            if (!(target instanceof EventTarget)) target = doc.createElement('div');
            binding = binding instanceof Object ? binding : target;
            if (!(binding instanceof EventTarget)) {
                ["on", "off", "one", "trigger"].forEach(method => {
                    binding[method] = function(...args){
                        self[method].apply(self, args);
                        return this;
                    };
                });
            }
            
            if(!target.hasOwnProperty('__Events__')){
                Object.defineProperty(target, '__Events__', {
                    enumerable: false, configurable: true, writable: true,
                    value: []
                });
            }
            
            Object.assign(this, {
                target: target,
                binding: binding,
                events: target.__Events__
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
                        console.debug(evt);
                        if (typeof callback === f) {
                            if (type === evt.type && params.capture === evt.options.capture && callback === evt.listener) {
                                self.target.removeEventListener(type, evt.handler, params.capture);
                                return false;
                            }
                        } else if (type === evt.type) {
                            self.target.removeEventListener(type, evt.handler, evt.options.capture);
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
                            Object.assign(error, {status: r.status, url: src});
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
        if (replacements.length > 0) message = sprintf(message, ...replacements);
        throw new Error(message);
    }



    var re = {
        not_string: /[^s]/,
        not_bool: /[^t]/,
        not_type: /[^T]/,
        not_primitive: /[^v]/,
        number: /[diefg]/,
        numeric_arg: /[bcdiefguxX]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[+-]/
    };

    function sprintf(key){
        // `arguments` is not an array, but should be fine for this call
        return sprintf_format(sprintf_parse(key), arguments);
    }

    function vsprintf(fmt, argv){
        return sprintf.apply(null, [fmt].concat(argv || []));
    }

    function sprintf_format(parse_tree, argv){
        var cursor = 1, tree_length = parse_tree.length, arg, output = '', i, k, ph, pad, pad_character, pad_length, is_positive, sign;
        for (i = 0; i < tree_length; i++) {
            if (typeof parse_tree[i] === 'string') {
                output += parse_tree[i];
            } else if (typeof parse_tree[i] === 'object') {
                ph = parse_tree[i]; // convenience purposes only
                if (ph.keys) { // keyword argument
                    arg = argv[cursor];
                    for (k = 0; k < ph.keys.length; k++) {
                        if (arg == undefined) {
                            throw new Error(sprintf('[sprintf] Cannot access property "%s" of undefined value "%s"', ph.keys[k], ph.keys[k - 1]));
                        }
                        arg = arg[ph.keys[k]];
                    }
                } else if (ph.param_no) { // positional argument (explicit)
                    arg = argv[ph.param_no];
                } else { // positional argument (implicit)
                    arg = argv[cursor++];
                }

                if (re.not_type.test(ph.type) && re.not_primitive.test(ph.type) && arg instanceof Function) {
                    arg = arg();
                }

                if (re.numeric_arg.test(ph.type) && (typeof arg !== 'number' && isNaN(arg))) {
                    throw new TypeError(sprintf('[sprintf] expecting number but found %T', arg));
                }

                if (re.number.test(ph.type)) {
                    is_positive = arg >= 0;
                }

                switch (ph.type) {
                    case 'b':
                        arg = parseInt(arg, 10).toString(2);
                        break;
                    case 'c':
                        arg = String.fromCharCode(parseInt(arg, 10));
                        break;
                    case 'd':
                    case 'i':
                        arg = parseInt(arg, 10);
                        break;
                    case 'j':
                        arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0);
                        break;
                    case 'e':
                        arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential();
                        break;
                    case 'f':
                        arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg);
                        break;
                    case 'g':
                        arg = ph.precision ? String(Number(arg.toPrecision(ph.precision))) : parseFloat(arg);
                        break;
                    case 'o':
                        arg = (parseInt(arg, 10) >>> 0).toString(8);
                        break;
                    case 's':
                        arg = String(arg);
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break;
                    case 't':
                        arg = String(!!arg);
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break;
                    case 'T':
                        arg = Object.prototype.toString.call(arg).slice(8, -1).toLowerCase();
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break;
                    case 'u':
                        arg = parseInt(arg, 10) >>> 0;
                        break;
                    case 'v':
                        arg = arg.valueOf();
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break;
                    case 'x':
                        arg = (parseInt(arg, 10) >>> 0).toString(16);
                        break;
                    case 'X':
                        arg = (parseInt(arg, 10) >>> 0).toString(16).toUpperCase();
                        break;
                }
                if (re.json.test(ph.type)) {
                    output += arg;
                } else {
                    if (re.number.test(ph.type) && (!is_positive || ph.sign)) {
                        sign = is_positive ? '+' : '-';
                        arg = arg.toString().replace(re.sign, '');
                    } else {
                        sign = '';
                    }
                    pad_character = ph.pad_char ? ph.pad_char === '0' ? '0' : ph.pad_char.charAt(1) : ' ';
                    pad_length = ph.width - (sign + arg).length;
                    pad = ph.width ? (pad_length > 0 ? pad_character.repeat(pad_length) : '') : '';
                    output += ph.align ? sign + arg + pad : (pad_character === '0' ? sign + pad + arg : pad + sign + arg);
                }
            }
        }
        return output;
    }

    var sprintf_cache = Object.create(null);

    function sprintf_parse(fmt){
        if (sprintf_cache[fmt]) {
            return sprintf_cache[fmt];
        }

        var _fmt = fmt, match, parse_tree = [], arg_names = 0;
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree.push(match[0]);
            } else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree.push('%');
            } else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1;
                    var field_list = [], replacement_field = match[2], field_match = [];
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list.push(field_match[1]);
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1]);
                            } else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1]);
                            } else {
                                throw new SyntaxError('[sprintf] failed to parse named argument key');
                            }
                        }
                    } else {
                        throw new SyntaxError('[sprintf] failed to parse named argument key');
                    }
                    match[2] = field_list;
                } else {
                    arg_names |= 2;
                }
                if (arg_names === 3) {
                    throw new Error('[sprintf] mixing positional and named placeholders is not (yet) supported');
                }

                parse_tree.push(
                        {
                            placeholder: match[0],
                            param_no: match[1],
                            keys: match[2],
                            sign: match[3],
                            pad_char: match[4],
                            align: match[5],
                            width: match[6],
                            precision: match[7],
                            type: match[8]
                        }
                );
            } else {
                throw new SyntaxError('[sprintf] unexpected placeholder');
            }
            _fmt = _fmt.substring(match[0].length);
        }
        return sprintf_cache[fmt] = parse_tree;
    }



    /**
     * @param {Element} element
     * @returns {DataSet}
     */
    function DataSet(element){
        if (!(this instanceof DataSet)) return new DataSet(element);
        if (typeof element === s) element = doc.querySelector(element);
        this.element = element;
    }
    
    DataSet.prototype = {
        /**
         * @param {string|Array|Object} key
         * @param {any} [value]
         * @returns {DataSet}
         */
        set(key, value){
            if(this.element instanceof Element){
                if (value === null || value === undef) {
                    if (gettype(key, s) || Array.isArray(key)) return this.remove(key);
                    if (isPlainObject(key)) Object.keys(key).forEach(k => this.set(k, key[k]));
                    return this;
                }
                if (gettype(key, s)) key = [key];
                if (Array.isArray(key)) key.forEach(k => this.element.setAttribute('data-' + k, gettype(value, s) ? value : JSON.stringify(value)));
                else throw new Error('Invalid Argument key');
            }
            return this;
        },
        /**
         * @param {string|Array|undefined} key
         * @returns {any}
         */
        get(key){
            let result;
            if (this.element instanceof Element) {
                if (key === undef) {
                    result = {};
                    this.keys().forEach(k => result[k] = this.get(k));
                } else if (gettype(key, s)) {
                    let value = this.element.getAttribute('data-' + key);
                    if (gettype(value, s)) {
                        try {
                            result = JSON.parse(value);
                        } catch (e) {
                            result = value;
                        }
                    }
                } else if (Array.isArray(key)) {
                    result = {};
                    key.forEach(k => result[k] = this.get(k));
                }
            }
            return result;
        },
        /**
         * @param {string|Array} key
         * @returns {boolean}
         */
        has(key){
            if (this.element instanceof Element) {
                if (gettype(key, s)) key = [key];
                if (Array.isArray(key)) return key.every(k => this.element.hasAttribute('data-' + k));
            }
            return false;
        },
        /**
         * @param {string|Array} key
         * @returns {DataSet}
         */
        remove(key){
            if (this.element instanceof Element) {
                if (gettype(key, s)) key = [key];
                if (Array.isArray(key)) {
                    key.forEach(k => this.element.removeAttribute('data-' + k));
                }
            }
            return this;
        },
        clear(){
            return this.remove(this.keys());
        },

        keys(){

            let result = [];

            if (this.element instanceof Element) {
                let attrs = this.element.attributes;
                for (let i = 0; i < attrs.length; i++) {
                    let name = attrs[i].name;
                    if (name.indexOf('data-') === 0) result.push(name.substr(5));
                }
            }
            return result;
        }

    };

    /**
     * Get element siblings
     * @param {Element} element
     * @param {string} [selector]
     * @returns {Array}
     */
    function siblings(element, selector){
        let retval = [];
        if (element instanceof Element) {
            if (element.parentElement !== null) {
                let list = element.parentElement.children;
                for (let i = 0; i < list.length; i++) {
                    let el = list[i];
                    if (el === element) continue;
                    if (gettype(selector, s) && !el.matches(selector)) continue;
                    retval.push(el);
                }
            }
        }
        return retval;
    }



    function prequire(...variables){


        return new Promise(resolve => {

            let sources = prequire._sources;
            if (variables.length === 0) return;

            variables.forEach(v => {
                let source, match = false;
                for (let i = 0; i < sources.length; i++) {
                    source = sources[i];
                    if (source.vars.includes(v)) {
                        match = true;
                        if (!source.loaded) {
                            source.urls.forEach(u => {
                                if (/\.css$/.test(u)) loadcss(u);
                                else loadjs(u);
                            });
                            source.loaded = true;
                        }
                        break;
                    }

                }
                if (match === false) throw new Error('Cannot require ' + v);
            });

            let result = {};
            const check = function(){
                variables.forEach(v => {
                    if (typeof self[v] !== u) result[v] = self[v];
                });
                if (variables.length === Object.keys(result).length) {
                    resolve(result);
                    return true;
                }
            };

            if (check() === true) return;

            new Timer(timer => {
                if (check() === true) timer.stop();
            }, 10, 10 * second);
        });

    }

    prequire.sources = function(varname, url){
        if (typeof url === s) url = [url];
        if (!Array.isArray(url)) return false;
        if (typeof varname === s) varname = [varname];
        if (!Array.isArray(varname)) return false;
        if (!prequire._sources) prequire._sources = [];
        let sources = prequire._sources;
        sources.push({
            vars: varname,
            urls: url,
            loaded: false
        });
        return true;
    };

    if (config && typeof config.get === f) {
        let sources = config.get('sources');
        if (Array.isArray(sources)) {
            prequire._sources = sources;
        }
    }





    return Object.assign( {
        s, b, f, o, u, n, string, bool, object, number, int, float,
        second, minute, hour, day, week, year, month, doc, global, extend,
        uniqid, html2element, html2doc, copyToClipboard, Text2File, ON, isValidSelector, Timer,
        addstyle, loadjs, addscript, loadcss, isValidUrl, getURL, sanitizeFileName, ResizeSensor, NodeFinder,
        Events, trigger, rfetch, assert, isPlainObject, gettype, sprintf, vsprintf, DataSet, siblings, prequire
    });

}));

