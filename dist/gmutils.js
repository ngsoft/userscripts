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
const minute = 60 * 60, hour = minute * 60, day = hour * 24, week = day * 7, year = 365 * day, month = Math.round(year / 12);


function isPlainObject(v) {
    return v instanceof Object && Object.getPrototypeOf(v) === Object.prototype;
}


function isArray(v) {
    return Array.isArray(v);
}


/**
 * Run a callback
 * @param {function} callback
 * @returns {undefined}
 */
function on(callback) {
    if (typeof callback === f) callback();
}
/**
 * Run a Callback when body is created
 * @param {function} callback
 * @returns {undefined}
 */
on.body = function(callback) {
    if (typeof callback === f) {
        let i = setInterval(() => {
            if (doc.body !== null) {
                clearInterval(i);
                on(callback);
            }
        }, 1);
    }

};

/**
 * Run a callback when page is loading DOMContentLoaded
 * @param {function} callback
 * @returns {undefined}
 */
on.load = function(callback) {
    if (typeof callback === f) {
        if (doc.readyState === "loading") {
            doc.addEventListener("DOMContentLoaded", function load() {
                doc.removeEventListener("DOMContentLoaded", load);
                on(callback);
            });
        } else on(callback);
    }
};

/**
 * Run a callback when page is completely loaded
 * @param {function} callback
 * @returns {undefined}
 */
on.loaded = function(callback) {
    if (typeof callback === f) {
        if (doc.readyState !== "complete") {
            addEventListener("load", function load() {
                removeEventListener("load", load);
                on(callback);
            });

        } else on(callback);
    }
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
            type.split(" ").forEach((t) => {
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
            if (typeof timeout === n) self.params.timeout = interval;
            self.start();
        }
    }
}

/**
 * Uses Mutation Observer + intervals(some sites blocks observers) to find new nodes
 * And test them against params
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
            type.split(' ').forEach(type => {
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
            type.split(' ').forEach(type => {
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
            type.split(' ').forEach(type => {
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
     * @return {any} The value corresponding to this cache item's key, or null if not found.
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
    constructor(prefix = "", ttl = 60, storage){
        if (!(storage instanceof DataStore)) storage = new xStore(localStorage);
        this.storage = storage;
        this.__prefix__ = "";
        if (typeof prefix === s) this.__prefix__ = prefix;
        this.ttl = typeof ttl === n ? ttl : 60;

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
        if (this.storage.has(pkey)) value = this.storage.get(pkey);
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
            this.storage.set(key, item.value ? item.value : null);
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
    }

    set body(body){
        if (typeof body === s) this.elements.body.innerHTML = body;
        else if (body instanceof Element) {
            this.elements.body.innerHTML = "";
            this.elements.body.appendChild(body);
        }
    }


    open(callback){
        if (typeof callback === f) this.one('confirm', callback);
        this.trigger('open');
    }

    close(){
        this.trigger('close');
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
                    yes: html2element(`<button class="gm-btn gm-btn-yes" name="yes" />`),
                    no: html2element(`<button class="gm-btn gm-btn-no" name="no" />`),
                    close: html2element('<button class="gm-btn gm-btn-close" name="close">&times;</button>')
                }
            },
            config: Object.assign({
                overlayclickclose: true,
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
                    this.trigger('close');
                },
                btn_close(){
                    this.trigger('close');
                },
                keydown(e){
                    if (e.keyCode === 27) {
                        this.trigger('close');
                    }
                }

            }
        });
        const self = this;

        self.root.appendChild(self.elements.dialog);
        self.elements.dialog.appendChild(self.elements.header);
        self.elements.dialog.appendChild(self.elements.body);
        self.elements.dialog.appendChild(self.elements.footer);
        self.elements.header.appendChild(self.elements.title);
        self.elements.header.appendChild(self.elements.buttons.close);
        self.elements.footer.appendChild(self.elements.buttons.no);
        self.elements.footer.appendChild(self.elements.buttons.yes);

        Object.keys(self.config.buttons).forEach(btn => {
            if (self.elements.buttons[btn] instanceof Element) self.elements.buttons[btn].innerHTML = self.config.buttons[btn];
        });

        new Events(self.root, self);


        self.title = self.config.title;
        self.body = self.config.body;

        Object.keys(self.config.events).forEach(evt => self.events[evt] = self.config.events[evt]);
        Object.keys(self.events).forEach(evt => self.on(evt, self.events[evt]));

        self.on('open close', e => {
            self.elements.dialog.classList.remove('fadeOut', 'fadeIn');
            if (e.type === "open") {

                self.elements.dialog.classList.add('fadeIn');
                self.parent.appendChild(self.root);
                setTimeout(x => self.trigger('show'), 750);
            } else {
                self.elements.dialog.classList.add('fadeOut');
                setTimeout(() => {
                    self.parent.removeChild(self.root);
                    self.trigger('hide');
                }, 750);
            }

        }).on('click', e => {
            if ((e.target.closest('.gm-dialog') === null) && (self.config.overlayclickclose === true)) self.close();
            let btn = e.target.closest('button[name]');
            if (btn !== null) {
                let name = btn.getAttribute('name'), type = "btn_" + name;
                self.trigger(type);
            }

        });

        new gmStyles();
    }
}

/**
 * UserScripts flash messages
 */
class gmFlash {


    _create(message, classname, onshow, onhide){
        classname = classname || "";
        if (typeof message === s) {
            const self = this;
            let el = doc.createElement('div');
            el.classList.add('gm-flash');
            if (classname.length > 0) el.classList.add(...classname.split(' '));
            el.innerHTML = message;
            const evts = Events(el);
            if (typeof onshow === f) evts.one('show', onshow);
            if (typeof onhide === f) evts.one('hide', onhide);
            evts.on('open close', e => {
                e.stopPropagation();
                if (e.type === "open") {
                    if (self.config.fade === true) {
                        el.classList.add('fadeInFlash');
                        setTimeout(x => evts.trigger('show'), 750);
                    } else evts.trigger('show');
                } else if (self.config.fade === true) {
                    el.classList.remove('fadeInFlash');
                    el.classList.add('fadeOutFlash');
                    setTimeout(x => evts.trigger('hide'), 750);
                } else evts.trigger('hide');
            });

            let parent = self.root, before = null;
            if (self.config.after === true) {
                parent = self.root.parentElement;
                before = self.root.nextElementSibling;
            }
            evts.on('show hide', e => {
                e.stopPropagation();
                if (e.type === 'show') {
                    if (self.config.timeout > 0) setTimeout(x => evts.trigger('close'), self.config.timeout);
                    if (typeof self.config.onshow === f) self.config.onshow.call(el, e);
                } else {
                    if (typeof self.config.onhide === f) self.config.onhide.call(el, e);
                    el.remove();
                }
            });
            evts.on('click', (e) => {
                e.stopPropagation();
                evts.trigger('hide');
            });
            parent.insertBefore(el, before);
            evts.trigger('open');
        }
    }


    set message(message){
        this._create(message);
    }
    set info(message){
        this._create(message, 'info');
    }

    set warning(message){
        this._create(message, 'warning');
    }
    set success(message){
        this._create(message, 'success');
    }
    set error(message){
        this._create(message, 'error');
    }


    constructor(container, params){
        params = params || {};
        const self = this;
        Object.assign(this, {
            root: container,
            config: Object.assign({
                timeout: 2000,
                fade: true,
                after: false,
                onshow: null,
                onhide: null
            }, params)
        });
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
                position: absolute; top:5%; left: 50%; transform: translate(-50%,0);
                background-color: #FFF; border-radius: 6px;border: none; min-width: 256px; width: 60%;
            }
            .gm-btn{
                padding: 8px 24px;border-radius: 4px; border: 1px solid rgba(0,0,0,0);cursor: pointer;
                background-color: rgba(0,0,0,.125);border: 1px solid rgba(255,255,255,.25);color: rgb(28, 29, 30);
                font-size: 16px;font-weight: 700;min-width: 96px;margin: 8px 4px;
            }
            .gm-btn:hover, .gm-btn:active{  background-color: rgb(28, 29, 30);color: rgb(255, 255, 255); }
            .gm-btn + .gm-btn{margin-left: 16px;}
            .gm-dialog-header .gm-btn-close{padding: 3px 16px;position: absolute;top: 10px;right: 12px;}
            .gm-btn-no{ color: rgb(219, 40, 40); }
            .gm-btn-no:hover, .gm-btn-no:active{ background-color: rgb(219, 40, 40); color: rgb(255, 255, 255); }
            .gm-btn-yes{ color: rgb(30, 130, 205); }
            .gm-btn-yes:hover, .gm-btn-yes:active{ background-color: rgb(30, 130, 205);color: rgb(255, 255, 255); }
            .gm-btn-close{min-width: auto;}
            .gm-dialog-header, .gm-dialog-footer{min-height: 56px;padding: 8px 24px 12px 24px;background-color: rgba(0,0,0,.03);position: relative;}
            .gm-dialog-header, .gm-dialog-body {border-bottom:1px solid rgba(0,0,0,.125);}
            .gm-dialog-header{background-color: rgba(0,0,0,.03);}
            .gm-dialog-body{min-height: 96px;text-align: center; font-size: 24px; font-weight: normal;line-height: 1.5;padding: 24px;color: #333;position:relative;}
            .gm-dialog-body > *{margin: -24px; padding: 8px 24px;text-align: left;font-size: 20px;}
            .gm-dialog-footer{ text-align: right;}
            .gm-dialog-title{position: absolute;top:12px;left:24px;font-size: 20px; font-weight: normal;line-height: 1.5; color: #333; text-decoration: none;}
            .gm-dialog input, .gm-dialog textarea, .gm-dialog select{font-family: Arial,Helvetica,sans-serif;line-height: 1.5;font-weight: 700;color:#333;font-size: 16px;}
            .gm-dialog .placeholder, .gm-dialog input::placeholder{color: gray;}
            .gm-dialog fieldset{text-align: left; padding: 8px 16px;margin: 16px 0;border: none;font-size:16px;font-weight: 700;}
            .gm-dialog fieldset + fieldset{border-top: 1px solid rgba(0,0,0,.125);margin-top:0;}
            .gm-dialog fieldset label{display: block;margin: 0;}
            .gm-dialog input, .gm-dialog select, .gm-dialog textarea{
                width: 100%;padding: 6px 10px;margin: 4px 0;box-sizing: border-box;
                border-radius: 4px; background-color: rgba(0,0,0,.03);border: 1px solid rgba(0,0,0,.125);
                -moz-appearance: textfield;-webkit-appearance: none;-o-appearance: none;text-align: center;
            }
            .gm-dialog fieldset label + input{margin-top:0;}
            .gm-dialog input:focus, .gm-dialog select:focus, .gm-dialog textarea:focus{border: 1px solid rgb(0, 153, 204);}
            .gm-dialog select {
                background-image:linear-gradient(45deg, transparent 50%, gray 50%),linear-gradient(135deg, gray 50%, transparent 50%), linear-gradient(to right, #ccc, #ccc);
                background-position: calc(100% - 20px) 14px,calc(100% - 15px) 14px,calc(100% - 40px) 4px;
                background-size: 5px 5px, 5px 5px, 1px calc(100% - 8px);
                background-repeat: no-repeat;
            }

            .gm-dialog .flash-message {
                padding: 12px 20px; margin: 8px 0;border: 1px solid transparent;border-radius: 4px;
                color: #1b1e21;background-color: #d6d8d9;border-color: #c6c8ca;
            }
            .gm-dialog .flash-message.success{color: #155724;background-color: #d4edda;border-color: #c3e6cb;}
            .gm-dialog .flash-message.error{color: #721c24;background-color: #f8d7da;border-color: #f5c6cb;}

            .gm-dialog *:not(input):not(textarea){-webkit-touch-callout: none;-webkit-user-select: none;-moz-user-select: none;user-select: none;}
            .gm-dialog [disabled], .gm-dialog .disabled{pointer-events: none;color: gray;}
            .gm-dialog [hidden], .gm-dialog .hidden{display:none;}
            @keyframes fadeIn {from {opacity: 0;}to {opacity: 1;}}
            @keyframes fadeOut {from {opacity: 1;}to {opacity: 0;}}
            .fadeIn {animation-name: fadeIn;animation-duration: .75s;animation-fill-mode: both;}
            .fadeOut {animation-name: fadeOut;animation-duration: .75s;animation-fill-mode: both;}
        `;
        //gmFlash
        styles += `
            .gm-flash {padding: 12px 20px; margin: 8px 0;border: 1px solid transparent;border-radius: 4px;}
            .gm-flash {color: #383d41; background-color: #e2e3e5; border-color: #d6d8db;}
            .gm-flash.success{color: #155724;background-color: #d4edda;border-color: #c3e6cb;}
            .gm-flash.error{color: #721c24;background-color: #f8d7da;border-color: #f5c6cb;}
            .gm-flash.warning {color: #856404;background-color: #fff3cd;border-color: #ffeeba;}
            .gm-flash.info {color: #0c5460;background-color: #d1ecf1;border-color: #bee5eb;}
        `;
        //gmList
        styles += `
        .gm-list{list-style-type: none; padding: 4px;box-sizing: border-box;border-radius: 4px; border: 1px solid rgba(0,0,0,.125);margin:8px 0;}
        .gm-list > *{height: 48px;text-align: center;border: none;padding: 12px 0 0 0; position: relative;}
        .gm-list > * + *{border-top: 1px solid rgba(0,0,0,.125);}
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
        `;

        return styles;
    }


    constructor(){
        if (gmStyles.applied === true) return;
        gmStyles.applied = true;
        addstyle(this.styles);
    }
}
