/**
 * Utilities for gm scripts
 * @link https://cdn.jsdelivr.net/gh/ngsoft/userscripts@latest/dist/gmutils.min.js
 */


const GMinfo = (GM_info ? GM_info : (typeof GM === 'object' && GM !== null && typeof GM.info === 'object' ? GM.info : null));
const scriptname = `${GMinfo.script.name} version ${GMinfo.script.version}`, UUID = GMinfo.script.uuid;

// Scallar types
const s = "string", b = "boolean", f = "function", o = "object", u = "undefined", n = "number", doc = document;

let undef;

//time
const second = 1000, minute = 60 * second, hour = minute * 60, day = hour * 24, week = day * 7, year = 365 * day, month = Math.round(year / 12);


function isPlainObject(v) {
    return v instanceof Object && Object.getPrototypeOf(v) === Object.prototype;
}


function isArray(v) {
    return Array.isArray(v);
}


/**
 * Run a callback
 * @param {function} ...callbacks Run callback in order
 * @returns {undefined}
 */
function on(callback){
    const callbacks = [];
    for (let i = 0; i < arguments.length; i++) {
        let arg = arguments[i];
        if (typeof arg === f) callbacks.push(arg);
    }
    callbacks.forEach(c => c.call());
}
/**
 * Run a Callback when body is created
 * @param {function} callback
 * @returns {Promise}
 */
on.body = function(){
    return new Promise(resolve => {

        let resolver = body => {
            if (arguments.length > 0) on(...arguments);
            resolve(doc.body);
        };

        if (doc.body === null) {
            const observer = new MutationObserver((mutations, obs) => {
                let ready = false;
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (typeof node.matches === f ? node.matches('body') : false) {
                            obs.disconnect();
                            ready = true;
                        }
                    });
                });
                if (ready === true) resolver();

            });
            observer.observe(doc.documentElement, {childList: true});
        } else resolver();

    });
};

/**
 * Run a callback when page is loading DOMContentLoaded
 * @param {function} callback
 * @returns {Promise}
 */
on.load = function(){
    return new Promise(resolve => {

        let resolver = body => {
            if (arguments.length > 0) on(...arguments);
            resolve(doc.body);
        };
        if (doc.readyState === "loading") {
            doc.addEventListener("DOMContentLoaded", function(){
                resolver();
            });
        } else resolve();


    });
};

/**
 * Run a callback when page is completely loaded
 * @param {function} callback
 * @returns {Promise}
 */
on.loaded = function(){
    return new Promise(resolve => {

        let resolver = body => {
            if (arguments.length > 0) on(...arguments);
            resolve(doc.body);
        };

        if (doc.readyState !== "complete") {
            addEventListener("load", function(){
                resolver();
            });

        } else resolver();

    });
};


/**
 * Creates an HTMLElement from html code
 * @param {string} html
 * @returns {HTMLElement}
 */
function html2element(html) {
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
    if (typeof html === s && html.length > 0) {
        node.innerHTML = html;
    }
    return node;
}

/**
 * Adds CSS to the bottom of the body
 * @param {string} css
 * @returns {undefined}
 */
function addcss(css) {
    if (typeof css === "string" && css.length > 0) {
        let s = doc.createElement('style');
        s.setAttribute('type', "text/css");
        s.appendChild(doc.createTextNode('<!-- ' + css + ' -->'));
        on.body(() => {
            doc.body.appendChild(s);
        });
    }
}

/**
 * Adds CSS to the bottom of the head
 * @param {string} css
 * @returns {undefined}
 */
function addstyle(css) {
    if (typeof css === "string" && css.length > 0) {
        let s = doc.createElement('style');
        s.setAttribute('type', "text/css");
        s.appendChild(doc.createTextNode('<!-- ' + css + ' -->'));
        doc.head.appendChild(s);
    }
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
 * Checks if url is valid
 * @param {string} url
 * @returns {boolean}
 */
function isValidUrl(url) {
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
function getURL(uri) {
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



/**
 * Loads an external script
 * @param {string} src
 * @param {function} callback
 * @param {boolean} defer
 * @returns {undefined}
 */
function loadjs(src, callback, defer) {
    if (isValidUrl(src)) {
        let script = doc.createElement('script');
        script.type = 'text/javascript';
        if (defer === true) script.defer = true;
        if (typeof callback === f) {
            script.onload = callback;
        }
        doc.head.appendChild(script);
        script.src = src;
    }
}

/**
 * Adds script to the bottom of the head
 * @param {string} src
 * @returns {undefined}
 */
function addscript(src) {
    if (typeof src === s && src.length > 0) {
        let s = doc.createElement("script");
        s.setAttribute("type", "text/javascript");
        s.appendChild(doc.createTextNode(src));
        doc.head.appendChild(s);
    }
}

/**
 * Loads an external CSS
 * @param {string} src
 * @returns {undefined}
 */
function loadcss(src) {
    if (isValidUrl(src)) {
        let style = doc.createElement('link');
        style.rel = "stylesheet";
        style.type = 'text/css';
        doc.head.appendChild(style);
        style.href = src;
    }
}

/**
 * Copy given text to clipboard
 * @param {string} text
 * @returns {boolean}
 */
function copyToClipboard(text) {
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


/**
 * Dispatches an Event
 * @param {EventTarget} el
 * @param {string} type
 * @param {any} data
 * @returns {undefined}
 */
function trigger(el, type, data) {
    if (el instanceof EventTarget) {
        if (typeof type === s) {
            let event;
            type.split(/\s+/).forEach((t) => {
                if (el.parentElement === null) event = new Event(type);
                else event = new Event(t, {bubbles: true, cancelable: true});
                event.data = data;
                el.dispatchEvent(event);
            });
        }
    }
}

/**
 * Creates a new Timer
 * @param {function} callback
 * @param {number|undefined} interval
 * @param {number|undefined} timeout
 * @returns {Timer}
 */
class Timer {
    /**
     * Starts the timer
     * @returns {undefined}
     */
    start() {
        if (this.started !== true && typeof this.params.callback === f) {
            const self = this;
            self.__interval = setInterval(() => {
                self.params.callback.call(self, self);
            }, self.params.interval);
            if (self.params.timeout > 0) {
                self.__timeout = setTimeout(() => {
                    self.stop();
                }, self.params.timeout);
            }
            self.started = true;
        }

    }
    /**
     * Stops the timer
     * @returns {undefined}
     */
    stop() {
        if (this.started === true) {
            const self = this;
            self.started = false;
            if (self.__interval !== null) clearInterval(self.__interval);
            if (self.__timeout !== null) clearTimeout(self.__timeout);
            self.__timeout = null;
            self.__interval = null;
        }
    }

    /**
     * Creates a new Timer
     * @param {function} callback
     * @param {number|undefined} interval
     * @param {number|undefined} timeout
     * @returns {Timer}
     */
    constructor(callback, interval, timeout) {
        if (typeof callback === f) {
            const self = this;
            Object.assign(self, {
                params: {
                    callback: callback,
                    interval: 10,
                    timeout: 0
                },
                started: false,
                __interval: null,
                __timeout: null
            });
            if (typeof interval === n) self.params.interval = interval;
            if (typeof timeout === n) self.params.timeout = timeout;
            self.start();
        }
    }
}

/**
 * Uses Mutation Observer + intervals(some sites blocks observers) to find new nodes
 * And test them against params (Use NodeFinder instead, find is to be removed)
 */
const find = (function () {

    const obsopts = {
            attributes: true,
            //characterData: true,
        //childList: true,
            subtree: true
        },
        defaults = {
            selector: "",
            onload: null,
            timeout: 0,
            interval: 0
        };

    class SimpleObserver {
        start() {
            const self = this;
            if (self.worker.params.interval > 0) {
                self.worker.interval = setInterval(self.worker.runner, self.worker.params.interval);
                if (self.worker.params.timeout > 0) {
                    self.worker.timeout = setTimeout(function () {
                        clearInterval(self.worker.interval);
                    }, self.worker.params.timeout);
                }
            }
            self.worker.observer.observe(self.worker.params.base, obsopts);
        }
        stop() {
            if (typeof this.worker.timeout !== u) clearTimeout(this.worker.timeout);
            if (typeof this.worker.interval !== u) clearInterval(this.worker.interval);
            if (typeof this.worker.observer !== u) this.worker.observer.disconnect();
        }
        constructor(runner, obs, params) {
            this.worker = {
                params: params,
                observer: obs,
                runner: runner
            };
        }
    }
    return function findNode(options) {
        let params = Object.assign({}, defaults),
            base = doc;
        for (let i = 0; i < arguments.length; i++) {
            let arg = arguments[i];
            switch (typeof arg) {
                case o:
                    if (arg instanceof Element || arg instanceof Document) {
                        base = arg;
                    } else if (isPlainObject(arg)) {
                        Object.assign(params, arg);
                    }
                    break;
                case f:
                    params.onload = arg;
                    break;
                case s:
                    params.selector = arg;
                    break;
                case n:
                    params.interval = 10;
                    params.timeout = arg;
                    break;
                default:
                    break;
            }
        }

        if (typeof params.onload === f && typeof params.selector === s && typeof base.addEventListener === f) {

            const matches = [];
            let simpleobs, interval, timeout, observer;
            params.base = base;

            const runner = function runner() {
                base.querySelectorAll(params.selector).forEach(function (element) {
                    if (!matches.includes(element)) {
                        matches.push(element);
                        trigger(element, 'DOMNodeCreated', {
                            element: element,
                            params: params,
                            observer: simpleobs
                        });
                        params.onload.call(element, element, simpleobs, params);
                    }
                });
            };

            observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node instanceof Element) {
                            if ((node = node.closest(params.selector)) !== null) {
                                if (!matches.includes(node)) {
                                    matches.push(node);
                                    trigger(node, 'DOMNodeCreated', {
                                        element: node,
                                        params: params,
                                        observer: simpleobs
                                    });
                                    params.onload.call(node, node, simpleobs, params);
                                }

                            }
                        }
                    });
                });
            });
            simpleobs = new SimpleObserver(runner, observer, params);
            simpleobs.start();

            on.load(runner);
            on.loaded(runner);

        }

    };

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
            this._params.observer = new MutationObserver(m => {
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
                binding[method] = function (...args) {
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
    on(type, listener, options) {
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
    one(type, listener, capture) {
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
    off(type, listener, capture) {
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
    trigger(type, data) {
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
                event.data = data;
                self.target.dispatchEvent(event);
            });
        }
        return this;
    }


};

/**
 * DataStore Interface
 * @type {Class}
 */
class DataStore {
    constructor() {
        if (!(["get", "set", "has", "remove", "clear"].every(x => typeof this[x] === f))) {
            throw new Error("DataStore Interface Error : Missing Methods.");
        }
        Object.defineProperty(this, '_isDataStore', {
            value: true,
            configurable: true
        });
    }
}

/**
 * Store data into localStorage or sessionStorage
 * @type {Class}
 * @extends {Datastore}
 * @param {Storage} storage
 */
class xStore extends DataStore {

    constructor(storage) {
        super();
        if (!(storage instanceof Storage)) {
            throw new Error('xStore : argument not instance of Storage');
        }
        Object.defineProperty(this, '_storage', {
            value: storage,
            configurable: true
        });
    }

    get(key) {
        let retval, sval;
        //get one
        if (typeof key === s) {
            if ((sval = this._storage.getItem(key)) !== null) {
                try {
                    retval = JSON.parse(sval);
                } catch (e) {
                    retval = sval;
                }
            }
        } else if (typeof key === u) {
            //get all
            retval = {};
            for (let i = 0; i < this._storage.length; i++) {
                key = this._storage.key(i);
                retval[key] = this.get(key);
            }
        }
        return retval;

    }
    set(key, val) {
        if (typeof key === s && typeof val !== u) {
            if(typeof val !== s){
                let sval = val;
                try {
                    val = JSON.stringify(sval);
                } catch (e) {
                    val = sval;
                }
            }
            this._storage.setItem(key, val);

        } else if (isPlainObject(key)) {
            Object.keys(key).forEach((k) => {
                this.set(k, key[k]);
            });
        }
        return this;

    }
    has(key) {
        return typeof this.get(key) !== u;

    }
    remove(key) {
        if (typeof key === s) {
            key = key.split(' ');
        }
        if (isArray(key)) {
            key.forEach((k) => {
                this._storage.removeItem(k);
            });
        }
        return this;
    }
    clear() {
        this._storage.clear();
        return this;
    }

}


/* jshint -W117 */
/**
 * Store data into GreaseMonkey 3 or Tampermonkey
 * @type {Class}
 * @extends {DataStore}
 */
class gmStore extends DataStore {
    static get available() {
        return ["GM_getValue", "GM_setValue", "GM_deleteValue", "GM_listValues"].every((fn) => {
            /*jshint evil:true */
            try {
                if (typeof (eval(fn)) === f) return true;
            } catch (e) {
                return false;
            }
            /*jshint evil:false */
        });
    }

    constructor() {
        super();

        let disabled = [];
        ["GM_getValue", "GM_setValue", "GM_deleteValue", "GM_listValues"].forEach((fn) => {
            /*jshint evil:true */
            try {
                if (typeof (eval(fn)) !== f) disabled.push(fn);
            } catch (e) {
                disabled.push(fn);
            }
            /*jshint evil:false */
        });
        if (disabled.length > 0) {
            if (disabled.length === 4) {
                console.warn("gmStore disabled.");
                return;
            }
            disabled.forEach((fn) => {
                console.warn('gmStore cannot use', fn);
            });
        }
    }



    get(key) {
        let retval = undef;
        //get one
        if (typeof key === s) {
            if (typeof GM_getValue === f) {
                retval = GM_getValue(key); // eslint-disable-line
            }
        } else if (typeof key === u) {
            //get all
            retval = {};
            if (typeof GM_listValues === f) {
                GM_listValues().forEach((key) => { // eslint-disable-line
                    retval[key] = this.get(key);
                });
            }
        }
        return retval;

    }
    set(key, val) {

        if (typeof key === s && typeof val !== u) {
            if (typeof GM_setValue === f) {
                GM_setValue(key, val); // eslint-disable-line
            }
        } else if (isPlainObject(key)) {
            Object.keys(key).forEach((k) => {
                this.set(k, key[k]);
            });
        }
        return this;
    }
    has(key) {
        return typeof this.get(key) !== u;
    }
    remove(key) {
        if (typeof key === s) {
            key = key.split(' ');
        }
        if (isArray(key)) {
            if (typeof GM_deleteValue === f) {
                key.forEach((k) => {
                    GM_deleteValue(k); // eslint-disable-line
                });
            }
        }
        return this;
    }

    clear() {
        Object.keys(this.get()).forEach((key) => {
            this.remove(key);
        });
        return this;
    }

}

/* jshint +W117 */

/**
 * Injects defaults settings into gmStore
 */
class UserSettings extends gmStore {
    /**
     * @param {Object} defaults a plain object containing defaults settings
     * @returns {UserSettings}
     */
    constructor(defaults) {
        super();
        if (isPlainObject(defaults)) {
            Object.keys(defaults).forEach((x) => {
                if (typeof this.get(x) !== typeof defaults[x]) {
                    this.set(x, defaults[x]);
                }
            }, this);
        }

    }

}

/**
 * Cache Item
 * @link https://www.php-fig.org/psr/psr-6/
 */
class LSCacheItem {

    constructor(key, hit, value) {
        this.key = key;
        this.hit = hit === true;
        this.value = value;
    }
    /**
     * Returns the key for the current cache item.
     *
     * The key is loaded by the Implementing Library, but should be available to
     * the higher level callers when needed.
     *
     * @returns {string} The key string for this cache item.
     */
    getKey() {
        return this.key;
    }

    /**
     * Retrieves the value of the item from the cache associated with this object's key.
     *
     * The value returned must be identical to the value originally stored by set().
     *
     * If isHit() returns false, this method MUST return null. Note that null
     * is a legitimate cached value, so the isHit() method SHOULD be used to
     * differentiate between "null value was found" and "no value was found."
     *
     * @return {any} The value corresponding to this cache item's key, or undefined if not found.
     */
    get() {
        return this.value;
    }

    /**
     * Confirms if the cache item lookup resulted in a cache hit.
     *
     * Note: This method MUST NOT have a race condition between calling isHit()
     * and calling get().
     *
     * @return {boolean} True if the request resulted in a cache hit. False otherwise.
     */
    isHit() {
        return this.hit === true;
    }

    /**
     * Sets the value represented by this cache item.
     *
     * The $value argument may be any item that can be serialized by PHP,
     * although the method of serialization is left up to the Implementing
     * Library.
     *
     * @param {any} value
     *
     * @return {LSCacheItem}   The invoked object.
     */
    set(value) {
        this.value = value;
        return this;
    }

    /**
     * Sets the expiration time for this cache item.
     *
     * @param {Date|number} expiration
     *
     * @return {LSCacheItem} The called object.
     */
    expiresAt(expiration) {
        if (typeof expiration === n) expiration = new Date(expiration);
        if (expiration instanceof Date) this.expire = expiration;
        return this;
    }


    /**
     * Sets the expiration time for this cache item.
     *
     * @param {number} time
     *
     * @return {LSCacheItem} The called object.
     */
    expiresAfter(time) {
        if (typeof time === n) {
            let tt = +new Date();
            tt += time;
            this.expiration = new Date(tt);
        }
    }


}




/**
 * Cache data into localStorage
 * Item Cache Pool
 * @link https://www.php-fig.org/psr/psr-6/
 */
class LSCache {
    /**
     * @returns {xStore}
     */
    get storage() {
        return this.__store__;
    }
    set storage(val) {
        if (val instanceof DataStore) this.__store__ = val;
    }
    get ttl() {
        return this.__ttl__;
    }
    set ttl(ttl) {
        if (typeof ttl === n) this.__ttl__ = ttl;
    }

    get deferred() {
        if (typeof this.__deferred__ === u) this.__deferred__ = [];
        return this.__deferred__;
    }

    get expire() {
        if (typeof this.__expire__ === u) {
            let key = this.prefix + "LSCache";
            this.__expire__ = this.storage.get(key) || {};
        }

        return this.__expire__;
    }

    set expire(obj) {
        if (isPlainObject(obj)) {
            this.__expire__ = obj;
            let key = this.prefix + "LSCache";
            this.storage.set(key, obj);
        }
    }

    get prefix() {
        return this.__prefix__ + ":";
    }

    /**
     * @param {string} prefix
     * @param {number} ttl
     */
    constructor(prefix = "", ttl = 60000, storage){
        if (!(storage instanceof DataStore)) storage = new xStore(localStorage);
        this.storage = storage;
        this.__prefix__ = "";
        if (typeof prefix === s) this.__prefix__ = prefix;
        this.ttl = typeof ttl === n ? ttl : 60000;
        this.__removeExpired();

    }

    __removeExpired(){

        let expired = this.expire, now = +new Date(), keys = Object.keys(expired);
        for (let i = 0; i < keys.length; i++) {
            if (now > expired[keys[i]]) {
                this.deleteItem(keys[i]);
            }
        }

    }

    /**
     * Returns a Cache Item representing the specified key.
     *
     * This method must always return a CacheItemInterface object, even in case of
     * a cache miss. It MUST NOT return null.
     *
     * @param {string} key The key for which to return the corresponding Cache Item.
     *
     *
     * @return {LSCacheItem} The corresponding Cache Item.
     */
    getItem(key) {
        if (typeof key !== s) throw new Error("Invalid Argument");
        let value, pkey = this.prefix + key;
        if(this.hasItem(key)) value = this.storage.get(pkey);
        return new LSCacheItem(key, value !== undef, value);
    }

    /**
     * Returns a traversable set of cache items.
     *
     * @param {Array} keys An indexed array of keys of items to retrieve.
     *
     *
     * @return {Array}.
     */
    getItems(keys = []) {
        let ret = [];
        if (isArray(keys)) {
            for (let i = 0; i < keys.length; i++) {
                ret.push(this.getItem(keys[i]));
            }
        }
        return ret;
    }
    /**
     * Confirms if the cache contains specified cache item.
     *
     * Note: This method MAY avoid retrieving the cached value for performance reasons.
     * This could result in a race condition with CacheItemInterface::get(). To avoid
     * such situation use CacheItemInterface::isHit() instead.
     *
     * @param {string} key The key for which to check existence.
     *
     *
     * @return {boolean}   True if item exists in the cache, false otherwise.
     */
    hasItem(key) {
        if (typeof key !== s) throw new Error("Invalid Argument");
        this.__removeExpired();
        return this.storage.has(this.prefix + key);
    }

    /**
     * Deletes all items in the pool.
     *
     * @return {boolean}  True if the pool was successfully cleared. False if there was an error.
     */
    clear() {

        let storage = this.storage._storage, key;
        for (let i = 0; i < storage.length; i++) {
            key = storage.key(i);
            if (key.indexOf(this.prefix) === 0) {
                storage.removeItem(key);
            }
        }
        this.expire = {};
        return true;
    }

    /**
     * Removes the item from the pool.
     *
     * @param {string} key The key to delete.
     *
     *
     * @return {boolean} True if the item was successfully removed. False if there was an error.
     */
    deleteItem(key) {
        if (typeof key !== s) throw new Error("Invalid Argument");
        let exp = this.expire;
        delete(exp[key]);
        this.expire = exp;
        this.storage.remove(this.prefix + key);
        return true;
    }

    /**
     * Removes multiple items from the pool.
     *
     * @param {Array} keys
     *   An array of keys that should be removed from the pool.

     *
     * @return {boolean}
     *   True if the items were successfully removed. False if there was an error.
     */
    deleteItems(keys) {
        if (isArray(keys)) {
            for (let i = 0; i < keys.length; i++) {
                this.deleteItem(keys[i]);
            }
        }
        return true;
    }
    /**
     * Persists a cache item immediately.
     *
     * @param {LSCacheItem} item
     *   The cache item to save.
     *
     * @return {boolean} True if the item was successfully persisted. False if there was an error.
     */
    save(item) {
        if (item instanceof LSCacheItem) {

            let expire = item.expiration || new Date((+new Date()) + this.ttl),
                data = this.expire;
            data[item.getKey()] = +expire;
            this.expire = data;
            let key = this.prefix + item.getKey();
            this.storage.set(key, item.value !== undef ? item.value : null);
            return true;

        }
        return false;

    }

    /**
     * Sets a cache item to be persisted later.
     *
     * @param {LSCacheItem} item
     *   The cache item to save.
     *
     * @return {boolean}  False if the item could not be queued or if a commit was attempted and failed. True otherwise.
     */
    saveDeferred(item) {
        if (item instanceof LSCacheItem) {

            this.deferred.push(item);
            return true;

        }
    }

    /**
     * Persists any deferred cache items.
     *
     * @return {boolean}  True if all not-yet-saved items were successfully saved or there were none. False otherwise.
     */
    commit() {
        let item;
        while ((item = this.deferred.shift())) {
            this.save(item);
        }

        return true;
    }
}


/**
 * Resource Loader
 * @param {string} prefix
 * @param {number} ttl
 * @returns {rloader}
 */
function rloader(prefix, ttl) {
    if (!(this instanceof rloader)) return new rloader(cache, ttl);
    prefix = typeof prefix === s ? prefix : "";
    ttl = typeof ttl === n ? ttl : 5000;
    this.__cache__ = new LSCache(prefix, ttl);
}

rloader.prototype = {
    /**
     * Checks if key exists
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return this.__cache__.hasItem(key);
    },
    /**
     * Get a resource by key
     * @param {string} key
     * @returns {string|undefined}
     */
    get(key) {
        let item = this.__cache__.getItem(key);
        return item.get();
    },
    /**
     * Loads a Ressource
     * @param {string} [url] Must be set first if key is defined
     * @param {function} [callback] a callback to load after
     * @param {string} [key]
     * @param {number} [expire]
     * @param {Object} [options] overrides {url: 'https://...', onload(){}, key: "mykey", expire: 5000}
     * @returns {rloader.prototype}
     */
    require() {
        const params = {
            expire: this.__cache__.ttl,
            onload: null,
            url: null,
            key: null
        }, self = this;
        //parse arguments
        for (let i = 0; i < arguments.length; i++) {
            let arg = arguments[i];
            switch (typeof arg) {
                case n:
                    params.expire = arg;
                    break;
                case s:
                    if (typeof params.url === s) params.key = arg;
                    else params.url = arg;
                    break;
                case f:
                    params.onload = arg;
                    break;
                case o:
                    if (isPlainObject(arg)) Object.assign(params, arg);
                    break;
                default :
                    break;
            }
        }

        if (!isValidUrl(params.url)) throw new Error("Invalid Url.");
        let url = new URL(getURL(params.url)), ext;
        if (params.key === null) params.key = url.pathname.split("/").pop();
        if (/\.js$/i.test(params.key)) ext = "js";
        else if (/\.css$/i.test(params.key)) ext = "css";


        let item = this.__cache__.getItem(params.key), load = () => {
            switch (ext) {
                case "css":
                    addstyle(item.get());
                    break;
                case "js":
                    addscript(item.get());
                    break;
                default :
                    break;
            }
            if (typeof params.onload === f) params.onload(item.get());
        };
        if (!item.isHit()) {
            fetch(url.href, {
                method: "GET",
                redirect: "follow",
                cache: "no-store"
            }).then(r => {
                if (r.status === 200) return r.text();
                else {
                    console.warn(r);
                    throw new Error("Cannot get the resource " + url.href);
                }
            }).then((text) => {
                if (text.length > 0) {
                    item.set(text);
                    item.expiresAfter(params.ttl);
                    self.__cache__.save(item);
                    load();
                }
            }).catch(console.warn);
        } else load();
        return this;
    },
    /**
     * Clears the cache
     * @returns {boolean}
     */
    clear() {
        return this.__cache__.clear();
    }

};





/**
 * Set or Get value from Element.dataset
 * @param {string|object} key
 * @param {any} value
 * @returns {any}
 */
HTMLElement.prototype.data = function(key, value) {
    const self = this;
    if (typeof key === s) {
        if (typeof value !== u) {
            if (value === null) delete(self.dataset[key]);
            else self.dataset[key] = typeof value === s ? value : JSON.stringify(value);
        } else if ((value = self.dataset[key]) !== undef) {
            let retval;
            try {
                retval = JSON.parse(value);
            } catch (e) {
                retval = value;
            }
            return retval;
        }
        return undef;
    } else if (isPlainObject(key)) {
        Object.keys(key).forEach((k) => {
            self.data(k, key[k]);
        });
        return undef;
    } else if (typeof key === u) {
        //returns all data
        let retval = {};
        Object.keys(this.dataset).forEach((k) => {
            retval[k] = self.data(k);
        });
        return retval;
    }
};


HTMLElement.prototype.siblings = function(selector){
    const self = this, retval = [];
    selector = typeof selector === s ? selector : null;
    if (self.parentElement !== null) {
        let list = self.parentElement.children;
        for (let i = 0; i < list.length; i++) {
            let el = list[i];
            if(el === self) continue;
            if (selector !== null ? el.matches(selector) === false : false) continue;
            retval.push(el);
        }
    }
    return retval;
};

/**
 * Set or Get value from Element.dataset
 * @param {string|object} key
 * @param {any} value
 * @returns {undefined}
 */
NodeList.prototype.data = function(key, value) {
    const self = this;
    if (((typeof key === s) || typeof key === u) && (typeof value === u)) {
        //reads from first element
        if (self.length > 0) return self[0].data(key);
        return undef;
    } else self.forEach((el) => {
            el.data(key, value);
        });
};


/**
 * ISO Language Codes (639-1 and 693-2) and IETF Language Types
 * language-codes-3b2
 * @link https://datahub.io/core/language-codes
 * @link https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/gmutils.min.js
 */
const isoCode = (() => {

    /**
     * Get Langage infos using langcode
     * @param {string} langcode
     * @returns {Object}
     */
    function getLangInfos(langcode){
        let result = {
            lang: "Undetermined",
            codes: ["und", "und"]
        };
        if (typeof langcode === s && langcode.length > 0) {
            if (langcode.length > 1 && langcode.length < 4) result = getLangInfos.map.get(langcode.toLowerCase()) || result;
            else result = getLangInfos.reverse.get(langcode.toLowerCase()) || result;
        }
        return result;
    }

    const data = JSON.parse(`[{"English": "Serbo-Croatian", "alpha2": "sh", "alpha3-b": "hbs"},{"English": "Afar", "alpha2": "aa", "alpha3-b": "aar"},{"English": "Abkhazian", "alpha2": "ab", "alpha3-b": "abk"},{"English": "Afrikaans", "alpha2": "af", "alpha3-b": "afr"},{"English": "Akan", "alpha2": "ak", "alpha3-b": "aka"},{"English": "Albanian", "alpha2": "sq", "alpha3-b": "alb"},{"English": "Amharic", "alpha2": "am", "alpha3-b": "amh"},{"English": "Arabic", "alpha2": "ar", "alpha3-b": "ara"},{"English": "Aragonese", "alpha2": "an", "alpha3-b": "arg"},{"English": "Armenian", "alpha2": "hy", "alpha3-b": "arm"},{"English": "Assamese", "alpha2": "as", "alpha3-b": "asm"},{"English": "Avaric", "alpha2": "av", "alpha3-b": "ava"},{"English": "Avestan", "alpha2": "ae", "alpha3-b": "ave"},{"English": "Aymara", "alpha2": "ay", "alpha3-b": "aym"},{"English": "Azerbaijani", "alpha2": "az", "alpha3-b": "aze"},{"English": "Bashkir", "alpha2": "ba", "alpha3-b": "bak"},{"English": "Bambara", "alpha2": "bm", "alpha3-b": "bam"},{"English": "Basque", "alpha2": "eu", "alpha3-b": "baq"},{"English": "Belarusian", "alpha2": "be", "alpha3-b": "bel"},{"English": "Bengali", "alpha2": "bn", "alpha3-b": "ben"},{"English": "Bihari languages", "alpha2": "bh", "alpha3-b": "bih"},{"English": "Bislama", "alpha2": "bi", "alpha3-b": "bis"},{"English": "Bosnian", "alpha2": "bs", "alpha3-b": "bos"},{"English": "Breton", "alpha2": "br", "alpha3-b": "bre"},{"English": "Bulgarian", "alpha2": "bg", "alpha3-b": "bul"},{"English": "Burmese", "alpha2": "my", "alpha3-b": "bur"},{"English": "Catalan; Valencian", "alpha2": "ca", "alpha3-b": "cat"},{"English": "Chamorro", "alpha2": "ch", "alpha3-b": "cha"},{"English": "Chechen", "alpha2": "ce", "alpha3-b": "che"},{"English": "Chinese", "alpha2": "zh", "alpha3-b": "chi"},{"English": "Church Slavic; Old Slavonic; Church Slavonic; Old Bulgarian; Old Church Slavonic", "alpha2": "cu", "alpha3-b": "chu"},{"English": "Chuvash", "alpha2": "cv", "alpha3-b": "chv"},{"English": "Cornish", "alpha2": "kw", "alpha3-b": "cor"},{"English": "Corsican", "alpha2": "co", "alpha3-b": "cos"},{"English": "Cree", "alpha2": "cr", "alpha3-b": "cre"},{"English": "Czech", "alpha2": "cs", "alpha3-b": "cze"},{"English": "Danish", "alpha2": "da", "alpha3-b": "dan"},{"English": "Divehi; Dhivehi; Maldivian", "alpha2": "dv", "alpha3-b": "div"},{"English": "Dutch; Flemish", "alpha2": "nl", "alpha3-b": "dut"},{"English": "Dzongkha", "alpha2": "dz", "alpha3-b": "dzo"},{"English": "English", "alpha2": "en", "alpha3-b": "eng"},{"English": "Esperanto", "alpha2": "eo", "alpha3-b": "epo"},{"English": "Estonian", "alpha2": "et", "alpha3-b": "est"},{"English": "Ewe", "alpha2": "ee", "alpha3-b": "ewe"},{"English": "Faroese", "alpha2": "fo", "alpha3-b": "fao"},{"English": "Fijian", "alpha2": "fj", "alpha3-b": "fij"},{"English": "Finnish", "alpha2": "fi", "alpha3-b": "fin"},{"English": "French", "alpha2": "fr", "alpha3-b": "fre"},{"English": "Western Frisian", "alpha2": "fy", "alpha3-b": "fry"},{"English": "Fulah", "alpha2": "ff", "alpha3-b": "ful"},{"English": "Georgian", "alpha2": "ka", "alpha3-b": "geo"},{"English": "German", "alpha2": "de", "alpha3-b": "ger"},{"English": "Gaelic; Scottish Gaelic", "alpha2": "gd", "alpha3-b": "gla"},{"English": "Irish", "alpha2": "ga", "alpha3-b": "gle"},{"English": "Galician", "alpha2": "gl", "alpha3-b": "glg"},{"English": "Manx", "alpha2": "gv", "alpha3-b": "glv"},{"English": "Greek, Modern (1453-)", "alpha2": "el", "alpha3-b": "gre"},{"English": "Guarani", "alpha2": "gn", "alpha3-b": "grn"},{"English": "Gujarati", "alpha2": "gu", "alpha3-b": "guj"},{"English": "Haitian; Haitian Creole", "alpha2": "ht", "alpha3-b": "hat"},{"English": "Hausa", "alpha2": "ha", "alpha3-b": "hau"},{"English": "Hebrew", "alpha2": "he", "alpha3-b": "heb"},{"English": "Herero", "alpha2": "hz", "alpha3-b": "her"},{"English": "Hindi", "alpha2": "hi", "alpha3-b": "hin"},{"English": "Hiri Motu", "alpha2": "ho", "alpha3-b": "hmo"},{"English": "Croatian", "alpha2": "hr", "alpha3-b": "hrv"},{"English": "Hungarian", "alpha2": "hu", "alpha3-b": "hun"},{"English": "Igbo", "alpha2": "ig", "alpha3-b": "ibo"},{"English": "Icelandic", "alpha2": "is", "alpha3-b": "ice"},{"English": "Ido", "alpha2": "io", "alpha3-b": "ido"},{"English": "Sichuan Yi; Nuosu", "alpha2": "ii", "alpha3-b": "iii"},{"English": "Inuktitut", "alpha2": "iu", "alpha3-b": "iku"},{"English": "Interlingue; Occidental", "alpha2": "ie", "alpha3-b": "ile"},{"English": "Interlingua (International Auxiliary Language Association)", "alpha2": "ia", "alpha3-b": "ina"},{"English": "Indonesian", "alpha2": "id", "alpha3-b": "ind"},{"English": "Inupiaq", "alpha2": "ik", "alpha3-b": "ipk"},{"English": "Italian", "alpha2": "it", "alpha3-b": "ita"},{"English": "Javanese", "alpha2": "jv", "alpha3-b": "jav"},{"English": "Japanese", "alpha2": "ja", "alpha3-b": "jpn"},{"English": "Kalaallisut; Greenlandic", "alpha2": "kl", "alpha3-b": "kal"},{"English": "Kannada", "alpha2": "kn", "alpha3-b": "kan"},{"English": "Kashmiri", "alpha2": "ks", "alpha3-b": "kas"},{"English": "Kanuri", "alpha2": "kr", "alpha3-b": "kau"},{"English": "Kazakh", "alpha2": "kk", "alpha3-b": "kaz"},{"English": "Central Khmer", "alpha2": "km", "alpha3-b": "khm"},{"English": "Kikuyu; Gikuyu", "alpha2": "ki", "alpha3-b": "kik"},{"English": "Kinyarwanda", "alpha2": "rw", "alpha3-b": "kin"},{"English": "Kirghiz; Kyrgyz", "alpha2": "ky", "alpha3-b": "kir"},{"English": "Komi", "alpha2": "kv", "alpha3-b": "kom"},{"English": "Kongo", "alpha2": "kg", "alpha3-b": "kon"},{"English": "Korean", "alpha2": "ko", "alpha3-b": "kor"},{"English": "Kuanyama; Kwanyama", "alpha2": "kj", "alpha3-b": "kua"},{"English": "Kurdish", "alpha2": "ku", "alpha3-b": "kur"},{"English": "Lao", "alpha2": "lo", "alpha3-b": "lao"},{"English": "Latin", "alpha2": "la", "alpha3-b": "lat"},{"English": "Latvian", "alpha2": "lv", "alpha3-b": "lav"},{"English": "Limburgan; Limburger; Limburgish", "alpha2": "li", "alpha3-b": "lim"},{"English": "Lingala", "alpha2": "ln", "alpha3-b": "lin"},{"English": "Lithuanian", "alpha2": "lt", "alpha3-b": "lit"},{"English": "Luxembourgish; Letzeburgesch", "alpha2": "lb", "alpha3-b": "ltz"},{"English": "Luba-Katanga", "alpha2": "lu", "alpha3-b": "lub"},{"English": "Ganda", "alpha2": "lg", "alpha3-b": "lug"},{"English": "Macedonian", "alpha2": "mk", "alpha3-b": "mac"},{"English": "Marshallese", "alpha2": "mh", "alpha3-b": "mah"},{"English": "Malayalam", "alpha2": "ml", "alpha3-b": "mal"},{"English": "Maori", "alpha2": "mi", "alpha3-b": "mao"},{"English": "Marathi", "alpha2": "mr", "alpha3-b": "mar"},{"English": "Malay", "alpha2": "ms", "alpha3-b": "may"},{"English": "Malagasy", "alpha2": "mg", "alpha3-b": "mlg"},{"English": "Maltese", "alpha2": "mt", "alpha3-b": "mlt"},{"English": "Mongolian", "alpha2": "mn", "alpha3-b": "mon"},{"English": "Nauru", "alpha2": "na", "alpha3-b": "nau"},{"English": "Navajo; Navaho", "alpha2": "nv", "alpha3-b": "nav"},{"English": "Ndebele, South; South Ndebele", "alpha2": "nr", "alpha3-b": "nbl"},{"English": "Ndebele, North; North Ndebele", "alpha2": "nd", "alpha3-b": "nde"},{"English": "Ndonga", "alpha2": "ng", "alpha3-b": "ndo"},{"English": "Nepali", "alpha2": "ne", "alpha3-b": "nep"},{"English": "Norwegian Nynorsk; Nynorsk, Norwegian", "alpha2": "nn", "alpha3-b": "nno"},{"English": "Bokm\u00e5l, Norwegian; Norwegian Bokm\u00e5l", "alpha2": "nb", "alpha3-b": "nob"},{"English": "Norwegian", "alpha2": "no", "alpha3-b": "nor"},{"English": "Chichewa; Chewa; Nyanja", "alpha2": "ny", "alpha3-b": "nya"},{"English": "Occitan (post 1500); Proven\u00e7al", "alpha2": "oc", "alpha3-b": "oci"},{"English": "Ojibwa", "alpha2": "oj", "alpha3-b": "oji"},{"English": "Oriya", "alpha2": "or", "alpha3-b": "ori"},{"English": "Oromo", "alpha2": "om", "alpha3-b": "orm"},{"English": "Ossetian; Ossetic", "alpha2": "os", "alpha3-b": "oss"},{"English": "Panjabi; Punjabi", "alpha2": "pa", "alpha3-b": "pan"},{"English": "Persian", "alpha2": "fa", "alpha3-b": "per"},{"English": "Pali", "alpha2": "pi", "alpha3-b": "pli"},{"English": "Polish", "alpha2": "pl", "alpha3-b": "pol"},{"English": "Portuguese", "alpha2": "pt", "alpha3-b": "por"},{"English": "Pushto; Pashto", "alpha2": "ps", "alpha3-b": "pus"},{"English": "Quechua", "alpha2": "qu", "alpha3-b": "que"},{"English": "Romansh", "alpha2": "rm", "alpha3-b": "roh"},{"English": "Romanian; Moldavian; Moldovan", "alpha2": "ro", "alpha3-b": "rum"},{"English": "Rundi", "alpha2": "rn", "alpha3-b": "run"},{"English": "Russian", "alpha2": "ru", "alpha3-b": "rus"},{"English": "Sango", "alpha2": "sg", "alpha3-b": "sag"},{"English": "Sanskrit", "alpha2": "sa", "alpha3-b": "san"},{"English": "Sinhala; Sinhalese", "alpha2": "si", "alpha3-b": "sin"},{"English": "Slovak", "alpha2": "sk", "alpha3-b": "slo"},{"English": "Slovenian", "alpha2": "sl", "alpha3-b": "slv"},{"English": "Northern Sami", "alpha2": "se", "alpha3-b": "sme"},{"English": "Samoan", "alpha2": "sm", "alpha3-b": "smo"},{"English": "Shona", "alpha2": "sn", "alpha3-b": "sna"},{"English": "Sindhi", "alpha2": "sd", "alpha3-b": "snd"},{"English": "Somali", "alpha2": "so", "alpha3-b": "som"},{"English": "Sotho, Southern", "alpha2": "st", "alpha3-b": "sot"},{"English": "Spanish; Castilian", "alpha2": "es", "alpha3-b": "spa"},{"English": "Sardinian", "alpha2": "sc", "alpha3-b": "srd"},{"English": "Serbian", "alpha2": "sr", "alpha3-b": "srp"},{"English": "Swati", "alpha2": "ss", "alpha3-b": "ssw"},{"English": "Sundanese", "alpha2": "su", "alpha3-b": "sun"},{"English": "Swahili", "alpha2": "sw", "alpha3-b": "swa"},{"English": "Swedish", "alpha2": "sv", "alpha3-b": "swe"},{"English": "Tahitian", "alpha2": "ty", "alpha3-b": "tah"},{"English": "Tamil", "alpha2": "ta", "alpha3-b": "tam"},{"English": "Tatar", "alpha2": "tt", "alpha3-b": "tat"},{"English": "Telugu", "alpha2": "te", "alpha3-b": "tel"},{"English": "Tajik", "alpha2": "tg", "alpha3-b": "tgk"},{"English": "Tagalog", "alpha2": "tl", "alpha3-b": "tgl"},{"English": "Thai", "alpha2": "th", "alpha3-b": "tha"},{"English": "Tibetan", "alpha2": "bo", "alpha3-b": "tib"},{"English": "Tigrinya", "alpha2": "ti", "alpha3-b": "tir"},{"English": "Tonga (Tonga Islands)", "alpha2": "to", "alpha3-b": "ton"},{"English": "Tswana", "alpha2": "tn", "alpha3-b": "tsn"},{"English": "Tsonga", "alpha2": "ts", "alpha3-b": "tso"},{"English": "Turkmen", "alpha2": "tk", "alpha3-b": "tuk"},{"English": "Turkish", "alpha2": "tr", "alpha3-b": "tur"},{"English": "Twi", "alpha2": "tw", "alpha3-b": "twi"},{"English": "Uighur; Uyghur", "alpha2": "ug", "alpha3-b": "uig"},{"English": "Ukrainian", "alpha2": "uk", "alpha3-b": "ukr"},{"English": "Urdu", "alpha2": "ur", "alpha3-b": "urd"},{"English": "Uzbek", "alpha2": "uz", "alpha3-b": "uzb"},{"English": "Venda", "alpha2": "ve", "alpha3-b": "ven"},{"English": "Vietnamese", "alpha2": "vi", "alpha3-b": "vie"},{"English": "Volap\u00fck", "alpha2": "vo", "alpha3-b": "vol"},{"English": "Welsh", "alpha2": "cy", "alpha3-b": "wel"},{"English": "Walloon", "alpha2": "wa", "alpha3-b": "wln"},{"English": "Wolof", "alpha2": "wo", "alpha3-b": "wol"},{"English": "Xhosa", "alpha2": "xh", "alpha3-b": "xho"},{"English": "Yiddish", "alpha2": "yi", "alpha3-b": "yid"},{"English": "Yoruba", "alpha2": "yo", "alpha3-b": "yor"},{"English": "Zhuang; Chuang", "alpha2": "za", "alpha3-b": "zha"},{"English": "Zulu", "alpha2": "zu", "alpha3-b": "zul"}]`);
    const map = new Map();
    const reversemap = new Map();

    getLangInfos.data = data.map((entry, index) => {
        let newentry = {
            lang: entry.English,
            langword: entry.English.replace(/^([\w\-]+).*$/, '$1'),
            codes: [entry.alpha2, entry["alpha3-b"]]
        };
        map.set(entry.alpha2, newentry);
        map.set(entry["alpha3-b"], newentry);
        reversemap.set(entry.English.toLowerCase(), newentry);
        return newentry;
    }).sort((a, b) => a.langword.localeCompare(b.langword));

    getLangInfos.map = map;
    getLangInfos.reverse = reversemap;



    return getLangInfos;
})();



/**
 * Userscripts Dialog Box
 */
class gmDialog {


    set title(t){
        if ((typeof t === s)) this.elements.title.innerHTML = t;
        else if (body instanceof Element) {
            this.elements.body.innerHTML = null;
            this.elements.body.appendChild(body);
        }
    }

    set body(body){
        if (typeof body === s) this.elements.body.innerHTML = body;
        else if (body instanceof Element) {
            this.elements.body.innerHTML = null;
            this.elements.body.appendChild(body);
        }
        //only text?
        this.elements.body.classList.remove('gm-flex-center');
        if (this.elements.body.children.length === 0) this.elements.body.classList.add('gm-flex-center');
    }

    get isClosed(){
        return this.root.parentElement === null;
    }


    open(callback){
        if (typeof callback === f) this.one('confirm', callback);
        this.trigger('open');
    }

    close(){
        this.trigger('close');
    }

    /**
     * Older firefox scroll hack
     */
    setScroll(){
        //mozilla firefox scroll hack
        //on a up to date version document.documentElement.style["scrollbar-width"] is a string (so CSS is working)
        if (/firefox/i.test(navigator.userAgent) ? document.documentElement.style["scrollbar-width"] === undef : false) {

            //small css trick to get the scrollbar width (must be 17px but cannot be sure)
            if (typeof gmDialog.scrollbarSize !== n) {
                let
                        scrollable = doc.createElement('div'),
                        contents = doc.createElement('div'),
                        scrollablestyle, contentsstyle;
             
                scrollable.appendChild(contents);
                scrollablestyle = contentsstyle = "width: 100%;padding:0;margin:0;display:block;overflow: unset;height:auto;";
                scrollablestyle += "overflow-y: scroll;opacity:0;z-index:-1;";
                contentsstyle += "height: 1px;";
                scrollable.style = scrollablestyle;
                contents.style = contentsstyle;
                doc.body.appendChild(scrollable);
                gmDialog.scrollbarSize = scrollable.offsetWidth - contents.offsetWidth;
                doc.body.removeChild(scrollable);

            }
            let
                    body = this.elements.body,
                    scrollbarSize = gmDialog.scrollbarSize;

            if (scrollbarSize > 0) {
                body.style["margin-right"] = `-${ 50 + scrollbarSize }px`; //adds the scrollbar size
                body.style["padding-right"] = "50px"; // do not add the scrollbar size to prevent layout gap
            }

        }
    }

    /**
     * auto resize dialog
     */
    setSize(){
        const body = this.elements.body;

        body.style["max-height"] = body.style.height = null; //reset style
        let
                max = this.root.offsetHeight,
                dialogHeight = this.elements.dialog.offsetHeight,
                minus = this.elements.header.offsetHeight + this.elements.footer.offsetHeight,
                available = max - minus - 1,
                current = body.offsetHeight;

        if (current > available) body.style["max-height"] = available + "px";
        if ((dialogHeight > max) || (max < 640) || (innerWidth < 950) || this.elements.dialog.classList.contains('gm-dialog-fullscreen')) {
            body.style.height = available + "px";
        }

    }

    constructor(parent, settings){
        settings = settings || {};
        if (!(parent instanceof Element)) parent = doc.body;
        Object.assign(this, {
            parent: parent,
            root: html2element('<div class="gm-dialog-overlay" />'),
            elements: {
                dialog: html2element('<div class="gm-dialog" />'),
                header: html2element('<div class="gm-dialog-header" />'),
                title: html2element('<h1 class="gm-dialog-title" />'),
                body: html2element('<div class="gm-dialog-body" />'),
                footer: html2element('<div class="gm-dialog-footer" />'),
                buttons: {
                    yes: html2element(`<span class="gm-btn gm-btn-yes" name="yes">Yes</span>`),
                    no: html2element(`<span class="gm-btn gm-btn-no" name="no">No</span>`),
                    close: html2element('<span class="gm-btn gm-btn-close" name="close">&times;</span>')
                }
            },
            config: Object.assign({
                overlayclickclose: true,
                closebutton: true,
                fullscreen: false,
                width: null,
                height: null,
                position: {
                    top: null,
                    right: null,
                    bottom: null,
                    left: null,
                    center: true
                },
                buttons: {
                    yes: "Yes",
                    no: "No"
                },
                events: {},
                title: doc.title,
                body: ""
            }, settings),
            events: {
                btn_yes(){
                    this.trigger("confirm close");
                },
                btn_no(){
                    this.trigger('cancel close');
                },
                btn_close(){
                    this.trigger('cancel close');
                },
                keydown(e){
                    if (e.keyCode === 27) {
                        this.trigger('cancel close');
                    }
                }

            }
        });
        const self = this, dialog = self.elements.dialog;

        self.root.appendChild(self.elements.dialog);
        dialog.appendChild(self.elements.header);
        dialog.appendChild(self.elements.body);
        dialog.appendChild(self.elements.footer);
        self.elements.header.appendChild(self.elements.title);
        self.elements.header.appendChild(self.elements.buttons.close);
        self.elements.footer.appendChild(self.elements.buttons.no);
        self.elements.footer.appendChild(self.elements.buttons.yes);

        Object.keys(self.config.buttons).forEach(btn => {
            if (self.elements.buttons[btn] instanceof Element) self.elements.buttons[btn].innerHTML = self.config.buttons[btn];
        });

        new Events(self.root, self);

        //reads config

        const conf = self.config;
        ["title", "body"].forEach(key => self[key] = conf[key]);

        //position
        if(conf.position instanceof Object){
            ["top", "right", "bottom", "left"].forEach(key => {
                let val = conf.position[key];
                if (typeof val === n) val += "px";
                if (typeof val === s) dialog.style[key] = val;
            });
            if (conf.position.center === true) dialog.classList.add('gm-dialog-screencenter');
        }

        if (conf.fullscreen === true) dialog.classList.add('gm-dialog-fullscreen');

        //dimensions
        ["width", "height"].forEach(key => {
            let val = conf[key];
            if (typeof val === n) val += "px";
            if (typeof val === s) dialog.style[key] = val;
        });

        //close btn
        if (conf.closebutton !== true) self.elements.buttons.close.hidden = self.elements.buttons.close.disabled = true;

        //disable buttons
        Object.keys(self.elements.buttons).forEach(name => {
            let btn = self.elements.buttons[name];
            Object.defineProperties(btn, {
                disabled: {
                    set(v){
                        v = v === false ? null : v;
                        this.classList[v === null ? "remove" : "add"]('disabled');
                    }, get(){
                        return this.classList.contains('disabled');
                    }
                }
            });
        });



        Object.keys(self.config.events).forEach(evt => self.events[evt] = self.config.events[evt]);
        Object.keys(self.events).forEach(evt => self.on(evt, self.events[evt]));

        self.on('open close', e => {
            self.elements.dialog.classList.remove('fadeOut', 'fadeIn');
            if (e.type === "open") {
                if (self.isClosed) {
                    //prevent page scroll
                    doc.body.classList.add('gm-noscroll');
                    self.elements.dialog.classList.add('fadeIn');
                    self.parent.appendChild(self.root);
                    setTimeout(x => self.trigger('show'), 750);
                }

            } else {
                if (!self.isClosed) {
                    self.elements.dialog.classList.add('fadeOut');
                    setTimeout(() => {
                        self.parent.removeChild(self.root);
                        self.trigger('hide');

                    }, 750);
                }
            }

        }).on('click', e => {


            if ((e.target.closest('.gm-dialog') === null) && (self.config.overlayclickclose === true)) self.trigger('cancel close');

            let btn = e.target.closest('[name].gm-btn');
            if (btn !== null) {
                let name = btn.getAttribute('name'), type = "btn_" + name;
                self.trigger(type);
            }

        }).on('hide',e=>{
            //restore page scroll
            let allclosed = true;
            doc.documentElement.gmDialog.forEach(dialog => {
                if (dialog === self) return;
                if (dialog.isClosed === false) allclosed = false;
            });
            if (allclosed === true) doc.body.classList.remove('gm-noscroll');
        });

        //autoresize
        let l = () => {
            self.setSize();
        };

        self.on('hide', e => {
            removeEventListener('resize', l);
        }).on('show', e => {
            addEventListener('resize', l);
            ResizeSensor(self.elements.body, l);
            self.setSize();
        });

        self.setScroll();

        new gmStyles();
        //register current instance
        if (typeof doc.documentElement.gmDialog === u) {
            Object.defineProperty(doc.documentElement, 'gmDialog', {
                value: [], configurable: true
            });
        }
        doc.documentElement.gmDialog.push(self);
    }
}

/**
 *
 * @param {string} message Message to be shown
 * @param {function} confirm Confirm Callback
 * @param {function} [cancel] Cancel Callback
 * @param {Object} [params]
 * @returns {gmDialog}
 */
function ask(message, confirm, cancel, params){
    if (typeof confirm !== f) throw new Error("ask() no confirm callback supplied");
    if (typeof message !== s) throw new Error("ask() no message supplied");
    params = params instanceof Object ? params : {};
    const dialog = new gmDialog(doc.body, Object.assign({
        overlayclickclose: false,
        closebutton: false,
        body: message
    }, params));
    if (typeof cancel === f) dialog.one('cancel', cancel);
    dialog.open(confirm);
    return dialog;
}
/**
 *
 * @param {string} message Message to be shown
 * @param {function} [confirm] Confirm Callback
 * @param {Object} [params]
 * @returns {gmDialog}
 */
function alert(message, confirm, params){
    
    confirm = typeof confirm === f ? confirm : x => x;
    if (typeof message !== s) throw new Error("alert() no message supplied");
    params = params instanceof Object ? params : {};
    const dialog = new gmDialog(doc.body, Object.assign({

        body: message,
        buttons: {yes: "OK"}
    }, params));

    dialog.elements.buttons.no.remove();
    dialog.on('close', confirm);
    dialog.open();
    return dialog;
}




/**
 * Manages .gm-button
 */
class gmButtons {

    get buttons(){
        let result = {};
        this.list.forEach(item => {
            if (item.name.length > 0) {
                if (typeof result[item.name] === u) result[item.name] = [];
                result[item.name].push(item.element);
            }
        });
        return result;
    }

    constructor(root){
        if (root instanceof Element === false) throw new Error('gmButtons Invalid argument root');
        Object.defineProperties(this, {
            root: {configurable: true, enumerable: false, writable: false, value: root},
            list: {configurable: true, enumerable: false, writable: false, value: []}
        });
        const $this = this;

        NodeFinder(root).find('.gm-button', button => {
            let name = button.data('name') || "";
            if (button.data('uid') === undef) button.data('uid', uniqid());
            if (button.disabled === undef) {
                Object.defineProperty(button, 'disabled', {
                    configurable: true, enumerable: false,
                    get(){

                        return this.getAttribute('disabled') !== null;
                    },
                    set(flag){
                        this.setAttribute('disabled', '');
                        if (flag === null ? true : flag === false) this.removeAttribute('disabled');
                    }
                });

            }

            if (button.name === undef) {
                Object.defineProperty(button, 'name', {
                    configurable: true, enumerable: false,
                    get(){
                        return this.getAttribute('name') || "";
                    },
                    set(name){
                        this.setAttribute('name', name);
                        if (name === null) this.removeAttribute('name');
                    }
                });

            }
            if (button.name.length === 0 ? name.length > 0 : false) button.name = name;
            $this.list.push({
                name: name,
                element: button,
                uid: button.data('uid')
            });
        });


    }
}



const gmDialogNG = (function(){

    /**
     * Keeps trace of the current gmDialog instances
     */
    const dialogs = [];


    /**
     * Older firefox scroll hack 63-
     */
    function getScrollbarWidth(){
        let scrollbarSize = 0;
        //mozilla firefox scroll hack
        //on a up to date version document.documentElement.style["scrollbar-width"] is a string (so CSS is working)
        if (/firefox/i.test(navigator.userAgent) ? document.documentElement.style["scrollbar-width"] === undef : false) {

            //small css trick to get the scrollbar width (must be 17px but cannot be sure)

            let
                    scrollable = doc.createElement('div'),
                    contents = doc.createElement('div'),
                    scrollablestyle, contentsstyle;

            scrollable.appendChild(contents);
            scrollablestyle = contentsstyle = "width: 100%;padding:0;margin:0;display:block;overflow: unset;height:auto;";
            scrollablestyle += "overflow-y: scroll;opacity:0;z-index:-1;";
            contentsstyle += "height: 1px;";
            scrollable.style = scrollablestyle;
            contents.style = contentsstyle;
            doc.body.appendChild(scrollable);
            scrollbarSize = scrollable.offsetWidth - contents.offsetWidth;
            doc.body.removeChild(scrollable);
        }
        return scrollbarSize;
    }


    /**
     * auto resize dialog
     */
    function setSize($this){

        const body = $this.body;

        body.style["max-height"] = body.style.height = null; //reset style
        let
                max = $this.overlay.offsetHeight,
                dialogHeight = $this.dialog.offsetHeight,
                minus = $this.header.offsetHeight + $this.footer.offsetHeight + 16,
                available = max - minus - 1,
                current = body.offsetHeight;

        if (current > available) body.style["max-height"] = available + "px";
        if ((dialogHeight > max) || (max < 640) || (innerWidth < 950) || $this.dialog.classList.contains('gm-fullscreen')) {
            body.style.height = available + "px";
        }

    }


    function animateElement(elem, classes, duration, eventEnd = null){
        if (elem instanceof Element === false) throw new Error('animate invalid argument elem');
        if (typeof classes !== s) throw new Error('animate invalid argument classes');
        if (typeof duration !== n) throw new Error('animate invalid argument duration');
        if (typeof eventEnd !== s ? eventEnd !== null : false) throw new Error('animate invalid argument eventEnd');

        classes = classes.split(/\s+/);
        elem.classList.remove(...classes);
        elem.style["animation-duration"] = duration + "ms";
        elem.classList.add(...classes);
        setTimeout(() => {
            elem.classList.remove(...classes);
            elem.style["animation-duration"] = null;
            if (eventEnd !== null) trigger(elem, eventEnd);
        }, duration + 10);

    }

    const template =
            `<div class="gm-reset gm-overlay">
                    <dialog class="gm-dialog">
                        <header><h1></h1><span class="gm-button gm-rounded" data-name="close">&times;</span></header>
                        <section></section>
                        <footer>
                            <span class="gm-button error reverse" data-name="dismiss">Cancel</span>
                            <span class="gm-button info reverse" data-name="confirm">OK</span>
                        </footer>
                    </dialog>
                </div>`;

    class gmDialog {

        constructor(root, options){

            options = options || {};
            root = root || doc.body;

            if (root instanceof Element === false) throw new Error('gmDialog invalid argument root');
            if (!isPlainObject(options)) throw new Error('gmDialog invalid argument options');

            const
                    $this = this,
                    defaults = {

                        title: GMinfo.script.name,
                        body: "You are using " + GMinfo.scriptHandler + " version " + GMinfo.version,

                        overlayClickClose: true,
                        removeOnClose: true,
                        fullscreen: false,

                        width: null,
                        height: null,
                        position: {
                            top: null,
                            right: null,
                            bottom: null,
                            left: null,
                            center: true
                        },
                        confirmButton: 'OK',
                        dismissButton: 'Cancel',
                        closeButton: true,
                        events: {},
                        eventPrefix: 'gmdialog',

                        animate: true,

                        animateStart: true,
                        animateStartClasses: "fadeIn",
                        animateStartDuration: 750,

                        animateEnd: true,
                        animateEndClasses: "fadeOut",
                        animateEndDuration: 750

                    };

            Object.assign(this, {
                container: root,
                overlay: html2element(template),
                config: Object.assign({}, defaults, options)
            });

            Object.defineProperties(this, {
                elements: {configurable: true, writable: false, enumerable: false, value: {
                        dialog: $this.overlay.querySelector('dialog'),
                        header: $this.overlay.querySelector('header'),
                        title: $this.overlay.querySelector('h1'),
                        footer: $this.overlay.querySelector('footer'),
                        body: $this.overlay.querySelector('section'),
                        buttons: {}
                    }},
                root: {configurable: true, writable: false, enumerable: false, value: $this.overlay.querySelector('dialog')},
                ready: {configurable: true, writable: true, enumerable: false, value: false},
                status: {configurable: true, writable: true, enumerable: false, value: 0},
                sensor: {configurable: true, writable: true, enumerable: false, value: null}
            });


            //eventPrefix
            if (typeof this.config.eventPrefix === s ? this.config.eventPrefix.length > 0 : false) {
                if (/\.$/.test(this.config.eventPrefix) === false) this.config.eventPrefix += '.';
            } else this.config.eventPrefix = "";

            const
                    dialog = this.dialog,
                    conf = this.config,
                    buttons = this.elements.buttons,
                    //settings
                    eventPrefix = conf.eventPrefix,
                    //animations
                    animate = conf.animate === true,
                    animateStart = conf.animateStart === true,
                    animateEnd = conf.animateEnd === true,
                    animateStartClasses = conf.animateStartClasses,
                    animateEndClasses = conf.animateEndClasses,
                    animateStartDuration = conf.animateStartDuration,
                    animateEndDuration = conf.animateEndDuration,
                    //event types
                    open = eventPrefix + 'open',
                    close = eventPrefix + 'close',
                    show = eventPrefix + 'show',
                    hide = eventPrefix + 'hide',
                    init = eventPrefix + 'init',
                    ready = eventPrefix + 'ready',
                    confirm = eventPrefix + 'confirm',
                    dismiss = eventPrefix + 'dismiss',
                    //listeners
                    resize = function(){
                        setSize($this);
                    },
                    keydown = function(e){
                        if (e.keyCode === 27) $this.confirm = false;
                    },
                    overlay = function(e){
                        if (e.target === $this.overlay) $this.confirm = false;
                    };

            //fix dialog firefox 53+ dom.dialog_element.enabled=false
            if (dialog.open === undef) {
                Object.defineProperties(dialog, {
                    open: {
                        configurable: true, enumerable: false,
                        get(){
                            return this.getAttribute('open') !== null;
                        },
                        set(flag){
                            this.setAttribute('open', '');
                            if (flag === null ? true : flag === false) this.removeAttribute('open');
                        }
                    }
                });
            }


            //buttons mapping
            this.dialog.querySelectorAll('[data-name].gm-button').forEach(el => $this.elements.buttons[el.data('name')] = el);


            //events
            new Events(this.dialog, this);
            const
                    events = {
                        click(e){
                            let btn = e.target.closest('.gm-button');
                            if (btn !== null) {
                                if (btn.name.length > 0 ? typeof actions[btn.name] === f : false) actions[btn.name].call($this, e);
                            }

                        }
                    },
                    dialogEvents = {
                        init(e){

                            if (conf.overlayClickClose === true) {
                                $this.overlay.addEventListener('click', overlay);
                            }

                            dialog.classList.remove('gm-fullscreen');
                            if (conf.fullscreen === true) dialog.classList.add('gm-fullscreen');

                            //position
                            if (isPlainObject(conf.position)) {
                                let flag = false;
                                ["top", "right", "bottom", "left"].forEach(key => {
                                    let val = conf.position[key];
                                    if (typeof val === n) val += "px";
                                    if (typeof val === s) {
                                        dialog.style[key] = val;
                                        flag = true;
                                    }
                                });
                                dialog.classList.remove('gm-screencenter');
                                if (conf.position.center === true ? flag === false : false) dialog.classList.add('gm-screencenter');
                            }

                            //dimensions
                            ["width", "height"].forEach(key => {
                                let val = conf[key];
                                if (typeof val === n) val += "px";
                                if (typeof val === s) dialog.style[key] = val;
                            });

                            buttons.close.hidden = buttons.dismiss.hidden = buttons.confirm.hidden = null;
                            //close btn
                            if (conf.closeButton !== true) buttons.close.hidden = true;
                            //confirm and dismiss buttons
                            if (typeof conf.confirmButton === s ? conf.confirmButton.length > 0 : false) {
                                buttons.confirm.innerHTML = conf.confirmButton;
                            } else buttons.confirm.hidden = true;
                            if (typeof conf.dismissButton === s ? conf.dismissButton.length > 0 : false) {
                                buttons.dismiss.innerHTML = conf.dismissButton;
                            } else buttons.dismiss.hidden = true;


                            if ($this.ready === true) return;
                            new gmButtons(dialog);
                            let scroll = getScrollbarWidth();
                            if (scroll > 0) {
                                $this.body.style["padding-right"] = "50px";
                                $this.body.style["margin-right"] = -(50 + scroll) + "px";
                            }
                            $this.ready = true;
                            $this.trigger(ready);
                        },
                        open(){
                            $this.trigger(init);
                            if (dialog.open === true) return;
                            $this.status = 0;
                            $this.container.classList.add('gm-noscroll');
                            $this.overlay.hidden = null;
                            if (!$this.container.contains($this.overlay)) $this.container.appendChild($this.overlay);

                            if (animate === true && animateStart === true) {
                                animateElement($this.dialog, animateStartClasses, animateStartDuration, show);
                            } else $this.trigger(show);
                            dialog.open = true;

                        },
                        show(){
                            // ESC dismiss
                            if (conf.overlayClickClose === true) addEventListener('keydown', keydown);
                            //autoresize
                            addEventListener('resize', resize);
                            if ($this.sensor === null) $this.sensor = ResizeSensor($this.body, resize);
                            else $this.sensor.start();
                            resize();

                        },
                        close(e){
                            if (dialog.open === false) return;
                            if (this.status === 0) this.status = 2;
                            if (animate === true && animateEnd === true) {
                                animateElement($this.dialog, animateEndClasses, animateEndDuration, hide);
                            } else $this.trigger(show);
                            dialog.open = true;
                        },
                        hide(){
                            removeEventListener('resize', resize);
                            removeEventListener('keydown', keydown);
                            $this.overlay.removeEventListener('click', overlay);
                            $this.sensor.stop();
                            dialog.open = false;
                            if (conf.removeOnClose === true) $this.container.removeChild($this.overlay);
                            else $this.overlay.hidden = true;

                            //restore scroll
                            let allclosed = true;
                            dialogs.forEach(dialog => {
                                if (dialog === $this) return;
                                if (dialog.container === $this.container ? dialog.isClosed === false : false) allclosed = false;
                            });
                            if (allclosed === true) $this.container.classList.remove('gm-noscroll');
                            if ($this.status === 1) $this.trigger(confirm);
                            else $this.trigger(dismiss);
                        }

                    },
                    actions = {
                        close(){
                            $this.confirm = false;
                        },
                        dismiss(){
                            $this.confirm = false;
                        },
                        confirm(){
                            $this.confirm = true;
                        }

                    };
            //dom events
            Object.keys(events).forEach(type => {
                if (typeof events[type] === f) $this.on(type, events[type]);
            });
            //custom events
            Object.keys(dialogEvents).forEach(type => {
                if (typeof dialogEvents[type] === f) $this.on(eventPrefix + type, dialogEvents[type]);
            });
            //injected events
            if (isPlainObject(conf.events)) {
                Object.keys(conf.events).forEach(type => {
                    if (typeof conf.events[type] === f) $this.on(eventPrefix + type, conf.events[type]);
                });
            }

            //set body and title
            ["body", "title"].forEach(key => $this[key] = conf[key]);
            //register dialog
            dialogs.push(this);

        }

        /** Methods **/

        /**
         * Open the dialog box
         * @returns {Promise}
         */
        open(){
            const $this = this;
            let retval = new Promise((resolve, reject) => {
                $this.one(this.config.eventPrefix + "confirm", e => {
                    resolve($this);
                }).one(this.config.eventPrefix + "dismiss", e => {
                    reject($this);
                });
            });

            if (this.isClosed) this.trigger(this.config.eventPrefix + "open");
            return retval;
        }

        /**
         * Close the dialog box
         * @returns {Promise}
         */
        close(){
            const $this = this;
            let retval = new Promise((resolve, reject) => {
                $this.one(this.config.eventPrefix + "hide", e => {
                    resolve($this);
                });
            });

            if (this.isClosed === false) this.confirm = false;
            return retval;

        }
        /**
         * To run when dialog is Ready
         * @returns {gmDialog}
         */
        onReady(callback){
            if (typeof callback === f) {
                if (this.ready === true) callback.call(this, this);
                else {
                    const $this = this;
                    this.on(this.config.eventPrefix + "ready", e => {
                        callback.call(this, this);
                    });
                }
            }
            return this;
        }

        /** Getters **/

        get isClosed(){
            return this.dialog.open === false;
        }

        get confirm(){
            return this.status === 1;
        }

        get dialog(){
            return this.elements.dialog;
        }
        get header(){
            return this.elements.header;
        }
        get footer(){
            return this.elements.footer;
        }
        get body(){
            return this.elements.body;
        }
        get title(){
            return this.elements.title;
        }

        /** Setters **/

        set confirm(val){
            if (typeof val === b ? this.status === 0 : false) {
                this.status = val === true ? 1 : 2;
                this.trigger(this.config.eventPrefix + "close");
            }
        }

        set isClosed(flag){
            if (typeof flag === b) this[flag === true ? "open" : "close"]();
        }

        set title(title){
            if ((typeof title === s)) this.elements.title.innerHTML = title;
            else if (title instanceof Element) {
                this.elements.title.innerHTML = null;
                this.elements.title.appendChild(title);
            }
        }

        set body(body){
            if (typeof body === s) this.elements.body.innerHTML = body;
            else if (body instanceof Element) {
                this.elements.body.innerHTML = null;
                this.elements.body.appendChild(body);
            }
            //only text?
            this.elements.body.classList.remove('gm-flex-center');
            if (this.elements.body.children.length === 0) this.elements.body.classList.add('gm-flex-center');
        }

    }


    return gmDialog;

})();










/**
 * UserScripts flash messages
 */
class gmFlash {

    /**
     * Creates gmFlash instance that displays message after the provided element
     * @param {HTMLElement} element
     * @param {Object} [params]
     * @returns {gmFlash}
     */
    static after(element, params){
        let instance;
        params = isPlainObject(params) ? params : {};
        params.afterContainer = true;
        if (element instanceof Element) instance = new this(element, params);
        return instance;
    }
    /**
     * Creates gmFlash instance that displays message inside the provided element
     * @param {HTMLElement} element
     * @param {Object} [params]
     * @returns {gmFlash}
     */
    static appendTo(element, params){
        let instance;
        params = isPlainObject(params) ? params : {};
        if (element instanceof Element) instance = new this(element, params);

        return instance;
    }
    /**
     * Creates gmFlash instance that displays message inside the provided element
     * @param {HTMLElement} element
     * @param {Object} [params]
     * @returns {gmFlash}
     */
    static prependTo(element, params){
        let instance;
        params = isPlainObject(params) ? params : {};
        params.appendChild = false;
        if (element instanceof Element) instance = new this(element, params);

        return instance;
    }

    /**
     * Display a Flash Message
     * @param {string|HTMLElement}  message         Message to display
     * @param {number}              [timeout]       Timeout for the message to disappear (defaults 2000ms, set it to 0 to disable it)
     * @param {string}              [classes]       Classes to add to the message
     * @param {function}            [start]         Callback to use when message is displayed
     * @param {function}            [end]           Callback to use when message is removed 
     * @param {boolean}             [removeOnClick] Removes message when clicked
     * @returns {gmFlash}
     */
    flash(message){

        if (!(message instanceof Element) ? (typeof message !== s ? message.length > 0 : false) : false) throw new Error("gmFlash invalid message.");
        const self = this;
        //defaults arguments
        const cfg = self.config;
        let timeout = cfg.timeout > 0 ? cfg.timeout : null,
                classes = cfg.classes.length > 0 ? cfg.classes.split(/\s+/) : [],
                removeOnClick = cfg.removeOnClick === true,
                start = null,
                end = null;
        //parse arguments
        if (arguments.length > 1) {
            for (let i = 1; i < arguments.length; i++) {
                let val = arguments[i];
                if (typeof val === n) timeout = val > 0 ? val : null;
                if (typeof val === s ? val.length > 0 : false) val.split(/\s+/).forEach(c => classes.push(c));
                if (typeof val === f) {
                    if (typeof start === f) end = val;
                    else start = val;
                }
                if (typeof val === b) removeOnClick = val;

            }
        }
        if (typeof start === f ? typeof end !== f : false) {
            end = start;
            start = x => x;
        }
        start = typeof start === f ? start : x => x;
        end = typeof end === f ? end : x => x;

        const
                afterContainer = cfg.afterContainer,
                appendChild = cfg.appendChild,
                eventPrefix = cfg.prefix,
                animate = cfg.animate,
                gmFlashClass = cfg.gmflash,
                container = self.root,
                div = doc.createElement('div'),
                emit = new Events(div);

        const events = {
        
            init(){
                div.classList.add(gmFlashClass, ...classes);
                if (typeof message === s) div.innerHTML = message;
                else div.appendChild(message);
                emit.trigger(eventPrefix + "open");
            },
            open(){
                
                //attach element
                if (afterContainer === true) container.parentElement.insertBefore(div, container.nextElementSibling);
                else container.insertBefore(div, appendChild !== true ? container.firstElementChild : null);

                if (animate === true ? cfg.animateStart === true : false) {
                    let cls = cfg.animateStartClasses.split(/\s+/),
                            duration = cfg.animateStartDuration;
                    div.style["animation-duration"] = duration + "ms";
                    div.classList.add(...cls);
                    setTimeout(() => {
                        div.style["animation-duration"] = null;
                        div.classList.remove(...cls);
                        emit.trigger(eventPrefix + "show " + eventPrefix + "start");
                    }, duration + 10);
                } else emit.trigger(eventPrefix + "show " + eventPrefix + "start");
            },
            close(){
                if (animate === true ? cfg.animateEnd === true : false) {
                    let cls = cfg.animateEndClasses.split(/\s+/),
                            duration = cfg.animateEndDuration;
                    div.style["animation-duration"] = duration + "ms";
                    div.classList.add(...cls);
                    setTimeout(() => {
                        emit.trigger(eventPrefix + "hide " + eventPrefix + "end");
                    }, duration + 10);
                } else emit.trigger(eventPrefix + "hide " + eventPrefix + "end");
            },
            start(){
                if (removeOnClick === true) {
                    div.style.cursor = "pointer";
                    emit.one('click', e => {
                        e.preventDefault();
                        emit.trigger(eventPrefix + "close");
                    });
                }
                if (timeout !== null) {
                    setTimeout(() => {
                        emit.trigger(eventPrefix + "close");
                    }, timeout);
                }
            },
            end(){
                div.remove();
            }
        };

        Object.keys(events).forEach(key => emit.on(eventPrefix + key, events[key]));

        emit
                .on(eventPrefix + "start", cfg.start)
                .one(eventPrefix + "start", start)
                .on(eventPrefix + "end", cfg.end)
                .one(eventPrefix + "end", end)
                .trigger(eventPrefix + "init");

        return this;
    }

    /**
     * Display a Message (alias of flash)
     * @param {string|HTMLElement}  message         Message to display
     * @param {number}              [timeout]       Timeout for the message to disappear (defaults 2000ms, set it to 0 to disable it)
     * @param {string}              [classes]       Classes to add to the message
     * @param {function}            [start]         Callback to use when message is displayed
     * @param {function}            [end]           Callback to use when message is removed
     * @param {boolean}             [removeOnClick] Removes message when clicked
     * @returns {gmFlash}
     */
    message(...args){
        return this.flash(...args);
    }

    /**
     * Display a Info Message
     * @param {string|HTMLElement}  message         Message to display
     * @param {number}              [timeout]       Timeout for the message to disappear (defaults 2000ms, set it to 0 to disable it)
     * @param {string}              [classes]       Classes to add to the message
     * @param {function}            [start]         Callback to use when message is displayed
     * @param {function}            [end]           Callback to use when message is removed
     * @param {boolean}             [removeOnClick] Removes message when clicked
     * @returns {gmFlash}
     */
    info(...args){
        if (args.length > 0) args.push(this.config.info);
        return this.flash(...args);
    }

    /**
     * Display a Warning Message
     * @param {string|HTMLElement}  message         Message to display
     * @param {number}              [timeout]       Timeout for the message to disappear (defaults 2000ms, set it to 0 to disable it)
     * @param {string}              [classes]       Classes to add to the message
     * @param {function}            [start]         Callback to use when message is displayed
     * @param {function}            [end]           Callback to use when message is removed
     * @param {boolean}             [removeOnClick] Removes message when clicked
     * @returns {gmFlash}
     */
    warning(...args){
        if (args.length > 0) args.push(this.config.warning);
        return this.flash(...args);
    }

    /**
     * Display a Success Message
     * @param {string|HTMLElement}  message         Message to display
     * @param {number}              [timeout]       Timeout for the message to disappear (defaults 2000ms, set it to 0 to disable it)
     * @param {string}              [classes]       Classes to add to the message
     * @param {function}            [start]         Callback to use when message is displayed
     * @param {function}            [end]           Callback to use when message is removed
     * @param {boolean}             [removeOnClick] Removes message when clicked
     * @returns {gmFlash}
     */
    success(...args){
        if (args.length > 0) args.push(this.config.success);
        return this.flash(...args);
    }

    /**
     * Display an Error Message
     * @param {string|HTMLElement}  message         Message to display
     * @param {number}              [timeout]       Timeout for the message to disappear (defaults 2000ms, set it to 0 to disable it)
     * @param {string}              [classes]       Classes to add to the message
     * @param {function}            [start]         Callback to use when message is displayed
     * @param {function}            [end]           Callback to use when message is removed
     * @param {boolean}             [removeOnClick] Removes message when clicked
     * @returns {gmFlash}
     */
    error(...args){
        if (args.length > 0) args.push(this.config.error);
        return this.flash(...args);
    }




    constructor(container, params){

        if (!(container instanceof Element)) throw new Error('gmFlash constructor needs a binding Element.');
        params = isPlainObject(params) ? params : {};


        const self = this, conf = {
            timeout: 2000,

            afterContainer: false,
            appendChild: true,
            removeOnClick: true,
            classes: "",

            start: x => x,
            end: x => x,


            gmflash: "gm-flash",
            prefix: "gmflash.",
            info: "info",
            warning: "warning",
            success: "success",
            error: "error",

            animate: true,

            animateStart: true,
            animateStartClasses: "fadeIn",
            animateStartDuration: 750,


            animateEnd: true,
            animateEndClasses: "fadeOut",
            animateEndDuration: 750
        };

        Object.assign(this, {
            root: container,
            config: Object.assign({}, conf, params)
        });

        Object.keys(conf).forEach(key => {
            let val = conf[key];
            if (typeof self.config[key] !== typeof val) self.config[key] = val;
        });

        if (!(/\.$/.test(self.config.prefix))) self.config.prefix += ".";
        new gmStyles();
    }


}

/**
 * Userscript Tab Management
 */
class gmTabs {


    isValidPath(path){
        return typeof path === s ? /^\/?[a-z][\w\-]+(?:\/[a-z][\w\-]+)?$/i.test(path) : false;
    }


    set path(path){

        if (this.isValidPath(path)) {
            if (path[0] === '/') path = path.substr(1);
            const self = this;
            path.split('/').forEach(name => {
                self.autopath.filter(x => x.name === name).forEach(item => trigger(item.tab, self.config.prefix + 'select', self));
            });
        }

    }


    constructor(root, params){
        root = root instanceof Element ? root : doc.body;

        params = params instanceof Object ? params : {};
        const
                self = this,
                events = {
                    init(e){
                        let container = e.target.closest(gmTabsSelector);
                        if (container === null) return;
                        //no selected tab
                        if (container.querySelector(`${gmTabSelector}${selectedSelector}`) === null) {
                            let first = container.querySelector(`${gmTabSelector}${datasetSelector}:not(${disabledSelector})`);
                            if (first !== null) first.classList.add(selectedClass);
                        }
                        //dimensions
                        let tabs = container.querySelectorAll(gmTabSelector),
                                percent = tabs.length > 0 ? ((1 / tabs.length) * 100) : null;
                        tabs.forEach(tab => {
                            if (autosize === true) tab.style.width = `${percent}%`;

                            let targetSelector = tab.data(dataset) || "";
                            if (isValidSelector(targetSelector)) {
                                let
                                        hidden = tab.matches(selectedSelector) ? null : true,
                                        name = tab.data(nameDataset) || "",
                                        target = self.root.querySelectorAll(targetSelector);


                                target.forEach(target => target.hidden = hidden);
                                if (name.length > 0 ? /^[a-z][\w\-]+$/i.test(name) : false) {
                                    self.autopath.push({
                                        name: name,
                                        tab: tab
                                    });
                                }
                                return;

                            }
                            tab.classList.add(disabledClass);
                        });

                        trigger(container, eventPrefix + "ready", self);

                    },

                    open(e){
                        let t = e.target;
                        t.hidden = null;
                        transition.start(t, () => {
                            trigger(t, eventPrefix + "show", self);
                        });
                    },
                    close(e){
                        e.target.hidden = true;
                        trigger(e.target, eventPrefix + "hide", self);
                    },

                    select(e){
                        let t = e.target.closest(`${gmTabsSelector} ${gmTabSelector}`);
                        if (t !== null) {
                            if (t.classList.contains(selectedClass)) return;
                            if (t.classList.contains(disabledClass)) return;
                            let siblings = t.closest(gmTabsSelector).querySelectorAll(`${gmTabSelector}:not(${disabledSelector})`);
                            self.root.querySelectorAll(t.data(dataset)).forEach(x => trigger(x, eventPrefix + "open", self));
                            t.classList.add(selectedClass);
                            siblings.forEach(x => {
                                if (x !== t) trigger(x, eventPrefix + "dismiss", self);
                            });
                        }
                    },

                    dismiss(e){
                        let t = e.target.closest(`${gmTabsSelector} ${gmTabSelector}`);
                        if (t !== null) {

                            t.classList.remove(selectedClass);
                            self.root.querySelectorAll(t.data(dataset)).forEach(x => trigger(x, eventPrefix + "close"), self);

                        }
                    }
                };


        const transition = {

            start(el, callback){
                if (el instanceof Element) {
                    if (animate === true) {
                        transition.cleanup(el);
                        setTimeout(() => {
                            typeof callback === f ? callback() : null;
                            transition.cleanup(el);
                        }, animateDuration + 10);
                        setTimeout(() => {
                            el.style["animation-duration"] = animateDuration + "ms";
                            el.classList.add(...animateClasses);
                        });
                    } else typeof callback === f ? callback() : null;
                }

            },
            cleanup(el){
                if (el instanceof Element) {
                    if (animate === true) {
                        el.classList.remove(...animateClasses);
                        el.style["animation-duration"] = null;
                    }
                }
            }
        };


        const cfg = {
            gmtabs: 'gm-tabs',
            gmtab: 'gm-tab',
            selected: 'active',
            disabled: 'disabled',
            dataset: 'tab',
            namedataset: 'name',
            prefix: 'gmtab.',
            events: {},
            autosize: true,
            animate: true,
            animateClasses: 'fadeIn',
            animateDuration: 750
        };

        Object.assign(this, {
            root: root,
            config: Object.assign({}, cfg, params),
            autopath: []
        });

        Object.keys(cfg).forEach(key => {
            let val = cfg[key];
            if (typeof self.config[key] !== typeof val) self.config[key] = val;
        });

        if (!(/\.$/.test(this.config.prefix))) this.config.prefix += ".";

        const
                gmTabsClass = this.config.gmtabs,
                gmtabClass = this.config.gmtab,
                selectedClass = this.config.selected,
                disabledClass = this.config.disabled,
                dataset = this.config.dataset,
                nameDataset = this.config.namedataset,
                gmTabsSelector = '.' + gmTabsClass,
                gmTabSelector = '.' + gmtabClass,
                selectedSelector = '.' + selectedClass,
                disabledSelector = '.' + disabledClass,
                datasetSelector = '[data-' + dataset + ']',
                namedatasetSelector = '[data-' + nameDataset + ']',
                eventPrefix = this.config.prefix,
                autosize = this.config.autosize === true,
                animate = this.config.animate === true,
                animateClasses = this.config.animateClasses.split(/\s+/),
                animateDuration = this.config.animateDuration;


        new Events(root, this);
        Object.keys(events).forEach(evt => {
            let type = eventPrefix + evt;
            self.on(type, events[evt]);
        });
        Object.keys(self.config.events).forEach(evt => {
            let type = eventPrefix + evt;
            self.on(type, self.config.events[evt]);
        });

        this.on('click', e => {
            let  target = e.target.closest(`${gmTabsSelector} ${gmTabSelector}`);
            if (target !== null) {
                e.preventDefault();
                if (target.matches(`:not(${selectedSelector})`)) Events(target).trigger(eventPrefix + 'select', self);
            }
        });

        //using new NodeFinder to match tabs whenever there are added to the dom (ajax load ...)
        NodeFinder(self.root).find(gmTabsSelector, container => trigger(container, eventPrefix + 'init', self));

        new gmStyles();
    }
}



/**
 * Dynamically load styles needed by gmUtils
 */
class gmStyles {

    get styles(){
        //gmDialog
        let styles = `
            [class*="gm-"]{font-family: Arial,Helvetica,sans-serif;font-size: 16px; font-weight: normal;line-height: 1.5;box-sizing: border-box;padding:0;margin:0;}
            .gm-dialog-overlay{position: fixed; top:0;left:0; right:0; bottom:0; z-index: 2147483647; background-color: rgba(0, 0, 0, 0.45);}
            .gm-dialog{
                position: absolute; top:10%; left: 15%;overflow: hidden;
                background-color: #FFF; border-radius: 6px;border: none; min-width: 256px; width: 60%;
            }
            .gm-dialog.gm-dialog-screencenter{top: 50%;left: 50%;right:auto;bottom:auto;transform: translate(-50%, -50%);}
            .gm-btn, button.gm-btn{
                padding: 8px 24px !important;border-radius: 4px; border: 1px solid rgba(0,0,0,0);cursor: pointer;display: inline-block;outline: 0;
                font-size: 16px;font-weight: 600;min-width: 96px;margin: 8px 4px;
                text-decoration: none;text-shadow: none;box-shadow: none;text-align: center;
                background-color: rgba(0,0,0,.125);border: 1px solid rgba(255,255,255,.25);color: rgb(28, 29, 30);
                
            }
            .gm-btn:hover, .gm-btn:active,
            button.gm-btn:hover, button.gm-btn:active
            {background-color: rgb(28, 29, 30);color: rgb(255, 255, 255); border: 1px solid rgba(255,255,255,.25);}
            .gm-dialog-footer .gm-btn + .gm-btn{margin-left: 16px;}
            .gm-dialog-header .gm-btn-close{padding: 4px 20px 3px !important;min-width: auto;float:right; margin: 4px -8px 0 0;}
            .gm-dialog-header .gm-btn-close:hover,.gm-dialog-header .gm-btn-close:active{background-color: #fafafa;color: rgb(28, 29, 30);background-color: rgba(0,0,0,.25);border-color: rgba(0,0,0,0)}
            button.gm-btn-no, .gm-btn-no{ color: rgb(219, 40, 40); }
            button.gm-btn-no:hover, button.gm-btn-no:active, 
            .gm-btn-no:hover, .gm-btn-no:active
            {background-color: rgb(219, 40, 40); color: rgb(255, 255, 255);}
            button.gm-btn-yes, .gm-btn-yes{ color: rgb(30, 130, 205); }
            button.gm-btn-yes:hover, button.gm-btn-yes:active,
            .gm-btn-yes:hover, .gm-btn-yes:active
            {background-color: rgb(30, 130, 205);color: rgb(255, 255, 255);}
            .gm-dialog-header, .gm-dialog-footer{min-height: 56px;padding: 8px 24px 12px 24px;background-color: rgba(0,0,0,.03);position: relative;clear:both;}
            .gm-dialog-header, .gm-dialog-body {border-bottom:1px solid rgba(0,0,0,.125);}
            .gm-dialog-header{background-color: rgba(0,0,0,.03);}
            .gm-dialog-body{ min-height: 96px;text-align: center; font-size: 24px; font-weight: normal;line-height: 1.5;color: #333;position:relative;padding: 0;margin:0;}
            .gm-dialog-body{overflow-y:scroll;scrollbar-width: none;ms-overflow-style: none;}
            .gm-dialog-body::-webkit-scrollbar { width: 0; height: 0;}
            .gm-dialog-body > *{margin: 0; padding: 0 24px;text-align: left;font-size: 20px;}
            .gm-dialog-body > *:last-child{padding-bottom: 24px;}
            .gm-dialog-body h1, .gm-dialog-body h2{display:block;font-size: 32px;text-align: left;padding: 16px 0;margin:0;border:0;font-weight: 500;}
            .gm-dialog-body h2{font-size: 24px;position:relative;padding: 8px 0 16px;margin: 0 0 16px;}
            .gm-dialog-body h2:before{background: rgba(34,36,38,.15);position: absolute;width:100%;bottom:0;display:block;content:"";height: 1px;}
            .gm-dialog-body a{color:rgba(100, 149, 237,.8);text-decoration:none;}
            .gm-dialog-body a:hover,.kodirpc-configurator a:active{color:rgba(100, 149, 237,1);}
            .gm-dialog-footer{ text-align: right;}
            .gm-dialog-title{position: absolute;top:12px;left:24px;font-size: 20px; font-weight: normal;line-height: 1.5; color: #333; text-decoration: none;}
            .gm-dialog form{display:block;position:relative;}
            .gm-dialog form:before{content:"";display:block;clear: both;width:0;height:1px;visibility:hidden;}
            .gm-dialog input, .gm-dialog textarea, .gm-dialog select{font-family: Arial,Helvetica,sans-serif;line-height: 1.5;font-weight: 600;color:#333;font-size: 16px;}
            .gm-dialog input, .gm-dialog select, .gm-dialog textarea{
                width: 100%;padding: 6px 10px;margin: 4px 0;box-sizing: border-box;
                border-radius: 4px; background-color: rgba(0,0,0,.03);border: 1px solid rgba(0,0,0,.125);
                -moz-appearance: textfield;-webkit-appearance: none;-o-appearance: none;text-align: center;
            }
            .gm-dialog select {
                background-image:linear-gradient(45deg, transparent 50%, gray 50%),linear-gradient(135deg, gray 50%, transparent 50%), linear-gradient(to right, #ccc, #ccc);
                background-position: calc(100% - 20px) 14px,calc(100% - 15px) 14px,calc(100% - 40px) 4px;
                background-size: 5px 5px, 5px 5px, 1px calc(100% - 8px);
                background-repeat: no-repeat;
            }
            .gm-dialog input:not(:valid), .gm-dialog input[required]:placeholder-shown,.gm-dialog input.error {border-color:rgb(219, 40, 40);}
            .gm-dialog input:focus, .gm-dialog select:focus, .gm-dialog textarea:focus{border: 1px solid rgb(30, 130, 205);}
            .gm-dialog .placeholder, .gm-dialog ::placeholder{color: gray;}
            
            .gm-dialog fieldset{text-align: left; padding: 8px 0;margin: 0;border: none;font-size:16px;font-weight: 600;min-width:0;display: table-cell;}
            .gm-dialog fieldset legend{
                display: table;width: 100%;max-width: 100%;padding: 8px 0;margin:8px 0 16px;position: relative;
                font-size: 24px;line-height: 1.5;color: #333;white-space: normal;font-weight: 500;
            }
            .gm-dialog fieldset legend:before{background: rgba(34,36,38,.15);position: absolute;width:100%;bottom:-8px;display:block;content:"";height: 1px;}
            .gm-dialog fieldset label{display: block;margin: 0;font-size:18px;padding: 8px 0 4px;}
            .gm-dialog fieldset label + input{margin-top:0;}
            
            .gm-dialog *:not(input):not(textarea), .gm-noselect{-webkit-touch-callout: none;-webkit-user-select: none;-moz-user-select: none;user-select: none;}
            .gm-dialog [disabled], .gm-dialog .disabled{pointer-events: none !important;color: gray !important;}
            .gm-dialog [hidden], .gm-dialog .hidden{display:none !important;z-index: -1 !important;}
            .gm-noscroll{overflow: hidden;}
            .gm-flex-center{display: flex;align-items: center;justify-content: center;}
            @keyframes fadeIn {from {opacity: 0;}to {opacity: 1;}}
            @keyframes fadeOut {from {opacity: 1;}to {opacity: 0;}}
            .fadeIn {animation-name: fadeIn;animation-duration: .75s;animation-fill-mode: both;}
            .fadeOut {animation-name: fadeOut;animation-duration: .75s;animation-fill-mode: both;}

            @media (max-height: 640px), (max-width: 950px) {
                .gm-dialog{left: 6px !important;right: 6px !important; top:6px !important;bottom: 6px !important;max-height:calc(100% - 12px);width:calc(100% - 12px) !important;transform: unset !important;}
            }
            .gm-dialog.gm-dialog-fullscreen{left: 6px !important;right: 6px !important; top:6px !important;bottom: 6px !important;max-height:calc(100% - 12px);width:calc(100% - 12px) !important;transform: unset !important;}

        `;
        //gmFlash
        styles += `
            .gm-flash {
                padding: 16px 24px; margin: 8px 0 0;border: 1px solid 1px solid rgba(10, 10, 10, 0.25); border-radius: 4px;
                text-align: center;font-size: 18px;
            }
            .gm-flash {background-color: #fafafa;border-color: #363636;color: #4a4a4a;}
            .gm-flash.success{border-color: #48c774;color: #257942;background-color: #effaf3;}
            .gm-flash.error{background-color: #feecf0;border-color: #f14668;color: #cc0f35;}
            .gm-flash.warning {border-color: #ffdd57;color: #947600;background-color: #fffbeb;}
            .gm-flash.info {border-color: #3298dc;color: #1d72aa;background-color: #eef6fc;}
        `;
        //gmHeader
        styles += `
            .gm-header {background-color: #363636;color: #fff;border: 1px solid rgba(0,0,0,0);}
            .gm-header.success{background-color: #00d1b2;color: #fff;}
            .gm-header.error{background-color: #f14668;color: #fff;}
            .gm-header.warning {background-color: #ffdd57;color: rgba(0,0,0,.7);}
            .gm-header.info {background-color: #3298dc;color: #fff;}
            .gm-header *{color: #fff;}
            .gm-header.warning *{color: rgba(0,0,0,.7);}
        `;

        //gmList
        styles += `
            .gm-list{list-style-type: none; padding: 0;box-sizing: border-box;border-radius: 0; border: 1px solid rgba(0,0,0,.125);margin:8px 0;display:block;}
            .gm-list.rounded{border-radius: 4px;}
            .gm-list > *{text-align: center;border: none;padding: 16px; position: relative;font-weight:600;display:block;clear:both;}
            .gm-list > * + *{border-top: 1px solid rgba(0,0,0,.125);}
            .gm-list > * > .gm-btn{min-width:auto; padding:8px 16px !important;margin:-8px -8px 0 0 !important;float: right;} /** tools **/
            .gm-list > * > .gm-btn + .gm-btn{margin: -8px 4px 0 0 !important;}
            .gm-list:empty{display:none;}
            .gm-list:not(:empty) +.gm-flash{display: none;}
        `;
        //gmTabs
        styles += `
            .gm-tabs{
                list-style-type: none;width:100%;display:flex;padding:0;text-align:center;background: #fff;
                border: 1px solid rgba(34,36,38,.15);box-shadow: 0 1px 2px 0 rgba(34,36,38,.15);border-radius: 4px;
                min-height: 48px;margin: 24px 0;position: relative;
            }
            .gm-tabs:after{content: "";display: block;height: 1px;clear: both;visibility: hidden;}
            .gm-tabs:before{background: rgba(34,36,38,.15);position: absolute;width:100%;bottom:-24px;display:block;content:"";height: 1px;}
            .gm-tabs .gm-tab{
                position:relative;padding: 12px 0;vertical-align: middle;text-decoration: none;text-align: center;cursor: pointer;
                color: rgba(0,0,0,.87);font-weight: 700;display: inline-block;
                transition: background .1s ease,box-shadow .1s ease,color .1s ease,-webkit-box-shadow .1s ease;
            }
            .gm-tabs .gm-tab:hover, .gm-tabs .gm-tab:active, .gm-list > *:hover{background: rgba(0,0,0,.03);color: rgba(0,0,0,.95);}
            .gm-tabs .gm-tab:before{position: absolute;content: "";top: 0;right: 0;height: 100%;width: 1px;background: rgba(34,36,38,.1);}
            .gm-tabs .gm-tab:last-child:before{display:none;}
            .gm-tabs .gm-tab:first-child{border-radius: 4px 0 0 4px;}
            .gm-tabs .gm-tab:last-child{border-radius: 0 4px 0 4px;}
            .gm-tabs .gm-tab.active, .gm-list > .active{background: rgba(0,0,0,.05);color: rgba(0,0,0,.95);box-shadow: none;}
        `;


        //switch checkbox
        styles += `
            /** switch **/
            [class*="switch"],[class*="switch"] .slider {position: relative;display: inline-block;}
            [class*="switch"] [type="checkbox"] {opacity: 0;z-index: 2;}
            [class*="switch"] [type="checkbox"],
            [class*="switch"] .slider:after {position: absolute;top: 0;right: 0;left: 0;bottom: 0;min-width: 100%;min-height: 100%;cursor: pointer;}
            [class*="switch"] .slider:after,[class*="switch"] .slider:before {transition: 0.25s;content: "";position: absolute;}
            [class*="switch"] .slider {width: 64px;height: 32px;vertical-align: middle;}
            [class*="switch"] .slider:before {z-index:1;height: 24px;width: 24px;left: 4px;bottom: 4px;}
            [class*="switch"] [type="checkbox"]:checked + .slider:before {transform: translateX(32px);}
            [class*="switch"][class*="-round"] .slider:after{border-radius: 32px;}
            [class*="switch"][class*="-round"] .slider:before{border-radius: 50%;}
            [class*="switch"][class*="-big"] .slider:before{width:40px;height:40px;transform: translate(-8px,8px);}
            [class*="switch"][class*="-big"] [type="checkbox"]:checked + .slider:before {transform: translate(32px,8px);}
            /** colors **/
            [class*="switch"] [type="checkbox"]:checked + .slider:after {background-color: rgba(0, 123, 255, 1);}
            [class*="switch"] [type="checkbox"]:focus + .slider:after {box-shadow: 0 0 1px rgba(0, 123, 255, 1);}
            [class*="switch"] .slider:before {background-color: rgba(255, 255, 255, 1);}
            [class*="switch"] .slider:after {background-color: rgba(108, 117, 125, 1);}
            /** sizes **/
            [class*="switch"] .slider{transform: scale(.75,.75);}
            [class*="switch"][class*="-sm"] .slider{transform: scale(.55,.55);}
            [class*="switch"][class*="-md"] .slider{transform: scale(.9,.9);}
            [class*="switch"][class*="-lg"] .slider{transform: scale(1.1,1.1);}
            .gm-list > * > [class*="switch"]{position: absolute;top: 50%;left:0;transform: translate(0, -50%);}
             [class*="switch"] + .gm-label{font-size: 18px;font-weight:600;}
        `;

        return styles;
    }


    constructor(){
        if (gmStyles.applied === true) return;
        gmStyles.applied = true;
        addstyle(this.styles);
    }
}
