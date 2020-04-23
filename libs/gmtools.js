/**
 * gmtools Module
 */
const
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
        GMinfo = (GM_info ? GM_info : (typeof GM === 'object' && GM !== null && typeof GM.info === 'object' ? GM.info : null)),
        scriptname = `${GMinfo.script.name} version ${GMinfo.script.version}`,
        UUID = GMinfo.script.uuid;


/**
 * gmtools Module
 */
(function(root, factory){
    const deps = []; //your dependencies there
    if (typeof define === 'function' && define.amd) define(deps, factory);
    else if (typeof exports === 'object') module.exports = factory(...deps.map(dep => require(dep)));
    else root.gmtools = factory(...deps.map(dep => root[dep]));
}(this, () => {

    const gmtools = {};

    let undef;

    const doc = document;

    /**
     * Test if given argument is a plain object
     * @param {any} v
     * @returns {Boolean}
     */
    const isPlainObject = gmtools.isPlainObject = function(v){
        return v instanceof Object && Object.getPrototypeOf(v) === Object.prototype;
    };


    /**
     * Run a callback
     * @param {function} ...callbacks Run callback in order
     * @returns {undefined}
     */
    const on = gmtools.on = function(callback){
        const callbacks = [];
        for (let i = 0; i < arguments.length; i++) {
            let arg = arguments[i];
            if (typeof arg === f) callbacks.push(arg);
        }
        callbacks.forEach(c => c.call());
    };
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
    const html2element = gmtools.html2element = function(html){
        if (typeof html === "string") {
            let template = doc.createElement('template');
            html = html.trim();
            template.innerHTML = html;
            return template.content.firstChild;
        }
    };

    /**
     * Creates a Document from html code
     * @param {string} html
     * @returns {documentElement}
     */
    const html2doc = gmtools.html2doc = function(html){
        let node = doc.implementation.createHTMLDocument().documentElement;
        if (typeof html === s && html.length > 0) {
            node.innerHTML = html;
        }
        return node;
    };

    /**
     * Adds CSS to the bottom of the body
     * @param {string} css
     * @returns {undefined}
     */
    const addcss = gmtools.addcss = function(css){
        if (typeof css === "string" && css.length > 0) {
            let s = doc.createElement('style');
            s.setAttribute('type', "text/css");
            s.appendChild(doc.createTextNode('<!-- ' + css + ' -->'));
            on.body(() => {
                doc.body.appendChild(s);
            });
        }
    };

    /**
     * Adds CSS to the bottom of the head
     * @param {string} css
     * @returns {undefined}
     */
    const addstyle = gmtools.addstyle = function(css){
        if (typeof css === "string" && css.length > 0) {
            let s = doc.createElement('style');
            s.setAttribute('type', "text/css");
            s.appendChild(doc.createTextNode('<!-- ' + css + ' -->'));
            doc.head.appendChild(s);
        }
    };


    /**
     * Checks if url is valid
     * @param {string} url
     * @returns {boolean}
     */
    const isValidUrl = gmtools.isValidUrl = function(url){
        const weburl = new RegExp("^(?:(?:(?:https?|ftp):)?\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z0-9\\u00a1-\\uffff][a-z0-9\\u00a1-\\uffff_-]{0,62})?[a-z0-9\\u00a1-\\uffff]\\.)+(?:[a-z\\u00a1-\\uffff]{2,}\\.?))(?::\\d{2,5})?(?:[/?#]\\S*)?$", "i");
        if (typeof url === s && url.length > 0) {
            return weburl.test(url);
        }
        return false;
    };



    /**
     * Convert uri into full url
     * @param {string} uri
     * @returns {string|undefined}
     */
    const getURL = gmtools.getURL = function(uri){
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

    };


    /**
     * Sanitize a given filename
     * @param {string} input
     * @param {string} replacement
     * @returns {string}
     */
    const sanitizeFileName = gmtools.sanitizeFileName = function(input, replacement){
        replacement = typeof replacement === s ? replacement : "";
        if (typeof input === s) return input
                    .replace(/[\/\?<>\\:\*\|":\'\`\’]/g, replacement)
                    .replace(/[\x00-\x1f\x80-\x9f]/g, replacement)
                    .replace(/^\.+$/, replacement)
                    .replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, replacement)
                    .replace(/[\. ]+$/, replacement)
                    .substring(0, 255);
    };


    /**
     * Generate a unique ID
     * @returns {String}
     */
    const uniqid = gmtools.uniqid = function(){
        return  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };


    /**
     * Loads an external script
     * @param {string} src
     * @param {boolean} defer
     * @returns {Promise}
     */
    const loadjs = gmtools.loadjs = function(src, defer){
        
        return new Promise((resolve,reject) => {
            if (isValidUrl(src)) {
                let script = doc.createElement('script');
                script.type = 'text/javascript';
                if (defer === true) script.defer = true;
                script.onload(e => {
                    resolve(e);
                });
                doc.head.appendChild(script);
                script.src = src;
            } else reject(new Error("Invalid argument src."));
        });
        

    };

    /**
     * Adds script to the bottom of the head
     * @param {string} src
     * @returns {undefined}
     */
    const addscript = gmtools.addscript = function(src){
        if (typeof src === s && src.length > 0) {
            let s = doc.createElement("script");
            s.setAttribute("type", "text/javascript");
            s.appendChild(doc.createTextNode(src));
            doc.head.appendChild(s);
        }
    };

    /**
     * Loads an external CSS
     * @param {string} src
     * @returns {undefined}
     */
    const loadcss = gmtools.loadcss = function(src){
        if (isValidUrl(src)) {
            let style = doc.createElement('link');
            style.rel = "stylesheet";
            style.type = 'text/css';
            doc.head.appendChild(style);
            style.href = src;
        }
    };

    /**
     * Copy given text to clipboard
     * @param {string} text
     * @returns {boolean}
     */
    const copyToClipboard = gmtools.copyToClipboard = function(text){
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
    };

    /**
     * Download given text as a file
     * @param {string} text
     * @param {string} filename
     * @returns {undefined}
     * @link https://stackoverflow.com/questions/32225904/programmatical-click-on-a-tag-not-working-in-firefox
     */
    const Text2File = gmtools.Text2File = function(text, filename){
        if (typeof text === s && typeof filename === s) {
            let link = doc.createElement("a"), blob = new Blob([text], {type: "application/octet-stream"});
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.dispatchEvent(new MouseEvent(`click`));
        }
    };

    /**
     * Gets list of events types
     * @param {string|Array} type
     * @returns {Array}
     */
    function getEventTypes(type){
        let types = [];
        if (typeof type === s) types = type.split(/\s+/);
        else if (Array.isArray(type)) type.forEach(item => types = types.concat(getEventTypes(item)));
        return types;
    }


    /**
     * Dispatches an Event
     * @param {EventTarget} el
     * @param {string} type
     * @param {any} data
     * @returns {undefined}
     */
    const trigger = gmtools.trigger = function(el, type, data){
        if (el instanceof EventTarget) {
            let event;
            getEventTypes(type).forEach(t => {
                if (el.parentElement === null) event = new Event(t);
                else event = new Event(t, {bubbles: true, cancelable: true});
                event.data = data;
                el.dispatchEvent(event);
            });
        }
    };




    /**
     * Small Event Wrapper
     * @param {EventTarget} target
     * @param {Object} binding
     * @returns {Events}
     */
    const Events = gmtools.Events = function(target, binding){

        if (typeof target === s) target = doc.querySelector(target);

        if (this instanceof Events) {
            const self = this;
            binding = binding instanceof Object ? binding : target;
            if (!(target instanceof EventTarget)) target = doc.createElement('div');
            if (!(binding instanceof EventTarget)) {
                ["on", "off", "one", "trigger"].forEach(method => {
                    if (typeof binding[method] === u) {
                        Object.defineProperty(binding, method, {
                            configurable: true, enumerable: false,
                            value: function(...args){
                                self[method].apply(self, args);
                                return this;
                            }
                        });
                    }
                });
            }
            Object.assign(this, {
                target: target,
                binding: binding,
                events: []
            });
            return this;
        } else if ((target instanceof EventTarget)) return new Events(...arguments);

    };
    Events.prototype = {
        /**
         * Add an event listener
         * @param {string} type
         * @param {function} listener
         * @param {boolean|Object} options
         * @returns {Events}
         */
        on(type, listener, options){
            if (typeof listener === f) {
                const
                        self = this,
                        params = {once: false, capture: false},
                        handler = listener.bind(self.binding);
                if (typeof options === b) params.capture = options;
                else if (isPlainObject(options)) Object.keys(params).forEach(key => {
                        params[key] = options[key] === true;
                    });
                getEventTypes(type).forEach(type => {
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

            const
                    self = this,
                    params = {capture: false};
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
            getEventTypes(type).forEach(type => {
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

            return this;
        },
        /**
         * Dispatches an event
         * @param {string} type
         * @param {any} data
         * @returns {Events}
         */
        trigger(type, data){
            const self = this;
            data = data !== undef ? data : {};
            getEventTypes(type).forEach(type => {
                let event;
                if (self.target.parentElement === null) event = new Event(type);
                else event = new Event(type, {bubbles: true, cancelable: true});
                event.data = data;
                self.target.dispatchEvent(event);
            });
            return this;
        }


    };


    /**
     * Creates a new Timer
     * @param {function} callback
     * @param {number|undefined} interval
     * @param {number|undefined} timeout
     * @returns {Timer}
     */
    const Timer = gmtools.Timer = class {
        /**
         * Starts the timer
         * @returns {undefined}
         */
        start(){
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
        stop(){
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
        constructor(callback, interval, timeout){
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
    };


    /**
     * Creates a gmTimer instance
     * @param {function} [onTimeout] to be executed on timeout
     * @param {number|null} [timeout] timeout if set to 0 or null onTimeout will ve disabled
     * @param {function} [onInterval] to be executed at each interval
     * @param {number|null} [interval interval if set to 0 or null onInterval will be disabled
     * @param {Object} [params] params to override settings: interval, timeout, onInterval, onTimeout
     * @returns {gmTimer}
     */
    class gmTimer {

        constructor(...args){
            const $this = this;

            Object.defineProperties(this, {
                params: {configurable: true, enumerable: false, writable: false,
                    value: {interval: 0, timeout: second}
                },
                current: {configurable: true, enumerable: false, writable: false, value: {interval: null, timeout: null}},
                callbacks: {configurable: true, enumerable: false, writable: false, value: {
                        onInterval(){
                            $this.trigger($this.prefix + "interval");
                        },
                        onTimeout(){
                            $this.current.timeout = null;
                            $this.trigger([$this.prefix + "timeout", $this.prefix + "stop"]);
                        }
                    }},
                listeners: {configurable: true, enumerable: false, writable: false, value: new Events(null, $this)}
            });


            let interval, timeout, oninterval, ontimeout;

            args.forEach(arg => {
                if (typeof arg === n) {
                    if (timeout === undef) timeout = arg;
                    else interval = arg;

                } else if (typeof arg === f) {
                    if (ontimeout === undef) ontimeout = arg;
                    else oninterval = arg;
                } else if (isPlainObject(arg)) {
                    if (typeof arg.interval === n) interval = arg.interval;
                    if (typeof arg.timeout === n) timeout = arg.timeout;
                    if (typeof arg.onInterval === f) oninterval = arg.oninterval;
                    if (typeof arg.onTimeout === f) ontimeout = arg.ontimeout;
                }
            });

            this.interval = interval;
            this.timeout = timeout;
            this.onTimeout = ontimeout;
            this.onInterval = oninterval;

            this.on(this.prefix + "stop", e => {
                if (!this.started) return;
                if ($this.current.timeout !== null) clearTimeout($this.current.timeout);
                if ($this.current.interval !== null)  clearInterval($this.current.interval);
                $this.current.interval = $this.current.timeout = null;
                
            }).on(this.prefix + "start", e => {
                if ($this.started )return;
                if (!$this.canstart) throw new Error('gmTimer cannot be started (no timeout, interval or callbacks set)');
                if ($this.interval > 0) $this.current.interval = setInterval($this.callbacks.onInterval, $this.interval);
                if ($this.timeout > 0) $this.current.timeout = setTimeout($this.callbacks.onTimeout, $this.timeout);
            }).on(this.prefix + "update:timeout", e => {

                if ($this.started) {
                    let val = $this.params.timeout;
                    if ($this.current.timeout !== null) clearTimeout($this.current.timeout);
                    if (val > 0 ? $this.hasTimeoutCallbacks : false) $this.current.timeout = setTimeout($this.callbacks.onTimeout, val);
                    else $this.current.timeout = null;
                    if (!$this.started) $this.trigger($this.prefix + "stop");
                }


            }).on(this.prefix + "update:interval", e => {
                if ($this.started) {
                    if ($this.current.interval !== null) clearInterval($this.current.interval);
                    if (val > 0 ? $this.hasIntervalCallbacks : false) $this.current.interval = setInterval($this.callbacks.onInterval, val);
                    else $this.current.interval = null;
                    if (!$this.started) $this.trigger($this.prefix + "stop");
                }

            });
        }

        /** Getters **/


        /** @returns {String} */
        get prefix(){
            return "gmtimer.";
        }
        /** @returns {Boolean} */
        get started(){
            return this.current.interval !== null ? true : this.current.timeout !== null;
        }
        /** @returns {Boolean} */
        get canstart(){
            return  ((this.interval > 0 ? this.hasIntervalCallbacks : false) || (this.timeout > 0 ? this.hasTimeoutCallbacks : false));
        }
        /** @returns {Boolean} */
        get hasIntervalCallbacks(){
            return this.listeners.events.map(item => item.type).some(type => this.prefix + "interval" === type);
        }
        get hasTimeoutCallbacks(){
            return this.listeners.events.map(item => item.type).some(type => this.prefix + "timeout" === type);
        }


        /** @returns {Number|null} */
        get interval(){
            return this.params.interval;
        }
        /** @returns {Number|null} */
        get timeout(){
            return this.params.timeout;
        }

        get onInterval(){
            return null;
        }

        get onTimeout(){
            return null;
        }

        /** Setters **/
        set interval(val){
            if (typeof val === n ? true : val === null) {
                this.params.interval = val;
                this.trigger(this.prefix + "update:interval");
            }

        }
        set timeout(val){
            if (typeof val === n ? true : val === null) {
                this.params.timeout = val;
                this.trigger(this.prefix + "update:timeout");
            }

        }

        /**
         * Adds a callback to be executed at each intervals
         * @param {function} fnc
         * @returns {undefined}
         */
        set onInterval(fnc){
            if (typeof fnc === f) this
                        .on(this.prefix + "interval", fnc)
                        .trigger(this.prefix + "update:interval");

        }
        /**
         * Adds a callback to be executed on timeout
         * @param {function} fnc
         * @returns {undefined}
         */
        set onTimeout(fnc){
            if (typeof fnc === f) this
                        .on(this.prefix + "timeout", fnc)
                        .trigger(this.prefix + "update:timeout");
        }

        /** Methods **/

        /**
         * Start the timer
         * @returns {Promise} Promise will resolve when timer is stopped (on timeout or using stop())
         */
        start(){
            const $this = this;
            return new Promise((resolve, reject) => {
                if (!this.canstart) return reject(new Error('gmTimer cannot be started (no timeout, interval or callbacks set)'));
                $this.one($this.prefix + "stop", e => {
                    resolve(e); //cannot be resolved if no timeout set or if timer never stopped
                });
                $this.trigger($this.prefix + "start");
            });
        }

        /**
         * Stops the timer
         * @returns {undefined}
         */
        stop(){
            if (!this.started) return;
            this.trigger(this.prefix + "stop");
        }


    }

    gmtools.gmTimer = gmTimer;


    /**
     * Some browser injections
     */
    if (HTMLElement ? HTMLElement.prototype : false) {

        /**
         * Set or Get value from Element.dataset
         * @param {string|object} key
         * @param {any} value
         * @returns {any}
         */
        HTMLElement.prototype.data = HTMLElement.prototype.data || function(key, value){
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


        HTMLElement.prototype.siblings = HTMLElement.prototype.siblings || function(selector){
            const self = this, retval = [];
            selector = typeof selector === s ? selector : null;
            if (self.parentElement !== null) {
                let list = self.parentElement.children;
                for (let i = 0; i < list.length; i++) {
                    let el = list[i];
                    if (el === self) continue;
                    if (selector !== null ? el.matches(selector) === false : false) continue;
                    retval.push(el);
                }
            }
            return retval;
        };
    }


    if (NodeList ? NodeList.prototype : false) {
        /**
         * Set or Get value from Element.dataset
         * @param {string|object} key
         * @param {any} value
         * @returns {undefined}
         */
        NodeList.prototype.data = NodeList.prototype.data || function(key, value){
            const self = this;
            if (((typeof key === s) || typeof key === u) && (typeof value === u)) {
                //reads from first element
                if (self.length > 0) return self[0].data(key);
                return undef;
            } else self.forEach((el) => {
                    el.data(key, value);
                });
        };
    }

    /**
     * ISO Language Codes (639-1 and 693-2) and IETF Language Types
     * language-codes-3b2
     * @link https://datahub.io/core/language-codes
     * @link https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/gmutils.min.js
     */
    const isoCode = gmtools.isoCode = (() => {

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

    return gmtools;
}, window));

