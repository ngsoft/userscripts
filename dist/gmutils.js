/**
 * Utilities for gm scripts
 * @link https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/gmutils.min.js
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
                .replace(/[\/\?<>\\:\*\|":']/g, replacement)
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
function Events(target, binding) {

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
    } else if (target instanceof EventTarget) return new Events(...arguments);

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
            let sval = val;
            try {
                val = JSON.stringify(sval);
            } catch (e) {
                val = sval;
            }
            this._storage.setItem(key, val);
            return this;
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
            let key = this.prefix + "_itemexpire";
            this.__expire__ = this.storage.get(key) || {};
        }

        return this.__expire__;
    }

    set expire(obj) {
        if (isPlainObject(obj)) {
            this.__expire__ = obj;
            let key = this.prefix + "_itemexpire";
            this.storage.set(key, obj);
        }
    }

    get prefix() {
        return this.__prefix__;
    }

    /**
     * @param {string} prefix
     * @param {number} ttl
     */
    constructor(prefix = "", ttl = 60) {
        this.storage = new xStore(localStorage);
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
 * Gets basename from path
 * @param {string} path
 * @returns {string|undefined}
 */
function basename(path) {
    if (typeof path === s) {
        return path.split('/').pop();
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






