/**
 * Utilities for tampermonkey userscripts
 * @link https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.6/libs/gmutils.min.js
 * @link https://github.com/ngsoft/userscripts/blob/1.2.6/libs/gmutils.js
 */

/**
 * Module gmTools
 */

(function(root, factory){
    /* globals define, require, module, self, GM, GM_info, EventTarget */
    const dependencies = [];
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
        root["gmTools"] = factory(...dependencies.map(dep => require(dep))); /*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function(undef){


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
            GMinfo = (typeof GM_info !== u ? GM_info : (typeof GM === 'object' && GM !== null && typeof GM.info === 'object' ? GM.info : null)),
            scriptname = `${GMinfo.script.name} @${GMinfo.script.version}`,
            UUID = GMinfo.script.uuid,
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
     * @returns {string}
     */
    function gettype(value){
        let type = typeof value;
        if (type === o) {
            if (value === null) type = "null";
            else if (Array.isArray(value)) type = "array";
        } else if (type === n) {
            type = "float";
            if (Number.isInteger(value)) type = "int";
        }
        return type;
    }



    /**
     * Run a callback
     * @param {function} ...callbacks Run callback in order
     * @param {any} ...args Arguments to pass to callbacks
     * @returns {Promise}
     */
    function on(...callbacks){
        return new Promise((resolve, reject) => {
            let
                    queue = callbacks.filter(x => typeof x === f),
                    args = callbacks.filter(x => typeof x !== f);

            let current, retval, error;
            while ((current = queue.shift()) !== undef) {
                try {
                    retval = current(...args);
                    args = [retval];
                } catch (e) {
                    error = e;
                    break;
                }

            }
            if (typeof error !== u) reject(error);
            else resolve(retval);
        });
    }

    /**
     * Run a Callback when body is created
     * @param {function} ...callbacks
     * @returns {Promise}
     */
    on.body = function(...callbacks){


        return new Promise(resolve => {
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
                    if (ready === true) on(doc.body, ...callbacks).then(r => resolve(doc.body));
                });
                observer.observe(doc.documentElement, {childList: true});
            }
            else on(doc.body, ...callbacks).then(r => resolve(doc.body));
        });
    };

    /**
     * Run a callback when page is loading DOMContentLoaded
     * @param {function} ...callbacks
     * @returns {Promise}
     */
    on.load = function(...callbacks){
        return new Promise(resolve => {
            if (doc.readyState === "loading") {
                doc.addEventListener("DOMContentLoaded", function(){
                    on(doc.body, ...callbacks).then(r => resolve(doc.body));
                });
            } else on(doc.body, ...callbacks).then(r => resolve(doc.body));
        });
    };

    /**
     * Run a callback when page is completely loaded
     * @param {function} ...callbacks
     * @returns {Promise}
     */
    on.loaded = function(...callbacks){
        return new Promise(resolve => {
            if (doc.readyState !== "complete") {
                addEventListener("load", function(){
                    on(doc.body, ...callbacks).then(r => resolve(doc.body));
                });

            } else on(doc.body, ...callbacks).then(r => resolve(doc.body));

        });
    };



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
        if (typeof html === s && html.length > 0) {
            node.innerHTML = html;
        }
        return node;
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



    /**
     * Loads an external script
     * @param {string} src
     * @param {boolean} defer
     * @returns {Promise}
     */
    function loadjs(src, defer){
        return new Promise((resolve, reject) => {
            if (!isValidUrl(src)) reject(new Error("Invalid argument src."));
            let script = doc.createElement('script');
            Object.assign(script, {
                type: 'text/javascript',
                onload: e => resolve(e),
                src: src
            });
            if (defer === true) script.defer = true;
            doc.head.appendChild(script);
        });
    }

    /**
     * Loads an external CSS
     * @param {string} src
     * @returns {Promise}
     */
    function loadcss(src){

        return new Promise((resolve, reject) => {
            if (!isValidUrl(src)) return reject(new Error('Invalid argument src'));
            let style = doc.createElement('link');
            Object.assign(style, {
                rel: "stylesheet",
                type: "text/css",
                href: src,
                onload: e => resolve(e)
            });
            doc.head.appendChild(style);
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
    function trigger(el, type, data){
        if (el instanceof EventTarget) {
            let event;
            getEventTypes(type).forEach(t => {
                if (el.parentElement === null) event = new Event(t);
                else event = new Event(t, {bubbles: true, cancelable: true});
                event.data = data;
                el.dispatchEvent(event);
            });
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
     * Defines an Interface
     */
    class Interface {

        get __ABSTRACT(){
            return [];
        }

        constructor(){

            let
                    name = this.constructor.name,
                    proto = Object.getPrototypeOf(this),
                    parents = [];

            while (proto instanceof Interface) {
                parents.push(proto);
                proto = Object.getPrototypeOf(proto);
            }
            if (parents.length > 1) {
                const
                        iface = parents.pop(),
                        abstract = Array.isArray(this.__ABSTRACT) ? this.__ABSTRACT : [],
                        declared = [];
                abstract.push('constructor');

                const methods = Object.keys(Object.getOwnPropertyDescriptors(iface)).filter(key => typeof iface[key] === f && !abstract.includes(key));

                if (methods.length === 0) {
                    throw new Error('Interface class ' + iface.constructor.name + ' does not declare methods that are not abstract (do you need to make it an interface?).');
                }

                parents.forEach(proto => {
                    Object.keys(Object.getOwnPropertyDescriptors(proto)).forEach(method => {
                        if (typeof proto[method] === f && methods.includes(method)) {

                            if (iface[method].length !== proto[method].length) {
                                throw new Error(`Interface ${iface.constructor.name}.${method}() expects ${iface[method].length} parameters, ${proto[method].length} given in ${proto.constructor.name}.${method}()`);
                            }
                            declared.push(method);
                        }
                    });
                });
                if (methods.length !== declared.length) {
                    throw new Error('class ' + name + ' does not declare ' + methods.filter(m => declared.includes(m) === false).join('(), ') + '().');
                }
            } else throw new Error('Interface ' + name + ' cannot be instanciated.');
        }
    }



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
                if ($this.current.interval !== null) clearInterval($this.current.interval);
                $this.current.interval = $this.current.timeout = null;

            }).on(this.prefix + "start", e => {
                if ($this.started) return;
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
                    let val = $this.params.interval;
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



    return {
        isPlainObject, on, uniqid, trigger, Events, gmTimer,
        html2element, html2doc, copyToClipboard, Text2File,
        addstyle, loadjs, addscript, loadcss,
        isValidUrl, getURL, sanitizeFileName,
        s, b, f, o, u, n, gettype, Interface,
        second, minute, hour, day, week, year, month,
        GMinfo, scriptname, UUID, isoCode
    };
}));/**
 * Module gmData
 */
(function(root, factory){
    /* globals define, require, module, self */
    const dependencies = ["gmtools"];
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
        root["gmData"] = factory(...dependencies.map(dep => require(dep))); /*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function(gmtools, undef){



    const {
        isPlainObject, isValidUrl, getURL, addstyle, addscript,
        f, s, u, n, minute, UUID, gettype, Interface
    } = gmtools;


    /**
     * DataStore Interface
     * @type {Class}
     */
    class DataStore extends Interface {
        /**
         * Gets a value from the storage
         * @param {string|undefined} key if not using key all the storage will be returned
         * @returns {any}
         */
        get(key){}
        /**
         * Adds a value to the storage
         * @param {string|Object} key storage key or key/value pair
         * @param {any} [val]
         * @returns {DataStore}
         */
        set(key, val){}
        /**
         * Checks if storage has a value for the given key
         * @param {string} key
         * @returns {Boolean}
         */
        has(key){}
        /**
         * Remove a value from the storage
         * @param {string} key
         * @returns {DataStore}
         */
        remove(key){}
        /**
         * Empty the storage
         * @returns {DataStore}
         */
        clear(){}
    }

    /**
     * Store data into an Object
     * @type {Class}
     * @extends {Datastore}
     */
    class nullStore extends DataStore {

        constructor(storage){
            super();
            Object.defineProperty(this, 'storage', {
                value: {}, enumerable: false,
                configurable: true, writable: true
            });
        }
        get(key){
            let retval;
            if (typeof key === s) retval = this.storage[key];
            else if (typeof key === u) retval = Object.assign({}, this.storage);
            return retval;
        }
        set(key, val){
            if (typeof key === s && typeof val !== u) this.storage[key] = val;
            else if (isPlainObject(key)) Object.assign(this.storage, key);
            return this;
        }
        has(key){
            return typeof this.storage.hasOwnProperty(key);
        }
        remove(key){
            delete this.storage[key];
            return this;
        }
        clear(){
            this.storage = {};
            return this;
        }

    }



    /**
     * Store data into localStorage or sessionStorage
     * @type {Class}
     * @extends {Datastore}
     * @param {Storage} storage
     */
    class xStore extends DataStore {

        constructor(storage){
            super();
            if (!(storage instanceof Storage)) {
                throw new Error('xStore : argument not instance of Storage');
            }
            Object.defineProperty(this, 'storage', {
                value: storage, configurable: true,
                enumerable: false, writable: false
            });
        }

        get(key){
            let retval, sval;
            if (typeof key === s) {
                if ((sval = this.storage.getItem(key)) !== null) {
                    try {
                        retval = JSON.parse(sval);
                    } catch (e) {
                        retval = sval;
                    }
                }
            } else if (typeof key === u) {
                //get all
                retval = {};
                for (let i = 0; i < this.storage.length; i++) {
                    key = this.storage.key(i);
                    retval[key] = this.get(key);
                }
            }
            return retval;

        }
        set(key, val){
            if (typeof key === s && typeof val !== u) {
                if (typeof val !== s) {
                    let sval = val;
                    try {
                        val = JSON.stringify(sval);
                    } catch (e) {
                        val = sval;
                    }
                }
                this.storage.setItem(key, val);

            } else if (isPlainObject(key)) Object.keys(key).forEach(k => this.set(k, key[k]));
            return this;
        }
        has(key){
            return this.storage.hasOwnProperty(key);
        }
        remove(key){
            if (typeof key === s) this.storage.removeItem(key);
            return this;
        }
        clear(){
            this.storage.clear();
            return this;
        }

    }


    /**
     * Store data into GreaseMonkey 3 or Tampermonkey
     * @type {Class}
     * @extends {DataStore}
     */
    class gmStore extends DataStore {
        /* globals GM_getValue, GM_setValue, GM_deleteValue, GM_listValues */
        constructor(){
            super();
            const errors = ["GM_getValue", "GM_setValue", "GM_deleteValue", "GM_listValues"].filter(x => typeof self[x] !== f);
            if (errors.length > 0) throw new Error('gmStore:  %s are not available.'.replace('%s', errors.join(', ')));
        }
        get(key){
            let retval;
            if (typeof key === s) retval = GM_getValue(key);
            else if (typeof key === u) {
                retval = {};
                GM_listValues().forEach(key => retval[key] = this.get(key));
            }
            return retval;

        }
        set(key, val){
            if (typeof key === s && typeof val !== u) GM_setValue(key, val);
            else if (isPlainObject(key)) Object.keys(key).forEach(k => this.set(k, key[k]));
            return this;
        }
        has(key){
            return GM_listValues().includes(key);
        }
        remove(key){
            if (typeof key === s) GM_deleteValue(key);
            return this;
        }
        clear(){
            GM_listValues().forEach(key => this.remove(key));
            return this;
        }
    }





    /**
     * Injects defaults settings into gmStore
     */
    class UserSettings extends gmStore {
        /**
         * @param {Object} defaults a plain object containing defaults settings
         * @returns {UserSettings}
         */
        constructor(defaults){
            super();
            defaults = isPlainObject(defaults) ? defaults : {};
            Object.keys(defaults).forEach(key => {
                if (gettype(this.get(key)) !== gettype(defaults[key])) {
                    this.set(key, defaults[key]);
                }
                if (typeof this[key] === u) {
                    Object.defineProperty(this, key, {
                        configurable: true, enumerable: false,
                        get(){
                            return this.get(key);
                        },
                        set(val){
                            if (gettype(defaults[key]) === gettype(val)) this.set(key, val);
                        }
                    });
                }
            });


        }

    }

    /**
     * Cache Item
     * @link https://www.php-fig.org/psr/psr-6/
     */
    class LSCacheItem {

        constructor(key, hit, value){
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
        getKey(){
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
        get(){
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
        isHit(){
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
        set(value){
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
        expiresAt(expiration){
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
        expiresAfter(time){
            if (typeof time === n) {
                let tt = +new Date();
                tt += time;
                this.expiration = new Date(tt);
            }
            return this;
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
        get storage(){
            return this.__store__;
        }
        set storage(val){
            if (val instanceof DataStore) this.__store__ = val;
        }
        get ttl(){
            return this.__ttl__;
        }
        set ttl(ttl){
            if (typeof ttl === n) this.__ttl__ = ttl;
        }

        get deferred(){
            if (typeof this.__deferred__ === u) this.__deferred__ = [];
            return this.__deferred__;
        }

        get expire(){
            if (typeof this.__expire__ === u) {
                let key = this.prefix + "LSCache";
                this.__expire__ = this.storage.get(key) || {};
            }

            return this.__expire__;
        }

        set expire(obj){
            if (isPlainObject(obj)) {
                this.__expire__ = obj;
                let key = this.prefix + "LSCache";
                this.storage.set(key, obj);
            }
        }

        get prefix(){
            return this.__prefix__ + ":";
        }

        /**
         * Creates a new cache pool
         * @param {string} prefix
         * @param {number} [ttl]
         * @param {DataStore} storage
         */
        constructor(prefix = "", ttl = 60000, storage = null){
            if (storage instanceof DataStore === false) storage = new xStore(localStorage);
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
        getItem(key){
            if (typeof key !== s) throw new Error("Invalid Argument");
            let value, pkey = this.prefix + key;
            if (this.hasItem(key)) value = this.storage.get(pkey);
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
        getItems(keys = []){
            let ret = [];
            if (Array.isArray(keys)) {
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
        hasItem(key){
            if (typeof key !== s) throw new Error("Invalid Argument");
            this.__removeExpired();
            return this.storage.has(this.prefix + key);
        }

        /**
         * Deletes all items in the pool.
         *
         * @return {boolean}  True if the pool was successfully cleared. False if there was an error.
         */
        clear(){

            const
                    $this = this,
                    storage = this.storage,
                    data = storage.get();

            Object.keys(data).forEach(key => {
                if (key.indexOf($this.prefix) === 0) storage.remove(key);
            });

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
        deleteItem(key){
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
        deleteItems(keys){
            if (Array.isArray(keys)) {
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
        save(item){
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
        saveDeferred(item){
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
        commit(){
            let item;


            while ((item = this.deferred.shift()) !== undef) {
                this.save(item);
            }

            return true;
        }
    }


    /**
     * Loads and caches resources (js and css)
     * @param {boolean} [usecache] Use Browser localStorage to store the scripts // if set to false, the cache will use a fake storage
     * @param {number} [ttl] Number of ms to keep items in cache eg: 2 * hour
     * @param {string} [prefix] prefix to use to store the files in cache
     * @returns {gmLoader}
     */
    class gmLoader {

        constructor(usecache = true, ttl = 5 * minute, prefix = UUID + ":gmLoader"){
            let storage;
            if (usecache === true) storage = new xStore(localStorage);
            else storage = new nullStore(); //cache is disabled that way, on next page load Object will be cleared
            Object.defineProperties(this, {
                cache: {configurable: true, enumerable: false, writable: false, value: new LSCache(prefix, ttl, storage)}
            });
        }

        /** Getters */

        /** @returns {number} */
        get ttl(){
            return this.cache.ttl;
        }

        /** Setters */
        set ttl(v){
            this.cache.ttl = v;
        }

        /** Methods */

        /**
         * Get item from the cache (shortcut)
         * @param {string} key
         * @returns {LSCacheItem}
         */
        getItem(key){
            return this.cache.getItem(key);
        }


        /**
         * Checks if cache has given key
         * @param {string} key
         * @returns {Boolean}
         */
        hasItem(key){
            return this.cache.hasItem(key);
        }

        /**
         * Clears the cache
         * @returns {Boolean}
         */
        clear(){
            return this.cache.clear();
        }


        /**
         *  Loads Single or multiple resources
         *  @param {string} from  URL multiples urls can be used to load multiples resources
         *  @param {string} [name] Alias to be used for the cache
         *  @param {string} [as]  "js" or "css" are valid values
         *  @param {number} [ttl] cache ttl for the given resource (overrides constructor value)
         *  @param {function} [then] callback to be exexuted just after a certain resource has been loaded
         *  @param {Object} [params] an object that can regroup all the previous keys eg: {name: "mylib", from: "https://...", as: "js", ttl: 3 * day, then(){}}
         *  @param {Array} [multi]  an Array containing multiples URL or multiples params ["http://..",{ttl: 2 * year, from: "...uery.min.js", then(){$(document)...}]
         *
         * @returns {Promise} Resolves if all resources have been loaded and reject if at least one has failed
         */
        require(){
            const
                    $this = this,
                    queue = [],
                    args = Array.from(arguments),
                    defaults = {
                        from: "", as: "", name: "", then: null, ttl: this.ttl
                    },
                    buildQueue = function(args){
                        let item = Object.assign({}, defaults);
                        args.forEach(arg => {
                            if (Array.isArray(arg)) return buildQueue(arg);
                            if (typeof arg === f) item.then = arg;
                            else if (typeof arg === n) item.ttl = arg;
                            else if (typeof arg === s) {
                                if (isValidUrl(arg)) {
                                    if (item.from.length > 0) return buildQueue([arg]);
                                    item.from = arg;
                                } else if (/^(js|css)$/.test(arg)) item.as = arg;
                                else item.name = arg;
                            } else if (isPlainObject(arg)) {
                                if (typeof arg.from === s ? isValidUrl(arg.from) : false) item.from = arg.from;
                                if (typeof arg.as === s ? /^(js|css)$/.test(arg.as) : false) item.as = arg.as;
                                if (typeof arg.name === s) item.name = arg.name;
                                if (typeof arg.then === f) item.then = arg.then;
                                if (typeof arg.ttl === n) item.ttl = arg.ttl;
                            }
                        });
                        if (item.from.length === 0) throw new Error('Cannot load Resource: URL not defined');
                        item.from = getURL(item.from);
                        let url = new URL(item.from);
                        if (item.name.length === 0) item.name = url.pathname.split('/').pop();
                        if (item.as.length === 0) {
                            let matches = /\.(js|css)$/.exec(url.pathname);
                            if (matches === null) throw new Error('Cannot load Resource: Load as js/css?');
                            else item.as = matches[1];
                        }
                        queue.push(item);
                    },
                    loadResource = function(text, res){
                        if (res.as === "js") addscript(text);
                        else addstyle(text);
                        if (typeof res.then === f) res.then();
                    };


            return new Promise(function(resolve, reject){
                buildQueue(args);
                let loaded = 0, length = queue.length, errors = [], success = [], fromcache = [];
                if (length === 0) reject(new Error('Cannot load resource: did you pass an argument?'));

                const handleErrors = function(){
                    if (loaded === length) {
                        let r = {success: success, errors: errors, fromcache: fromcache};
                        if (errors.length === 0) resolve(r);
                        else reject(r);
                    }
                };

                queue.forEach(res => {
                    let {from, name, ttl} = res;
                    let item = $this.getItem(name);
                    if (item.isHit()) {
                        loaded++;
                        loadResource(item.get(), res);
                        fromcache.push(from);
                        success.push(from);
                        return handleErrors();
                    }
                    fetch(from, {redirect: "follow", cache: "no-store"})
                            .then(response => {
                                if (response.status !== 200) throw new Error(response.url);
                                return response.text();
                            })
                            .then(text => {
                                item.set(text);
                                item.expiresAfter(ttl);
                                $this.cache.save(item);
                                loaded++;
                                loadResource(item.get(), res);
                                success.push(from);
                                handleErrors();

                            })
                            .catch(e => {
                                errors.push(from);
                                loaded++;
                                handleErrors();
                            });
                });
            });
        }



    }

    return {
        xStore, gmStore, nullStore,
        UserSettings, LSCache, gmLoader
    };
}));/**
 * Module gmFind
 */
(function(root, factory){
    /* globals define, require, module, self, EventTarget */
    const dependencies = [];
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
        root["gmFind"] = factory(...dependencies.map(dep => require(dep)));/*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function(undef, s = "string", f = "function", n = "number",doc = document ){

    /**
     * Tests whenever the given selector is valid
     * @param {string} selector
     * @returns {Boolean}
     */
    const isValidSelector = function(selector){

        if (typeof selector !== s) return false;
        let valid = true;
        try {
            //throws syntax error on invalid selector
            valid = doc.createElement('template').querySelector(selector) === null;
        } catch (e) {
            valid = false;
        }
        return valid;
    };


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
                    this._params.observer.observe(this.element, {attributes: true, childList: true, subtree: true});
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
                        params.width = width;
                        params.height = height;
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



    return{
        isValidSelector, NodeFinder, ResizeSensor
    };
}));
/**
 * Module gmStyles
 */
(function(root, factory){
    /* globals define, require, module, self */
    const dependencies = ["gmtools"];
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
        root["gmStyles"] = factory(...dependencies.map(dep => require(dep)));/*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function(gmtools){

    const{addstyle} = gmtools;

    let styles, reset, pure, semantic, ui, ready = false;
    /* mini reset */
    reset = '.pure,.pure p,.pure ol,.pure ul,.pure li,.pure dl,.pure dt,.pure dd,.pure blockquote,.pure figure,.pure fieldset,.pure legend,.pure textarea,.pure pre,.pure iframe,.pure hr,.pure h1,.pure h2,.pure h3,.pure h4,.pure h5,.pure h6{margin:0;padding:0}.pure h1,.pure h2,.pure h3,.pure h4,.pure h5,.pure h6{font-size:100%;font-weight:normal}.pure ul{list-style:none}.pure button,.pure input,.pure select,.pure textarea{margin:0}.pure{box-sizing:border-box}.pure, .pure *,.pure *::before,.pure *::after{box-sizing:inherit}.pure img,.pure video{height:auto;max-width:100%}.pure iframe{border:0}.pure table{border-collapse:collapse;border-spacing:0}.pure td,.pure th{padding:0}.pure td:not([align]),.pure th:not([align]){text-align:left}';
    /* adds pure components */
    pure = '.pure{font-family:sans-serif;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}.pure{margin:0}.pure article,.pure aside,.pure details,.pure figcaption,.pure figure,.pure footer,.pure header,.pure hgroup,.pure main,.pure menu,.pure nav,.pure section,.pure summary{display:block}.pure audio,.pure canvas,.pure progress,.pure video{display:inline-block;vertical-align:baseline}.pure audio:not([controls]){display:none;height:0}.pure [hidden],.pure template{display:none}.pure a{background-color:transparent}.pure a:active,.pure a:hover{outline:0}.pure abbr[title]{border-bottom:1px dotted}.pure b,.pure strong{font-weight:700}.pure dfn{font-style:italic}.pure h1{font-size:2em;margin:.67em 0}.pure mark{background:#ff0;color:#000}.pure small{font-size:80%}.pure sub,.pure sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}.pure sup{top:-.5em}.pure sub{bottom:-.25em}.pure img{border:0}.pure svg:not(:root){overflow:hidden}.pure figure{margin:1em 40px}.pure hr{-webkit-box-sizing:content-box;box-sizing:content-box;height:0}.pure pre{overflow:auto}.pure code,.pure kbd,.pure pre,.pure samp{font-family:monospace,monospace;font-size:1em}.pure button,.pure input,.pure optgroup,.pure select,.pure textarea{color:inherit;font:inherit;margin:0}.pure button{overflow:visible}.pure button,.pure select{text-transform:none}.pure button,.pure input[type=button],.pure input[type=reset],.pure input[type=submit]{-webkit-appearance:button;cursor:pointer}.pure button[disabled],.pure input[disabled]{cursor:default}.pure button::-moz-focus-inner,.pure input::-moz-focus-inner{border:0;padding:0}.pure input{line-height:normal}.pure input[type=checkbox],.pure input[type=radio]{-webkit-box-sizing:border-box;box-sizing:border-box;padding:0}.pure input[type=number]::-webkit-inner-spin-button,.pure input[type=number]::-webkit-outer-spin-button{height:auto}.pure input[type=search]{-webkit-appearance:textfield;-webkit-box-sizing:content-box;box-sizing:content-box}.pure input[type=search]::-webkit-search-cancel-button,.pure input[type=search]::-webkit-search-decoration{-webkit-appearance:none}.pure fieldset{border:1px solid silver;margin:0 2px;padding:.35em .625em .75em}.pure legend{border:0;padding:0}.pure textarea{overflow:auto}.pure optgroup{font-weight:700}.pure table{border-collapse:collapse;border-spacing:0}.pure td,.pure th{padding:0}.pure .hidden,.pure [hidden]{display:none!important}.pure .pure-img{max-width:100%;height:auto;display:block}.pure-table{border-collapse:collapse;border-spacing:0;empty-cells:show;border:1px solid #cbcbcb}.pure-table caption{color:#000;font:italic 85%/1 arial,sans-serif;padding:1em 0;text-align:center}.pure-table td,.pure-table th{border-left:1px solid #cbcbcb;border-width:0 0 0 1px;font-size:inherit;margin:0;overflow:visible;padding:.5em 1em}.pure-table thead{background-color:#e0e0e0;color:#000;text-align:left;vertical-align:bottom}.pure-table td{background-color:transparent}.pure-table-odd td{background-color:#f2f2f2}.pure-table-striped tr:nth-child(2n-1) td{background-color:#f2f2f2}.pure-table-bordered td{border-bottom:1px solid #cbcbcb}.pure-table-bordered tbody>tr:last-child>td{border-bottom-width:0}.pure-table-horizontal td,.pure-table-horizontal th{border-width:0 0 1px 0;border-bottom:1px solid #cbcbcb}.pure-table-horizontal tbody>tr:last-child>td{border-bottom-width:0}.pure-menu{-webkit-box-sizing:border-box;box-sizing:border-box}.pure-menu-fixed{position:fixed;left:0;top:0;z-index:3}.pure-menu-item,.pure-menu-list{position:relative}.pure-menu-list{list-style:none;margin:0;padding:0}.pure-menu-item{padding:0;margin:0;height:100%}.pure-menu-heading,.pure-menu-link{display:block;text-decoration:none;white-space:nowrap}.pure-menu-horizontal{width:100%;white-space:nowrap}.pure-menu-horizontal .pure-menu-list{display:inline-block}.pure-menu-horizontal .pure-menu-heading,.pure-menu-horizontal .pure-menu-item,.pure-menu-horizontal .pure-menu-separator{display:inline-block;zoom:1;vertical-align:middle}.pure-menu-item .pure-menu-item{display:block}.pure-menu-children{display:none;position:absolute;left:100%;top:0;margin:0;padding:0;z-index:3}.pure-menu-horizontal .pure-menu-children{left:0;top:auto;width:inherit}.pure-menu-active>.pure-menu-children,.pure-menu-allow-hover:hover>.pure-menu-children{display:block;position:absolute}.pure-menu-has-children>.pure-menu-link:after{padding-left:.5em;content:"\25B8";font-size:small}.pure-menu-horizontal .pure-menu-has-children>.pure-menu-link:after{content:"\25BE"}.pure-menu-scrollable{overflow-y:scroll;overflow-x:hidden}.pure-menu-scrollable .pure-menu-list{display:block}.pure-menu-horizontal.pure-menu-scrollable .pure-menu-list{display:inline-block}.pure-menu-horizontal.pure-menu-scrollable{white-space:nowrap;overflow-y:hidden;overflow-x:auto;-webkit-overflow-scrolling:touch;padding:.5em 0}.pure-menu-horizontal .pure-menu-children .pure-menu-separator,.pure-menu-separator{background-color:#ccc;height:1px;margin:.3em 0}.pure-menu-horizontal .pure-menu-separator{width:1px;height:1.3em;margin:0 .3em}.pure-menu-horizontal .pure-menu-children .pure-menu-separator{display:block;width:auto}.pure-menu-heading{text-transform:uppercase;color:#565d64}.pure-menu-link{color:#777}.pure-menu-children{background-color:#fff}.pure-menu-disabled,.pure-menu-heading,.pure-menu-link{padding:.5em 1em}.pure-menu-disabled{opacity:.5}.pure-menu-disabled .pure-menu-link:hover{background-color:transparent}.pure-menu-active>.pure-menu-link,.pure-menu-link:focus,.pure-menu-link:hover{background-color:#eee}.pure-menu-selected>.pure-menu-link,.pure-menu-selected>.pure-menu-link:visited{color:#000}';
    /* adds semantic components */
    semantic = `.ui.button{cursor:pointer;display:inline-block;min-height:1em;outline:0;border:none;vertical-align:baseline;background:#e0e1e2 none;color:rgba(0,0,0,.6);font-family:Lato,'Helvetica Neue',Arial,Helvetica,sans-serif;margin:0 .25em 0 0;padding:.78571429em 1.5em .78571429em;text-transform:none;text-shadow:none;font-weight:700;line-height:1em;font-style:normal;text-align:center;text-decoration:none;border-radius:.28571429rem;-webkit-box-shadow:0 0 0 1px transparent inset,0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 1px transparent inset,0 0 0 0 rgba(34,36,38,.15) inset;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-webkit-transition:opacity .1s ease,background-color .1s ease,color .1s ease,background .1s ease,-webkit-box-shadow .1s ease;transition:opacity .1s ease,background-color .1s ease,color .1s ease,background .1s ease,-webkit-box-shadow .1s ease;transition:opacity .1s ease,background-color .1s ease,color .1s ease,box-shadow .1s ease,background .1s ease;transition:opacity .1s ease,background-color .1s ease,color .1s ease,box-shadow .1s ease,background .1s ease,-webkit-box-shadow .1s ease;will-change:'';-webkit-tap-highlight-color:transparent}.ui.button:hover{background-color:#cacbcd;background-image:none;-webkit-box-shadow:0 0 0 1px transparent inset,0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 1px transparent inset,0 0 0 0 rgba(34,36,38,.15) inset;color:rgba(0,0,0,.8)}.ui.button:hover .icon{opacity:.85}.ui.button:focus{background-color:#cacbcd;color:rgba(0,0,0,.8);background-image:''!important;-webkit-box-shadow:''!important;box-shadow:''!important}.ui.button:focus .icon{opacity:.85}.ui.active.button:active,.ui.button:active{background-color:#babbbc;background-image:'';color:rgba(0,0,0,.9);-webkit-box-shadow:0 0 0 1px transparent inset,none;box-shadow:0 0 0 1px transparent inset,none}.ui.active.button{background-color:#c0c1c2;background-image:none;-webkit-box-shadow:0 0 0 1px transparent inset;box-shadow:0 0 0 1px transparent inset;color:rgba(0,0,0,.95)}.ui.active.button:hover{background-color:#c0c1c2;background-image:none;color:rgba(0,0,0,.95)}.ui.active.button:active{background-color:#c0c1c2;background-image:none}.ui.loading.loading.loading.loading.loading.loading.button{position:relative;cursor:default;text-shadow:none!important;color:transparent!important;opacity:1;pointer-events:auto;-webkit-transition:all 0s linear,opacity .1s ease;transition:all 0s linear,opacity .1s ease}.ui.loading.button:before{position:absolute;content:'';top:50%;left:50%;margin:-.64285714em 0 0 -.64285714em;width:1.28571429em;height:1.28571429em;border-radius:500rem;border:.2em solid rgba(0,0,0,.15)}.ui.loading.button:after{position:absolute;content:'';top:50%;left:50%;margin:-.64285714em 0 0 -.64285714em;width:1.28571429em;height:1.28571429em;-webkit-animation:button-spin .6s linear;animation:button-spin .6s linear;-webkit-animation-iteration-count:infinite;animation-iteration-count:infinite;border-radius:500rem;border-color:#fff transparent transparent;border-style:solid;border-width:.2em;-webkit-box-shadow:0 0 0 1px transparent;box-shadow:0 0 0 1px transparent}.ui.labeled.icon.loading.button .icon{background-color:transparent;-webkit-box-shadow:none;box-shadow:none}@-webkit-keyframes button-spin{from{-webkit-transform:rotate(0);transform:rotate(0)}to{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes button-spin{from{-webkit-transform:rotate(0);transform:rotate(0)}to{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}.ui.basic.loading.button:not(.inverted):before{border-color:rgba(0,0,0,.1)}.ui.basic.loading.button:not(.inverted):after{border-top-color:#767676}.ui.button:disabled,.ui.buttons .disabled.button,.ui.disabled.active.button,.ui.disabled.button,.ui.disabled.button:hover{cursor:default;opacity:.45!important;background-image:none!important;-webkit-box-shadow:none!important;box-shadow:none!important;pointer-events:none!important}.ui.basic.buttons .ui.disabled.button{border-color:rgba(34,36,38,.5)}.ui.animated.button{position:relative;overflow:hidden;padding-right:0!important;vertical-align:middle;z-index:1}.ui.animated.button .content{will-change:transform,opacity}.ui.animated.button .visible.content{position:relative;margin-right:1.5em}.ui.animated.button .hidden.content{position:absolute;width:100%}.ui.animated.button .hidden.content,.ui.animated.button .visible.content{-webkit-transition:right .3s ease 0s;transition:right .3s ease 0s}.ui.animated.button .visible.content{left:auto;right:0}.ui.animated.button .hidden.content{top:50%;left:auto;right:-100%;margin-top:-.5em}.ui.animated.button:focus .visible.content,.ui.animated.button:hover .visible.content{left:auto;right:200%}.ui.animated.button:focus .hidden.content,.ui.animated.button:hover .hidden.content{left:auto;right:0}.ui.vertical.animated.button .hidden.content,.ui.vertical.animated.button .visible.content{-webkit-transition:top .3s ease,-webkit-transform .3s ease;transition:top .3s ease,-webkit-transform .3s ease;transition:top .3s ease,transform .3s ease;transition:top .3s ease,transform .3s ease,-webkit-transform .3s ease}.ui.vertical.animated.button .visible.content{-webkit-transform:translateY(0);transform:translateY(0);right:auto}.ui.vertical.animated.button .hidden.content{top:-50%;left:0;right:auto}.ui.vertical.animated.button:focus .visible.content,.ui.vertical.animated.button:hover .visible.content{-webkit-transform:translateY(200%);transform:translateY(200%);right:auto}.ui.vertical.animated.button:focus .hidden.content,.ui.vertical.animated.button:hover .hidden.content{top:50%;right:auto}.ui.fade.animated.button .hidden.content,.ui.fade.animated.button .visible.content{-webkit-transition:opacity .3s ease,-webkit-transform .3s ease;transition:opacity .3s ease,-webkit-transform .3s ease;transition:opacity .3s ease,transform .3s ease;transition:opacity .3s ease,transform .3s ease,-webkit-transform .3s ease}.ui.fade.animated.button .visible.content{left:auto;right:auto;opacity:1;-webkit-transform:scale(1);transform:scale(1)}.ui.fade.animated.button .hidden.content{opacity:0;left:0;right:auto;-webkit-transform:scale(1.5);transform:scale(1.5)}.ui.fade.animated.button:focus .visible.content,.ui.fade.animated.button:hover .visible.content{left:auto;right:auto;opacity:0;-webkit-transform:scale(.75);transform:scale(.75)}.ui.fade.animated.button:focus .hidden.content,.ui.fade.animated.button:hover .hidden.content{left:0;right:auto;opacity:1;-webkit-transform:scale(1);transform:scale(1)}.ui.inverted.button{-webkit-box-shadow:0 0 0 2px #fff inset!important;box-shadow:0 0 0 2px #fff inset!important;background:transparent none;color:#fff;text-shadow:none!important}.ui.inverted.buttons .button{margin:0 0 0 -2px}.ui.inverted.buttons .button:first-child{margin-left:0}.ui.inverted.vertical.buttons .button{margin:0 0 -2px 0}.ui.inverted.vertical.buttons .button:first-child{margin-top:0}.ui.inverted.button:hover{background:#fff;-webkit-box-shadow:0 0 0 2px #fff inset!important;box-shadow:0 0 0 2px #fff inset!important;color:rgba(0,0,0,.8)}.ui.inverted.button.active,.ui.inverted.button:focus{background:#fff;-webkit-box-shadow:0 0 0 2px #fff inset!important;box-shadow:0 0 0 2px #fff inset!important;color:rgba(0,0,0,.8)}.ui.inverted.button.active:focus{background:#dcddde;-webkit-box-shadow:0 0 0 2px #dcddde inset!important;box-shadow:0 0 0 2px #dcddde inset!important;color:rgba(0,0,0,.8)}.ui.labeled.button:not(.icon){display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-orient:horizontal;-webkit-box-direction:normal;-ms-flex-direction:row;flex-direction:row;background:0 0!important;padding:0!important;border:none!important;-webkit-box-shadow:none!important;box-shadow:none!important}.ui.labeled.button>.button{margin:0}.ui.labeled.button>.label{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;margin:0 0 0 -1px!important;padding:'';font-size:1em;border-color:rgba(34,36,38,.15)}.ui.labeled.button>.tag.label:before{width:1.85em;height:1.85em}.ui.labeled.button:not([class*="left labeled"])>.button{border-top-right-radius:0;border-bottom-right-radius:0}.ui.labeled.button:not([class*="left labeled"])>.label{border-top-left-radius:0;border-bottom-left-radius:0}.ui[class*="left labeled"].button>.button{border-top-left-radius:0;border-bottom-left-radius:0}.ui[class*="left labeled"].button>.label{border-top-right-radius:0;border-bottom-right-radius:0}.ui.facebook.button{background-color:#3b5998;color:#fff;text-shadow:none;background-image:none;-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.facebook.button:hover{background-color:#304d8a;color:#fff;text-shadow:none}.ui.facebook.button:active{background-color:#2d4373;color:#fff;text-shadow:none}.ui.twitter.button{background-color:#55acee;color:#fff;text-shadow:none;background-image:none;-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.twitter.button:hover{background-color:#35a2f4;color:#fff;text-shadow:none}.ui.twitter.button:active{background-color:#2795e9;color:#fff;text-shadow:none}.ui.google.plus.button{background-color:#dd4b39;color:#fff;text-shadow:none;background-image:none;-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.google.plus.button:hover{background-color:#e0321c;color:#fff;text-shadow:none}.ui.google.plus.button:active{background-color:#c23321;color:#fff;text-shadow:none}.ui.linkedin.button{background-color:#1f88be;color:#fff;text-shadow:none}.ui.linkedin.button:hover{background-color:#147baf;color:#fff;text-shadow:none}.ui.linkedin.button:active{background-color:#186992;color:#fff;text-shadow:none}.ui.youtube.button{background-color:red;color:#fff;text-shadow:none;background-image:none;-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.youtube.button:hover{background-color:#e60000;color:#fff;text-shadow:none}.ui.youtube.button:active{background-color:#c00;color:#fff;text-shadow:none}.ui.instagram.button{background-color:#49769c;color:#fff;text-shadow:none;background-image:none;-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.instagram.button:hover{background-color:#3d698e;color:#fff;text-shadow:none}.ui.instagram.button:active{background-color:#395c79;color:#fff;text-shadow:none}.ui.pinterest.button{background-color:#bd081c;color:#fff;text-shadow:none;background-image:none;-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.pinterest.button:hover{background-color:#ac0013;color:#fff;text-shadow:none}.ui.pinterest.button:active{background-color:#8c0615;color:#fff;text-shadow:none}.ui.vk.button{background-color:#4d7198;color:#fff;background-image:none;-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.vk.button:hover{background-color:#41648a;color:#fff}.ui.vk.button:active{background-color:#3c5876;color:#fff}.ui.button>.icon:not(.button){height:.85714286em;opacity:.8;margin:0 .42857143em 0 -.21428571em;-webkit-transition:opacity .1s ease;transition:opacity .1s ease;vertical-align:'';color:''}.ui.button:not(.icon)>.icon:not(.button):not(.dropdown){margin:0 .42857143em 0 -.21428571em}.ui.button:not(.icon)>.right.icon:not(.button):not(.dropdown){margin:0 -.21428571em 0 .42857143em}.ui[class*="left floated"].button,.ui[class*="left floated"].buttons{float:left;margin-left:0;margin-right:.25em}.ui[class*="right floated"].button,.ui[class*="right floated"].buttons{float:right;margin-right:0;margin-left:.25em}.ui.compact.button,.ui.compact.buttons .button{padding:.58928571em 1.125em .58928571em}.ui.compact.icon.button,.ui.compact.icon.buttons .button{padding:.58928571em .58928571em .58928571em}.ui.compact.labeled.icon.button,.ui.compact.labeled.icon.buttons .button{padding:.58928571em 3.69642857em .58928571em}.ui.mini.button,.ui.mini.buttons .button,.ui.mini.buttons .or{font-size:.78571429rem}.ui.tiny.button,.ui.tiny.buttons .button,.ui.tiny.buttons .or{font-size:.85714286rem}.ui.small.button,.ui.small.buttons .button,.ui.small.buttons .or{font-size:.92857143rem}.ui.button,.ui.buttons .button,.ui.buttons .or{font-size:1rem}.ui.large.button,.ui.large.buttons .button,.ui.large.buttons .or{font-size:1.14285714rem}.ui.big.button,.ui.big.buttons .button,.ui.big.buttons .or{font-size:1.28571429rem}.ui.huge.button,.ui.huge.buttons .button,.ui.huge.buttons .or{font-size:1.42857143rem}.ui.massive.button,.ui.massive.buttons .button,.ui.massive.buttons .or{font-size:1.71428571rem}.ui.icon.button,.ui.icon.buttons .button{padding:.78571429em .78571429em .78571429em}.ui.icon.button>.icon,.ui.icon.buttons .button>.icon{opacity:.9;margin:0!important;vertical-align:top}.ui.basic.button,.ui.basic.buttons .button{background:transparent none!important;color:rgba(0,0,0,.6)!important;font-weight:400;border-radius:.28571429rem;text-transform:none;text-shadow:none!important;-webkit-box-shadow:0 0 0 1px rgba(34,36,38,.15) inset;box-shadow:0 0 0 1px rgba(34,36,38,.15) inset}.ui.basic.buttons{-webkit-box-shadow:none;box-shadow:none;border:1px solid rgba(34,36,38,.15);border-radius:.28571429rem}.ui.basic.buttons .button{border-radius:0}.ui.basic.button:hover,.ui.basic.buttons .button:hover{background:#fff!important;color:rgba(0,0,0,.8)!important;-webkit-box-shadow:0 0 0 1px rgba(34,36,38,.35) inset,0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 1px rgba(34,36,38,.35) inset,0 0 0 0 rgba(34,36,38,.15) inset}.ui.basic.button:focus,.ui.basic.buttons .button:focus{background:#fff!important;color:rgba(0,0,0,.8)!important;-webkit-box-shadow:0 0 0 1px rgba(34,36,38,.35) inset,0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 1px rgba(34,36,38,.35) inset,0 0 0 0 rgba(34,36,38,.15) inset}.ui.basic.button:active,.ui.basic.buttons .button:active{background:#f8f8f8!important;color:rgba(0,0,0,.9)!important;-webkit-box-shadow:0 0 0 1px rgba(0,0,0,.15) inset,0 1px 4px 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 1px rgba(0,0,0,.15) inset,0 1px 4px 0 rgba(34,36,38,.15) inset}.ui.basic.active.button,.ui.basic.buttons .active.button{background:rgba(0,0,0,.05)!important;-webkit-box-shadow:''!important;box-shadow:''!important;color:rgba(0,0,0,.95)!important}.ui.basic.active.button:hover,.ui.basic.buttons .active.button:hover{background-color:rgba(0,0,0,.05)}.ui.basic.buttons .button:hover{-webkit-box-shadow:0 0 0 1px rgba(34,36,38,.35) inset,0 0 0 0 rgba(34,36,38,.15) inset inset;box-shadow:0 0 0 1px rgba(34,36,38,.35) inset,0 0 0 0 rgba(34,36,38,.15) inset inset}.ui.basic.buttons .button:active{-webkit-box-shadow:0 0 0 1px rgba(0,0,0,.15) inset,0 1px 4px 0 rgba(34,36,38,.15) inset inset;box-shadow:0 0 0 1px rgba(0,0,0,.15) inset,0 1px 4px 0 rgba(34,36,38,.15) inset inset}.ui.basic.buttons .active.button{-webkit-box-shadow:''!important;box-shadow:''!important}.ui.basic.inverted.button,.ui.basic.inverted.buttons .button{background-color:transparent!important;color:#f9fafb!important;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important}.ui.basic.inverted.button:hover,.ui.basic.inverted.buttons .button:hover{color:#fff!important;-webkit-box-shadow:0 0 0 2px #fff inset!important;box-shadow:0 0 0 2px #fff inset!important}.ui.basic.inverted.button:focus,.ui.basic.inverted.buttons .button:focus{color:#fff!important;-webkit-box-shadow:0 0 0 2px #fff inset!important;box-shadow:0 0 0 2px #fff inset!important}.ui.basic.inverted.button:active,.ui.basic.inverted.buttons .button:active{background-color:rgba(255,255,255,.08)!important;color:#fff!important;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.9) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.9) inset!important}.ui.basic.inverted.active.button,.ui.basic.inverted.buttons .active.button{background-color:rgba(255,255,255,.08);color:#fff;text-shadow:none;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.7) inset;box-shadow:0 0 0 2px rgba(255,255,255,.7) inset}.ui.basic.inverted.active.button:hover,.ui.basic.inverted.buttons .active.button:hover{background-color:rgba(255,255,255,.15);-webkit-box-shadow:0 0 0 2px #fff inset!important;box-shadow:0 0 0 2px #fff inset!important}.ui.basic.buttons .button{border-left:1px solid rgba(34,36,38,.15);-webkit-box-shadow:none;box-shadow:none}.ui.basic.vertical.buttons .button{border-left:none}.ui.basic.vertical.buttons .button{border-left-width:0;border-top:1px solid rgba(34,36,38,.15)}.ui.basic.vertical.buttons .button:first-child{border-top-width:0}.ui.labeled.icon.button,.ui.labeled.icon.buttons .button{position:relative;padding-left:4.07142857em!important;padding-right:1.5em!important}.ui.labeled.icon.button>.icon,.ui.labeled.icon.buttons>.button>.icon{position:absolute;height:100%;line-height:1;border-radius:0;border-top-left-radius:inherit;border-bottom-left-radius:inherit;text-align:center;margin:0;width:2.57142857em;background-color:rgba(0,0,0,.05);color:'';-webkit-box-shadow:-1px 0 0 0 transparent inset;box-shadow:-1px 0 0 0 transparent inset}.ui.labeled.icon.button>.icon,.ui.labeled.icon.buttons>.button>.icon{top:0;left:0}.ui[class*="right labeled"].icon.button{padding-right:4.07142857em!important;padding-left:1.5em!important}.ui[class*="right labeled"].icon.button>.icon{left:auto;right:0;border-radius:0;border-top-right-radius:inherit;border-bottom-right-radius:inherit;-webkit-box-shadow:1px 0 0 0 transparent inset;box-shadow:1px 0 0 0 transparent inset}.ui.labeled.icon.button>.icon:after,.ui.labeled.icon.button>.icon:before,.ui.labeled.icon.buttons>.button>.icon:after,.ui.labeled.icon.buttons>.button>.icon:before{display:block;position:absolute;width:100%;top:50%;text-align:center;-webkit-transform:translateY(-50%);transform:translateY(-50%)}.ui.labeled.icon.buttons .button>.icon{border-radius:0}.ui.labeled.icon.buttons .button:first-child>.icon{border-top-left-radius:.28571429rem;border-bottom-left-radius:.28571429rem}.ui.labeled.icon.buttons .button:last-child>.icon{border-top-right-radius:.28571429rem;border-bottom-right-radius:.28571429rem}.ui.vertical.labeled.icon.buttons .button:first-child>.icon{border-radius:0;border-top-left-radius:.28571429rem}.ui.vertical.labeled.icon.buttons .button:last-child>.icon{border-radius:0;border-bottom-left-radius:.28571429rem}.ui.fluid[class*="left labeled"].icon.button,.ui.fluid[class*="right labeled"].icon.button{padding-left:1.5em!important;padding-right:1.5em!important}.ui.button.toggle.active,.ui.buttons .button.toggle.active,.ui.toggle.buttons .active.button{background-color:#21ba45!important;-webkit-box-shadow:none!important;box-shadow:none!important;text-shadow:none;color:#fff!important}.ui.button.toggle.active:hover{background-color:#16ab39!important;text-shadow:none;color:#fff!important}.ui.circular.button{border-radius:10em}.ui.circular.button>.icon{width:1em;vertical-align:baseline}.ui.buttons .or{position:relative;width:.3em;height:2.57142857em;z-index:3}.ui.buttons .or:before{position:absolute;text-align:center;border-radius:500rem;content:'or';top:50%;left:50%;background-color:#fff;text-shadow:none;margin-top:-.89285714em;margin-left:-.89285714em;width:1.78571429em;height:1.78571429em;line-height:1.78571429em;color:rgba(0,0,0,.4);font-style:normal;font-weight:700;-webkit-box-shadow:0 0 0 1px transparent inset;box-shadow:0 0 0 1px transparent inset}.ui.buttons .or[data-text]:before{content:attr(data-text)}.ui.fluid.buttons .or{width:0!important}.ui.fluid.buttons .or:after{display:none}.ui.attached.button{position:relative;display:block;margin:0;border-radius:0;-webkit-box-shadow:0 0 0 1px rgba(34,36,38,.15)!important;box-shadow:0 0 0 1px rgba(34,36,38,.15)!important}.ui.attached.top.button{border-radius:.28571429rem .28571429rem 0 0}.ui.attached.bottom.button{border-radius:0 0 .28571429rem .28571429rem}.ui.left.attached.button{display:inline-block;border-left:none;text-align:right;padding-right:.75em;border-radius:.28571429rem 0 0 .28571429rem}.ui.right.attached.button{display:inline-block;text-align:left;padding-left:.75em;border-radius:0 .28571429rem .28571429rem 0}.ui.attached.buttons{position:relative;display:-webkit-box;display:-ms-flexbox;display:flex;border-radius:0;width:auto!important;z-index:2;margin-left:-1px;margin-right:-1px}.ui.attached.buttons .button{margin:0}.ui.attached.buttons .button:first-child{border-radius:0}.ui.attached.buttons .button:last-child{border-radius:0}.ui[class*="top attached"].buttons{margin-bottom:-1px;border-radius:.28571429rem .28571429rem 0 0}.ui[class*="top attached"].buttons .button:first-child{border-radius:.28571429rem 0 0 0}.ui[class*="top attached"].buttons .button:last-child{border-radius:0 .28571429rem 0 0}.ui[class*="bottom attached"].buttons{margin-top:-1px;border-radius:0 0 .28571429rem .28571429rem}.ui[class*="bottom attached"].buttons .button:first-child{border-radius:0 0 0 .28571429rem}.ui[class*="bottom attached"].buttons .button:last-child{border-radius:0 0 .28571429rem 0}.ui[class*="left attached"].buttons{display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;margin-right:0;margin-left:-1px;border-radius:0 .28571429rem .28571429rem 0}.ui[class*="left attached"].buttons .button:first-child{margin-left:-1px;border-radius:0 .28571429rem 0 0}.ui[class*="left attached"].buttons .button:last-child{margin-left:-1px;border-radius:0 0 .28571429rem 0}.ui[class*="right attached"].buttons{display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;margin-left:0;margin-right:-1px;border-radius:.28571429rem 0 0 .28571429rem}.ui[class*="right attached"].buttons .button:first-child{margin-left:-1px;border-radius:.28571429rem 0 0 0}.ui[class*="right attached"].buttons .button:last-child{margin-left:-1px;border-radius:0 0 0 .28571429rem}.ui.fluid.button,.ui.fluid.buttons{width:100%}.ui.fluid.button{display:block}.ui.two.buttons{width:100%}.ui.two.buttons>.button{width:50%}.ui.three.buttons{width:100%}.ui.three.buttons>.button{width:33.333%}.ui.four.buttons{width:100%}.ui.four.buttons>.button{width:25%}.ui.five.buttons{width:100%}.ui.five.buttons>.button{width:20%}.ui.six.buttons{width:100%}.ui.six.buttons>.button{width:16.666%}.ui.seven.buttons{width:100%}.ui.seven.buttons>.button{width:14.285%}.ui.eight.buttons{width:100%}.ui.eight.buttons>.button{width:12.5%}.ui.nine.buttons{width:100%}.ui.nine.buttons>.button{width:11.11%}.ui.ten.buttons{width:100%}.ui.ten.buttons>.button{width:10%}.ui.eleven.buttons{width:100%}.ui.eleven.buttons>.button{width:9.09%}.ui.twelve.buttons{width:100%}.ui.twelve.buttons>.button{width:8.3333%}.ui.fluid.vertical.buttons,.ui.fluid.vertical.buttons>.button{display:-webkit-box;display:-ms-flexbox;display:flex;width:auto}.ui.two.vertical.buttons>.button{height:50%}.ui.three.vertical.buttons>.button{height:33.333%}.ui.four.vertical.buttons>.button{height:25%}.ui.five.vertical.buttons>.button{height:20%}.ui.six.vertical.buttons>.button{height:16.666%}.ui.seven.vertical.buttons>.button{height:14.285%}.ui.eight.vertical.buttons>.button{height:12.5%}.ui.nine.vertical.buttons>.button{height:11.11%}.ui.ten.vertical.buttons>.button{height:10%}.ui.eleven.vertical.buttons>.button{height:9.09%}.ui.twelve.vertical.buttons>.button{height:8.3333%}.ui.black.button,.ui.black.buttons .button{background-color:#1b1c1d;color:#fff;text-shadow:none;background-image:none}.ui.black.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.black.button:hover,.ui.black.buttons .button:hover{background-color:#27292a;color:#fff;text-shadow:none}.ui.black.button:focus,.ui.black.buttons .button:focus{background-color:#2f3032;color:#fff;text-shadow:none}.ui.black.button:active,.ui.black.buttons .button:active{background-color:#343637;color:#fff;text-shadow:none}.ui.black.active.button,.ui.black.button .active.button:active,.ui.black.buttons .active.button,.ui.black.buttons .active.button:active{background-color:#0f0f10;color:#fff;text-shadow:none}.ui.basic.black.button,.ui.basic.black.buttons .button{-webkit-box-shadow:0 0 0 1px #1b1c1d inset!important;box-shadow:0 0 0 1px #1b1c1d inset!important;color:#1b1c1d!important}.ui.basic.black.button:hover,.ui.basic.black.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #27292a inset!important;box-shadow:0 0 0 1px #27292a inset!important;color:#27292a!important}.ui.basic.black.button:focus,.ui.basic.black.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #2f3032 inset!important;box-shadow:0 0 0 1px #2f3032 inset!important;color:#27292a!important}.ui.basic.black.active.button,.ui.basic.black.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #0f0f10 inset!important;box-shadow:0 0 0 1px #0f0f10 inset!important;color:#343637!important}.ui.basic.black.button:active,.ui.basic.black.buttons .button:active{-webkit-box-shadow:0 0 0 1px #343637 inset!important;box-shadow:0 0 0 1px #343637 inset!important;color:#343637!important}.ui.buttons:not(.vertical)>.basic.black.button:not(:first-child){margin-left:-1px}.ui.inverted.black.button,.ui.inverted.black.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #d4d4d5 inset!important;box-shadow:0 0 0 2px #d4d4d5 inset!important;color:#fff}.ui.inverted.black.button.active,.ui.inverted.black.button:active,.ui.inverted.black.button:focus,.ui.inverted.black.button:hover,.ui.inverted.black.buttons .button.active,.ui.inverted.black.buttons .button:active,.ui.inverted.black.buttons .button:focus,.ui.inverted.black.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:#fff}.ui.inverted.black.button:hover,.ui.inverted.black.buttons .button:hover{background-color:#000}.ui.inverted.black.button:focus,.ui.inverted.black.buttons .button:focus{background-color:#000}.ui.inverted.black.active.button,.ui.inverted.black.buttons .active.button{background-color:#000}.ui.inverted.black.button:active,.ui.inverted.black.buttons .button:active{background-color:#000}.ui.inverted.black.basic.button,.ui.inverted.black.basic.buttons .button,.ui.inverted.black.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.black.basic.button:hover,.ui.inverted.black.basic.buttons .button:hover,.ui.inverted.black.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #000 inset!important;box-shadow:0 0 0 2px #000 inset!important;color:#fff!important}.ui.inverted.black.basic.button:focus,.ui.inverted.black.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #000 inset!important;box-shadow:0 0 0 2px #000 inset!important;color:#545454!important}.ui.inverted.black.basic.active.button,.ui.inverted.black.basic.buttons .active.button,.ui.inverted.black.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #000 inset!important;box-shadow:0 0 0 2px #000 inset!important;color:#fff!important}.ui.inverted.black.basic.button:active,.ui.inverted.black.basic.buttons .button:active,.ui.inverted.black.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #000 inset!important;box-shadow:0 0 0 2px #000 inset!important;color:#fff!important}.ui.grey.button,.ui.grey.buttons .button{background-color:#767676;color:#fff;text-shadow:none;background-image:none}.ui.grey.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.grey.button:hover,.ui.grey.buttons .button:hover{background-color:#838383;color:#fff;text-shadow:none}.ui.grey.button:focus,.ui.grey.buttons .button:focus{background-color:#8a8a8a;color:#fff;text-shadow:none}.ui.grey.button:active,.ui.grey.buttons .button:active{background-color:#909090;color:#fff;text-shadow:none}.ui.grey.active.button,.ui.grey.button .active.button:active,.ui.grey.buttons .active.button,.ui.grey.buttons .active.button:active{background-color:#696969;color:#fff;text-shadow:none}.ui.basic.grey.button,.ui.basic.grey.buttons .button{-webkit-box-shadow:0 0 0 1px #767676 inset!important;box-shadow:0 0 0 1px #767676 inset!important;color:#767676!important}.ui.basic.grey.button:hover,.ui.basic.grey.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #838383 inset!important;box-shadow:0 0 0 1px #838383 inset!important;color:#838383!important}.ui.basic.grey.button:focus,.ui.basic.grey.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #8a8a8a inset!important;box-shadow:0 0 0 1px #8a8a8a inset!important;color:#838383!important}.ui.basic.grey.active.button,.ui.basic.grey.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #696969 inset!important;box-shadow:0 0 0 1px #696969 inset!important;color:#909090!important}.ui.basic.grey.button:active,.ui.basic.grey.buttons .button:active{-webkit-box-shadow:0 0 0 1px #909090 inset!important;box-shadow:0 0 0 1px #909090 inset!important;color:#909090!important}.ui.buttons:not(.vertical)>.basic.grey.button:not(:first-child){margin-left:-1px}.ui.inverted.grey.button,.ui.inverted.grey.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #d4d4d5 inset!important;box-shadow:0 0 0 2px #d4d4d5 inset!important;color:#fff}.ui.inverted.grey.button.active,.ui.inverted.grey.button:active,.ui.inverted.grey.button:focus,.ui.inverted.grey.button:hover,.ui.inverted.grey.buttons .button.active,.ui.inverted.grey.buttons .button:active,.ui.inverted.grey.buttons .button:focus,.ui.inverted.grey.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:rgba(0,0,0,.6)}.ui.inverted.grey.button:hover,.ui.inverted.grey.buttons .button:hover{background-color:#cfd0d2}.ui.inverted.grey.button:focus,.ui.inverted.grey.buttons .button:focus{background-color:#c7c9cb}.ui.inverted.grey.active.button,.ui.inverted.grey.buttons .active.button{background-color:#cfd0d2}.ui.inverted.grey.button:active,.ui.inverted.grey.buttons .button:active{background-color:#c2c4c5}.ui.inverted.grey.basic.button,.ui.inverted.grey.basic.buttons .button,.ui.inverted.grey.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.grey.basic.button:hover,.ui.inverted.grey.basic.buttons .button:hover,.ui.inverted.grey.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #cfd0d2 inset!important;box-shadow:0 0 0 2px #cfd0d2 inset!important;color:#fff!important}.ui.inverted.grey.basic.button:focus,.ui.inverted.grey.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #c7c9cb inset!important;box-shadow:0 0 0 2px #c7c9cb inset!important;color:#dcddde!important}.ui.inverted.grey.basic.active.button,.ui.inverted.grey.basic.buttons .active.button,.ui.inverted.grey.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #cfd0d2 inset!important;box-shadow:0 0 0 2px #cfd0d2 inset!important;color:#fff!important}.ui.inverted.grey.basic.button:active,.ui.inverted.grey.basic.buttons .button:active,.ui.inverted.grey.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #c2c4c5 inset!important;box-shadow:0 0 0 2px #c2c4c5 inset!important;color:#fff!important}.ui.brown.button,.ui.brown.buttons .button{background-color:#a5673f;color:#fff;text-shadow:none;background-image:none}.ui.brown.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.brown.button:hover,.ui.brown.buttons .button:hover{background-color:#975b33;color:#fff;text-shadow:none}.ui.brown.button:focus,.ui.brown.buttons .button:focus{background-color:#90532b;color:#fff;text-shadow:none}.ui.brown.button:active,.ui.brown.buttons .button:active{background-color:#805031;color:#fff;text-shadow:none}.ui.brown.active.button,.ui.brown.button .active.button:active,.ui.brown.buttons .active.button,.ui.brown.buttons .active.button:active{background-color:#995a31;color:#fff;text-shadow:none}.ui.basic.brown.button,.ui.basic.brown.buttons .button{-webkit-box-shadow:0 0 0 1px #a5673f inset!important;box-shadow:0 0 0 1px #a5673f inset!important;color:#a5673f!important}.ui.basic.brown.button:hover,.ui.basic.brown.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #975b33 inset!important;box-shadow:0 0 0 1px #975b33 inset!important;color:#975b33!important}.ui.basic.brown.button:focus,.ui.basic.brown.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #90532b inset!important;box-shadow:0 0 0 1px #90532b inset!important;color:#975b33!important}.ui.basic.brown.active.button,.ui.basic.brown.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #995a31 inset!important;box-shadow:0 0 0 1px #995a31 inset!important;color:#805031!important}.ui.basic.brown.button:active,.ui.basic.brown.buttons .button:active{-webkit-box-shadow:0 0 0 1px #805031 inset!important;box-shadow:0 0 0 1px #805031 inset!important;color:#805031!important}.ui.buttons:not(.vertical)>.basic.brown.button:not(:first-child){margin-left:-1px}.ui.inverted.brown.button,.ui.inverted.brown.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #d67c1c inset!important;box-shadow:0 0 0 2px #d67c1c inset!important;color:#d67c1c}.ui.inverted.brown.button.active,.ui.inverted.brown.button:active,.ui.inverted.brown.button:focus,.ui.inverted.brown.button:hover,.ui.inverted.brown.buttons .button.active,.ui.inverted.brown.buttons .button:active,.ui.inverted.brown.buttons .button:focus,.ui.inverted.brown.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:#fff}.ui.inverted.brown.button:hover,.ui.inverted.brown.buttons .button:hover{background-color:#c86f11}.ui.inverted.brown.button:focus,.ui.inverted.brown.buttons .button:focus{background-color:#c16808}.ui.inverted.brown.active.button,.ui.inverted.brown.buttons .active.button{background-color:#cc6f0d}.ui.inverted.brown.button:active,.ui.inverted.brown.buttons .button:active{background-color:#a96216}.ui.inverted.brown.basic.button,.ui.inverted.brown.basic.buttons .button,.ui.inverted.brown.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.brown.basic.button:hover,.ui.inverted.brown.basic.buttons .button:hover,.ui.inverted.brown.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #c86f11 inset!important;box-shadow:0 0 0 2px #c86f11 inset!important;color:#d67c1c!important}.ui.inverted.brown.basic.button:focus,.ui.inverted.brown.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #c16808 inset!important;box-shadow:0 0 0 2px #c16808 inset!important;color:#d67c1c!important}.ui.inverted.brown.basic.active.button,.ui.inverted.brown.basic.buttons .active.button,.ui.inverted.brown.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #cc6f0d inset!important;box-shadow:0 0 0 2px #cc6f0d inset!important;color:#d67c1c!important}.ui.inverted.brown.basic.button:active,.ui.inverted.brown.basic.buttons .button:active,.ui.inverted.brown.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #a96216 inset!important;box-shadow:0 0 0 2px #a96216 inset!important;color:#d67c1c!important}.ui.blue.button,.ui.blue.buttons .button{background-color:#2185d0;color:#fff;text-shadow:none;background-image:none}.ui.blue.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.blue.button:hover,.ui.blue.buttons .button:hover{background-color:#1678c2;color:#fff;text-shadow:none}.ui.blue.button:focus,.ui.blue.buttons .button:focus{background-color:#0d71bb;color:#fff;text-shadow:none}.ui.blue.button:active,.ui.blue.buttons .button:active{background-color:#1a69a4;color:#fff;text-shadow:none}.ui.blue.active.button,.ui.blue.button .active.button:active,.ui.blue.buttons .active.button,.ui.blue.buttons .active.button:active{background-color:#1279c6;color:#fff;text-shadow:none}.ui.basic.blue.button,.ui.basic.blue.buttons .button{-webkit-box-shadow:0 0 0 1px #2185d0 inset!important;box-shadow:0 0 0 1px #2185d0 inset!important;color:#2185d0!important}.ui.basic.blue.button:hover,.ui.basic.blue.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #1678c2 inset!important;box-shadow:0 0 0 1px #1678c2 inset!important;color:#1678c2!important}.ui.basic.blue.button:focus,.ui.basic.blue.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #0d71bb inset!important;box-shadow:0 0 0 1px #0d71bb inset!important;color:#1678c2!important}.ui.basic.blue.active.button,.ui.basic.blue.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #1279c6 inset!important;box-shadow:0 0 0 1px #1279c6 inset!important;color:#1a69a4!important}.ui.basic.blue.button:active,.ui.basic.blue.buttons .button:active{-webkit-box-shadow:0 0 0 1px #1a69a4 inset!important;box-shadow:0 0 0 1px #1a69a4 inset!important;color:#1a69a4!important}.ui.buttons:not(.vertical)>.basic.blue.button:not(:first-child){margin-left:-1px}.ui.inverted.blue.button,.ui.inverted.blue.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #54c8ff inset!important;box-shadow:0 0 0 2px #54c8ff inset!important;color:#54c8ff}.ui.inverted.blue.button.active,.ui.inverted.blue.button:active,.ui.inverted.blue.button:focus,.ui.inverted.blue.button:hover,.ui.inverted.blue.buttons .button.active,.ui.inverted.blue.buttons .button:active,.ui.inverted.blue.buttons .button:focus,.ui.inverted.blue.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:#fff}.ui.inverted.blue.button:hover,.ui.inverted.blue.buttons .button:hover{background-color:#3ac0ff}.ui.inverted.blue.button:focus,.ui.inverted.blue.buttons .button:focus{background-color:#2bbbff}.ui.inverted.blue.active.button,.ui.inverted.blue.buttons .active.button{background-color:#3ac0ff}.ui.inverted.blue.button:active,.ui.inverted.blue.buttons .button:active{background-color:#21b8ff}.ui.inverted.blue.basic.button,.ui.inverted.blue.basic.buttons .button,.ui.inverted.blue.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.blue.basic.button:hover,.ui.inverted.blue.basic.buttons .button:hover,.ui.inverted.blue.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #3ac0ff inset!important;box-shadow:0 0 0 2px #3ac0ff inset!important;color:#54c8ff!important}.ui.inverted.blue.basic.button:focus,.ui.inverted.blue.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #2bbbff inset!important;box-shadow:0 0 0 2px #2bbbff inset!important;color:#54c8ff!important}.ui.inverted.blue.basic.active.button,.ui.inverted.blue.basic.buttons .active.button,.ui.inverted.blue.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #3ac0ff inset!important;box-shadow:0 0 0 2px #3ac0ff inset!important;color:#54c8ff!important}.ui.inverted.blue.basic.button:active,.ui.inverted.blue.basic.buttons .button:active,.ui.inverted.blue.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #21b8ff inset!important;box-shadow:0 0 0 2px #21b8ff inset!important;color:#54c8ff!important}.ui.green.button,.ui.green.buttons .button{background-color:#21ba45;color:#fff;text-shadow:none;background-image:none}.ui.green.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.green.button:hover,.ui.green.buttons .button:hover{background-color:#16ab39;color:#fff;text-shadow:none}.ui.green.button:focus,.ui.green.buttons .button:focus{background-color:#0ea432;color:#fff;text-shadow:none}.ui.green.button:active,.ui.green.buttons .button:active{background-color:#198f35;color:#fff;text-shadow:none}.ui.green.active.button,.ui.green.button .active.button:active,.ui.green.buttons .active.button,.ui.green.buttons .active.button:active{background-color:#13ae38;color:#fff;text-shadow:none}.ui.basic.green.button,.ui.basic.green.buttons .button{-webkit-box-shadow:0 0 0 1px #21ba45 inset!important;box-shadow:0 0 0 1px #21ba45 inset!important;color:#21ba45!important}.ui.basic.green.button:hover,.ui.basic.green.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #16ab39 inset!important;box-shadow:0 0 0 1px #16ab39 inset!important;color:#16ab39!important}.ui.basic.green.button:focus,.ui.basic.green.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #0ea432 inset!important;box-shadow:0 0 0 1px #0ea432 inset!important;color:#16ab39!important}.ui.basic.green.active.button,.ui.basic.green.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #13ae38 inset!important;box-shadow:0 0 0 1px #13ae38 inset!important;color:#198f35!important}.ui.basic.green.button:active,.ui.basic.green.buttons .button:active{-webkit-box-shadow:0 0 0 1px #198f35 inset!important;box-shadow:0 0 0 1px #198f35 inset!important;color:#198f35!important}.ui.buttons:not(.vertical)>.basic.green.button:not(:first-child){margin-left:-1px}.ui.inverted.green.button,.ui.inverted.green.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #2ecc40 inset!important;box-shadow:0 0 0 2px #2ecc40 inset!important;color:#2ecc40}.ui.inverted.green.button.active,.ui.inverted.green.button:active,.ui.inverted.green.button:focus,.ui.inverted.green.button:hover,.ui.inverted.green.buttons .button.active,.ui.inverted.green.buttons .button:active,.ui.inverted.green.buttons .button:focus,.ui.inverted.green.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:#fff}.ui.inverted.green.button:hover,.ui.inverted.green.buttons .button:hover{background-color:#22be34}.ui.inverted.green.button:focus,.ui.inverted.green.buttons .button:focus{background-color:#19b82b}.ui.inverted.green.active.button,.ui.inverted.green.buttons .active.button{background-color:#1fc231}.ui.inverted.green.button:active,.ui.inverted.green.buttons .button:active{background-color:#25a233}.ui.inverted.green.basic.button,.ui.inverted.green.basic.buttons .button,.ui.inverted.green.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.green.basic.button:hover,.ui.inverted.green.basic.buttons .button:hover,.ui.inverted.green.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #22be34 inset!important;box-shadow:0 0 0 2px #22be34 inset!important;color:#2ecc40!important}.ui.inverted.green.basic.button:focus,.ui.inverted.green.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #19b82b inset!important;box-shadow:0 0 0 2px #19b82b inset!important;color:#2ecc40!important}.ui.inverted.green.basic.active.button,.ui.inverted.green.basic.buttons .active.button,.ui.inverted.green.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #1fc231 inset!important;box-shadow:0 0 0 2px #1fc231 inset!important;color:#2ecc40!important}.ui.inverted.green.basic.button:active,.ui.inverted.green.basic.buttons .button:active,.ui.inverted.green.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #25a233 inset!important;box-shadow:0 0 0 2px #25a233 inset!important;color:#2ecc40!important}.ui.orange.button,.ui.orange.buttons .button{background-color:#f2711c;color:#fff;text-shadow:none;background-image:none}.ui.orange.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.orange.button:hover,.ui.orange.buttons .button:hover{background-color:#f26202;color:#fff;text-shadow:none}.ui.orange.button:focus,.ui.orange.buttons .button:focus{background-color:#e55b00;color:#fff;text-shadow:none}.ui.orange.button:active,.ui.orange.buttons .button:active{background-color:#cf590c;color:#fff;text-shadow:none}.ui.orange.active.button,.ui.orange.button .active.button:active,.ui.orange.buttons .active.button,.ui.orange.buttons .active.button:active{background-color:#f56100;color:#fff;text-shadow:none}.ui.basic.orange.button,.ui.basic.orange.buttons .button{-webkit-box-shadow:0 0 0 1px #f2711c inset!important;box-shadow:0 0 0 1px #f2711c inset!important;color:#f2711c!important}.ui.basic.orange.button:hover,.ui.basic.orange.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #f26202 inset!important;box-shadow:0 0 0 1px #f26202 inset!important;color:#f26202!important}.ui.basic.orange.button:focus,.ui.basic.orange.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #e55b00 inset!important;box-shadow:0 0 0 1px #e55b00 inset!important;color:#f26202!important}.ui.basic.orange.active.button,.ui.basic.orange.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #f56100 inset!important;box-shadow:0 0 0 1px #f56100 inset!important;color:#cf590c!important}.ui.basic.orange.button:active,.ui.basic.orange.buttons .button:active{-webkit-box-shadow:0 0 0 1px #cf590c inset!important;box-shadow:0 0 0 1px #cf590c inset!important;color:#cf590c!important}.ui.buttons:not(.vertical)>.basic.orange.button:not(:first-child){margin-left:-1px}.ui.inverted.orange.button,.ui.inverted.orange.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #ff851b inset!important;box-shadow:0 0 0 2px #ff851b inset!important;color:#ff851b}.ui.inverted.orange.button.active,.ui.inverted.orange.button:active,.ui.inverted.orange.button:focus,.ui.inverted.orange.button:hover,.ui.inverted.orange.buttons .button.active,.ui.inverted.orange.buttons .button:active,.ui.inverted.orange.buttons .button:focus,.ui.inverted.orange.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:#fff}.ui.inverted.orange.button:hover,.ui.inverted.orange.buttons .button:hover{background-color:#ff7701}.ui.inverted.orange.button:focus,.ui.inverted.orange.buttons .button:focus{background-color:#f17000}.ui.inverted.orange.active.button,.ui.inverted.orange.buttons .active.button{background-color:#ff7701}.ui.inverted.orange.button:active,.ui.inverted.orange.buttons .button:active{background-color:#e76b00}.ui.inverted.orange.basic.button,.ui.inverted.orange.basic.buttons .button,.ui.inverted.orange.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.orange.basic.button:hover,.ui.inverted.orange.basic.buttons .button:hover,.ui.inverted.orange.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #ff7701 inset!important;box-shadow:0 0 0 2px #ff7701 inset!important;color:#ff851b!important}.ui.inverted.orange.basic.button:focus,.ui.inverted.orange.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #f17000 inset!important;box-shadow:0 0 0 2px #f17000 inset!important;color:#ff851b!important}.ui.inverted.orange.basic.active.button,.ui.inverted.orange.basic.buttons .active.button,.ui.inverted.orange.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #ff7701 inset!important;box-shadow:0 0 0 2px #ff7701 inset!important;color:#ff851b!important}.ui.inverted.orange.basic.button:active,.ui.inverted.orange.basic.buttons .button:active,.ui.inverted.orange.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #e76b00 inset!important;box-shadow:0 0 0 2px #e76b00 inset!important;color:#ff851b!important}.ui.pink.button,.ui.pink.buttons .button{background-color:#e03997;color:#fff;text-shadow:none;background-image:none}.ui.pink.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.pink.button:hover,.ui.pink.buttons .button:hover{background-color:#e61a8d;color:#fff;text-shadow:none}.ui.pink.button:focus,.ui.pink.buttons .button:focus{background-color:#e10f85;color:#fff;text-shadow:none}.ui.pink.button:active,.ui.pink.buttons .button:active{background-color:#c71f7e;color:#fff;text-shadow:none}.ui.pink.active.button,.ui.pink.button .active.button:active,.ui.pink.buttons .active.button,.ui.pink.buttons .active.button:active{background-color:#ea158d;color:#fff;text-shadow:none}.ui.basic.pink.button,.ui.basic.pink.buttons .button{-webkit-box-shadow:0 0 0 1px #e03997 inset!important;box-shadow:0 0 0 1px #e03997 inset!important;color:#e03997!important}.ui.basic.pink.button:hover,.ui.basic.pink.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #e61a8d inset!important;box-shadow:0 0 0 1px #e61a8d inset!important;color:#e61a8d!important}.ui.basic.pink.button:focus,.ui.basic.pink.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #e10f85 inset!important;box-shadow:0 0 0 1px #e10f85 inset!important;color:#e61a8d!important}.ui.basic.pink.active.button,.ui.basic.pink.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #ea158d inset!important;box-shadow:0 0 0 1px #ea158d inset!important;color:#c71f7e!important}.ui.basic.pink.button:active,.ui.basic.pink.buttons .button:active{-webkit-box-shadow:0 0 0 1px #c71f7e inset!important;box-shadow:0 0 0 1px #c71f7e inset!important;color:#c71f7e!important}.ui.buttons:not(.vertical)>.basic.pink.button:not(:first-child){margin-left:-1px}.ui.inverted.pink.button,.ui.inverted.pink.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #ff8edf inset!important;box-shadow:0 0 0 2px #ff8edf inset!important;color:#ff8edf}.ui.inverted.pink.button.active,.ui.inverted.pink.button:active,.ui.inverted.pink.button:focus,.ui.inverted.pink.button:hover,.ui.inverted.pink.buttons .button.active,.ui.inverted.pink.buttons .button:active,.ui.inverted.pink.buttons .button:focus,.ui.inverted.pink.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:#fff}.ui.inverted.pink.button:hover,.ui.inverted.pink.buttons .button:hover{background-color:#ff74d8}.ui.inverted.pink.button:focus,.ui.inverted.pink.buttons .button:focus{background-color:#ff65d3}.ui.inverted.pink.active.button,.ui.inverted.pink.buttons .active.button{background-color:#ff74d8}.ui.inverted.pink.button:active,.ui.inverted.pink.buttons .button:active{background-color:#ff5bd1}.ui.inverted.pink.basic.button,.ui.inverted.pink.basic.buttons .button,.ui.inverted.pink.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.pink.basic.button:hover,.ui.inverted.pink.basic.buttons .button:hover,.ui.inverted.pink.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #ff74d8 inset!important;box-shadow:0 0 0 2px #ff74d8 inset!important;color:#ff8edf!important}.ui.inverted.pink.basic.button:focus,.ui.inverted.pink.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #ff65d3 inset!important;box-shadow:0 0 0 2px #ff65d3 inset!important;color:#ff8edf!important}.ui.inverted.pink.basic.active.button,.ui.inverted.pink.basic.buttons .active.button,.ui.inverted.pink.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #ff74d8 inset!important;box-shadow:0 0 0 2px #ff74d8 inset!important;color:#ff8edf!important}.ui.inverted.pink.basic.button:active,.ui.inverted.pink.basic.buttons .button:active,.ui.inverted.pink.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #ff5bd1 inset!important;box-shadow:0 0 0 2px #ff5bd1 inset!important;color:#ff8edf!important}.ui.violet.button,.ui.violet.buttons .button{background-color:#6435c9;color:#fff;text-shadow:none;background-image:none}.ui.violet.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.violet.button:hover,.ui.violet.buttons .button:hover{background-color:#5829bb;color:#fff;text-shadow:none}.ui.violet.button:focus,.ui.violet.buttons .button:focus{background-color:#4f20b5;color:#fff;text-shadow:none}.ui.violet.button:active,.ui.violet.buttons .button:active{background-color:#502aa1;color:#fff;text-shadow:none}.ui.violet.active.button,.ui.violet.button .active.button:active,.ui.violet.buttons .active.button,.ui.violet.buttons .active.button:active{background-color:#5626bf;color:#fff;text-shadow:none}.ui.basic.violet.button,.ui.basic.violet.buttons .button{-webkit-box-shadow:0 0 0 1px #6435c9 inset!important;box-shadow:0 0 0 1px #6435c9 inset!important;color:#6435c9!important}.ui.basic.violet.button:hover,.ui.basic.violet.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #5829bb inset!important;box-shadow:0 0 0 1px #5829bb inset!important;color:#5829bb!important}.ui.basic.violet.button:focus,.ui.basic.violet.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #4f20b5 inset!important;box-shadow:0 0 0 1px #4f20b5 inset!important;color:#5829bb!important}.ui.basic.violet.active.button,.ui.basic.violet.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #5626bf inset!important;box-shadow:0 0 0 1px #5626bf inset!important;color:#502aa1!important}.ui.basic.violet.button:active,.ui.basic.violet.buttons .button:active{-webkit-box-shadow:0 0 0 1px #502aa1 inset!important;box-shadow:0 0 0 1px #502aa1 inset!important;color:#502aa1!important}.ui.buttons:not(.vertical)>.basic.violet.button:not(:first-child){margin-left:-1px}.ui.inverted.violet.button,.ui.inverted.violet.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #a291fb inset!important;box-shadow:0 0 0 2px #a291fb inset!important;color:#a291fb}.ui.inverted.violet.button.active,.ui.inverted.violet.button:active,.ui.inverted.violet.button:focus,.ui.inverted.violet.button:hover,.ui.inverted.violet.buttons .button.active,.ui.inverted.violet.buttons .button:active,.ui.inverted.violet.buttons .button:focus,.ui.inverted.violet.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:#fff}.ui.inverted.violet.button:hover,.ui.inverted.violet.buttons .button:hover{background-color:#8a73ff}.ui.inverted.violet.button:focus,.ui.inverted.violet.buttons .button:focus{background-color:#7d64ff}.ui.inverted.violet.active.button,.ui.inverted.violet.buttons .active.button{background-color:#8a73ff}.ui.inverted.violet.button:active,.ui.inverted.violet.buttons .button:active{background-color:#7860f9}.ui.inverted.violet.basic.button,.ui.inverted.violet.basic.buttons .button,.ui.inverted.violet.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.violet.basic.button:hover,.ui.inverted.violet.basic.buttons .button:hover,.ui.inverted.violet.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #8a73ff inset!important;box-shadow:0 0 0 2px #8a73ff inset!important;color:#a291fb!important}.ui.inverted.violet.basic.button:focus,.ui.inverted.violet.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #7d64ff inset!important;box-shadow:0 0 0 2px #7d64ff inset!important;color:#a291fb!important}.ui.inverted.violet.basic.active.button,.ui.inverted.violet.basic.buttons .active.button,.ui.inverted.violet.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #8a73ff inset!important;box-shadow:0 0 0 2px #8a73ff inset!important;color:#a291fb!important}.ui.inverted.violet.basic.button:active,.ui.inverted.violet.basic.buttons .button:active,.ui.inverted.violet.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #7860f9 inset!important;box-shadow:0 0 0 2px #7860f9 inset!important;color:#a291fb!important}.ui.purple.button,.ui.purple.buttons .button{background-color:#a333c8;color:#fff;text-shadow:none;background-image:none}.ui.purple.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.purple.button:hover,.ui.purple.buttons .button:hover{background-color:#9627ba;color:#fff;text-shadow:none}.ui.purple.button:focus,.ui.purple.buttons .button:focus{background-color:#8f1eb4;color:#fff;text-shadow:none}.ui.purple.button:active,.ui.purple.buttons .button:active{background-color:#82299f;color:#fff;text-shadow:none}.ui.purple.active.button,.ui.purple.button .active.button:active,.ui.purple.buttons .active.button,.ui.purple.buttons .active.button:active{background-color:#9724be;color:#fff;text-shadow:none}.ui.basic.purple.button,.ui.basic.purple.buttons .button{-webkit-box-shadow:0 0 0 1px #a333c8 inset!important;box-shadow:0 0 0 1px #a333c8 inset!important;color:#a333c8!important}.ui.basic.purple.button:hover,.ui.basic.purple.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #9627ba inset!important;box-shadow:0 0 0 1px #9627ba inset!important;color:#9627ba!important}.ui.basic.purple.button:focus,.ui.basic.purple.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #8f1eb4 inset!important;box-shadow:0 0 0 1px #8f1eb4 inset!important;color:#9627ba!important}.ui.basic.purple.active.button,.ui.basic.purple.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #9724be inset!important;box-shadow:0 0 0 1px #9724be inset!important;color:#82299f!important}.ui.basic.purple.button:active,.ui.basic.purple.buttons .button:active{-webkit-box-shadow:0 0 0 1px #82299f inset!important;box-shadow:0 0 0 1px #82299f inset!important;color:#82299f!important}.ui.buttons:not(.vertical)>.basic.purple.button:not(:first-child){margin-left:-1px}.ui.inverted.purple.button,.ui.inverted.purple.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #dc73ff inset!important;box-shadow:0 0 0 2px #dc73ff inset!important;color:#dc73ff}.ui.inverted.purple.button.active,.ui.inverted.purple.button:active,.ui.inverted.purple.button:focus,.ui.inverted.purple.button:hover,.ui.inverted.purple.buttons .button.active,.ui.inverted.purple.buttons .button:active,.ui.inverted.purple.buttons .button:focus,.ui.inverted.purple.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:#fff}.ui.inverted.purple.button:hover,.ui.inverted.purple.buttons .button:hover{background-color:#d65aff}.ui.inverted.purple.button:focus,.ui.inverted.purple.buttons .button:focus{background-color:#d24aff}.ui.inverted.purple.active.button,.ui.inverted.purple.buttons .active.button{background-color:#d65aff}.ui.inverted.purple.button:active,.ui.inverted.purple.buttons .button:active{background-color:#cf40ff}.ui.inverted.purple.basic.button,.ui.inverted.purple.basic.buttons .button,.ui.inverted.purple.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.purple.basic.button:hover,.ui.inverted.purple.basic.buttons .button:hover,.ui.inverted.purple.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #d65aff inset!important;box-shadow:0 0 0 2px #d65aff inset!important;color:#dc73ff!important}.ui.inverted.purple.basic.button:focus,.ui.inverted.purple.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #d24aff inset!important;box-shadow:0 0 0 2px #d24aff inset!important;color:#dc73ff!important}.ui.inverted.purple.basic.active.button,.ui.inverted.purple.basic.buttons .active.button,.ui.inverted.purple.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #d65aff inset!important;box-shadow:0 0 0 2px #d65aff inset!important;color:#dc73ff!important}.ui.inverted.purple.basic.button:active,.ui.inverted.purple.basic.buttons .button:active,.ui.inverted.purple.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #cf40ff inset!important;box-shadow:0 0 0 2px #cf40ff inset!important;color:#dc73ff!important}.ui.red.button,.ui.red.buttons .button{background-color:#db2828;color:#fff;text-shadow:none;background-image:none}.ui.red.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.red.button:hover,.ui.red.buttons .button:hover{background-color:#d01919;color:#fff;text-shadow:none}.ui.red.button:focus,.ui.red.buttons .button:focus{background-color:#ca1010;color:#fff;text-shadow:none}.ui.red.button:active,.ui.red.buttons .button:active{background-color:#b21e1e;color:#fff;text-shadow:none}.ui.red.active.button,.ui.red.button .active.button:active,.ui.red.buttons .active.button,.ui.red.buttons .active.button:active{background-color:#d41515;color:#fff;text-shadow:none}.ui.basic.red.button,.ui.basic.red.buttons .button{-webkit-box-shadow:0 0 0 1px #db2828 inset!important;box-shadow:0 0 0 1px #db2828 inset!important;color:#db2828!important}.ui.basic.red.button:hover,.ui.basic.red.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #d01919 inset!important;box-shadow:0 0 0 1px #d01919 inset!important;color:#d01919!important}.ui.basic.red.button:focus,.ui.basic.red.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #ca1010 inset!important;box-shadow:0 0 0 1px #ca1010 inset!important;color:#d01919!important}.ui.basic.red.active.button,.ui.basic.red.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #d41515 inset!important;box-shadow:0 0 0 1px #d41515 inset!important;color:#b21e1e!important}.ui.basic.red.button:active,.ui.basic.red.buttons .button:active{-webkit-box-shadow:0 0 0 1px #b21e1e inset!important;box-shadow:0 0 0 1px #b21e1e inset!important;color:#b21e1e!important}.ui.buttons:not(.vertical)>.basic.red.button:not(:first-child){margin-left:-1px}.ui.inverted.red.button,.ui.inverted.red.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #ff695e inset!important;box-shadow:0 0 0 2px #ff695e inset!important;color:#ff695e}.ui.inverted.red.button.active,.ui.inverted.red.button:active,.ui.inverted.red.button:focus,.ui.inverted.red.button:hover,.ui.inverted.red.buttons .button.active,.ui.inverted.red.buttons .button:active,.ui.inverted.red.buttons .button:focus,.ui.inverted.red.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:#fff}.ui.inverted.red.button:hover,.ui.inverted.red.buttons .button:hover{background-color:#ff5144}.ui.inverted.red.button:focus,.ui.inverted.red.buttons .button:focus{background-color:#ff4335}.ui.inverted.red.active.button,.ui.inverted.red.buttons .active.button{background-color:#ff5144}.ui.inverted.red.button:active,.ui.inverted.red.buttons .button:active{background-color:#ff392b}.ui.inverted.red.basic.button,.ui.inverted.red.basic.buttons .button,.ui.inverted.red.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.red.basic.button:hover,.ui.inverted.red.basic.buttons .button:hover,.ui.inverted.red.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #ff5144 inset!important;box-shadow:0 0 0 2px #ff5144 inset!important;color:#ff695e!important}.ui.inverted.red.basic.button:focus,.ui.inverted.red.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #ff4335 inset!important;box-shadow:0 0 0 2px #ff4335 inset!important;color:#ff695e!important}.ui.inverted.red.basic.active.button,.ui.inverted.red.basic.buttons .active.button,.ui.inverted.red.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #ff5144 inset!important;box-shadow:0 0 0 2px #ff5144 inset!important;color:#ff695e!important}.ui.inverted.red.basic.button:active,.ui.inverted.red.basic.buttons .button:active,.ui.inverted.red.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #ff392b inset!important;box-shadow:0 0 0 2px #ff392b inset!important;color:#ff695e!important}.ui.teal.button,.ui.teal.buttons .button{background-color:#00b5ad;color:#fff;text-shadow:none;background-image:none}.ui.teal.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.teal.button:hover,.ui.teal.buttons .button:hover{background-color:#009c95;color:#fff;text-shadow:none}.ui.teal.button:focus,.ui.teal.buttons .button:focus{background-color:#008c86;color:#fff;text-shadow:none}.ui.teal.button:active,.ui.teal.buttons .button:active{background-color:#00827c;color:#fff;text-shadow:none}.ui.teal.active.button,.ui.teal.button .active.button:active,.ui.teal.buttons .active.button,.ui.teal.buttons .active.button:active{background-color:#009c95;color:#fff;text-shadow:none}.ui.basic.teal.button,.ui.basic.teal.buttons .button{-webkit-box-shadow:0 0 0 1px #00b5ad inset!important;box-shadow:0 0 0 1px #00b5ad inset!important;color:#00b5ad!important}.ui.basic.teal.button:hover,.ui.basic.teal.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #009c95 inset!important;box-shadow:0 0 0 1px #009c95 inset!important;color:#009c95!important}.ui.basic.teal.button:focus,.ui.basic.teal.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #008c86 inset!important;box-shadow:0 0 0 1px #008c86 inset!important;color:#009c95!important}.ui.basic.teal.active.button,.ui.basic.teal.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #009c95 inset!important;box-shadow:0 0 0 1px #009c95 inset!important;color:#00827c!important}.ui.basic.teal.button:active,.ui.basic.teal.buttons .button:active{-webkit-box-shadow:0 0 0 1px #00827c inset!important;box-shadow:0 0 0 1px #00827c inset!important;color:#00827c!important}.ui.buttons:not(.vertical)>.basic.teal.button:not(:first-child){margin-left:-1px}.ui.inverted.teal.button,.ui.inverted.teal.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #6dffff inset!important;box-shadow:0 0 0 2px #6dffff inset!important;color:#6dffff}.ui.inverted.teal.button.active,.ui.inverted.teal.button:active,.ui.inverted.teal.button:focus,.ui.inverted.teal.button:hover,.ui.inverted.teal.buttons .button.active,.ui.inverted.teal.buttons .button:active,.ui.inverted.teal.buttons .button:focus,.ui.inverted.teal.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:rgba(0,0,0,.6)}.ui.inverted.teal.button:hover,.ui.inverted.teal.buttons .button:hover{background-color:#54ffff}.ui.inverted.teal.button:focus,.ui.inverted.teal.buttons .button:focus{background-color:#4ff}.ui.inverted.teal.active.button,.ui.inverted.teal.buttons .active.button{background-color:#54ffff}.ui.inverted.teal.button:active,.ui.inverted.teal.buttons .button:active{background-color:#3affff}.ui.inverted.teal.basic.button,.ui.inverted.teal.basic.buttons .button,.ui.inverted.teal.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.teal.basic.button:hover,.ui.inverted.teal.basic.buttons .button:hover,.ui.inverted.teal.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #54ffff inset!important;box-shadow:0 0 0 2px #54ffff inset!important;color:#6dffff!important}.ui.inverted.teal.basic.button:focus,.ui.inverted.teal.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #4ff inset!important;box-shadow:0 0 0 2px #4ff inset!important;color:#6dffff!important}.ui.inverted.teal.basic.active.button,.ui.inverted.teal.basic.buttons .active.button,.ui.inverted.teal.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #54ffff inset!important;box-shadow:0 0 0 2px #54ffff inset!important;color:#6dffff!important}.ui.inverted.teal.basic.button:active,.ui.inverted.teal.basic.buttons .button:active,.ui.inverted.teal.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #3affff inset!important;box-shadow:0 0 0 2px #3affff inset!important;color:#6dffff!important}.ui.olive.button,.ui.olive.buttons .button{background-color:#b5cc18;color:#fff;text-shadow:none;background-image:none}.ui.olive.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.olive.button:hover,.ui.olive.buttons .button:hover{background-color:#a7bd0d;color:#fff;text-shadow:none}.ui.olive.button:focus,.ui.olive.buttons .button:focus{background-color:#a0b605;color:#fff;text-shadow:none}.ui.olive.button:active,.ui.olive.buttons .button:active{background-color:#8d9e13;color:#fff;text-shadow:none}.ui.olive.active.button,.ui.olive.button .active.button:active,.ui.olive.buttons .active.button,.ui.olive.buttons .active.button:active{background-color:#aac109;color:#fff;text-shadow:none}.ui.basic.olive.button,.ui.basic.olive.buttons .button{-webkit-box-shadow:0 0 0 1px #b5cc18 inset!important;box-shadow:0 0 0 1px #b5cc18 inset!important;color:#b5cc18!important}.ui.basic.olive.button:hover,.ui.basic.olive.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #a7bd0d inset!important;box-shadow:0 0 0 1px #a7bd0d inset!important;color:#a7bd0d!important}.ui.basic.olive.button:focus,.ui.basic.olive.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #a0b605 inset!important;box-shadow:0 0 0 1px #a0b605 inset!important;color:#a7bd0d!important}.ui.basic.olive.active.button,.ui.basic.olive.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #aac109 inset!important;box-shadow:0 0 0 1px #aac109 inset!important;color:#8d9e13!important}.ui.basic.olive.button:active,.ui.basic.olive.buttons .button:active{-webkit-box-shadow:0 0 0 1px #8d9e13 inset!important;box-shadow:0 0 0 1px #8d9e13 inset!important;color:#8d9e13!important}.ui.buttons:not(.vertical)>.basic.olive.button:not(:first-child){margin-left:-1px}.ui.inverted.olive.button,.ui.inverted.olive.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #d9e778 inset!important;box-shadow:0 0 0 2px #d9e778 inset!important;color:#d9e778}.ui.inverted.olive.button.active,.ui.inverted.olive.button:active,.ui.inverted.olive.button:focus,.ui.inverted.olive.button:hover,.ui.inverted.olive.buttons .button.active,.ui.inverted.olive.buttons .button:active,.ui.inverted.olive.buttons .button:focus,.ui.inverted.olive.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:rgba(0,0,0,.6)}.ui.inverted.olive.button:hover,.ui.inverted.olive.buttons .button:hover{background-color:#d8ea5c}.ui.inverted.olive.button:focus,.ui.inverted.olive.buttons .button:focus{background-color:#daef47}.ui.inverted.olive.active.button,.ui.inverted.olive.buttons .active.button{background-color:#daed59}.ui.inverted.olive.button:active,.ui.inverted.olive.buttons .button:active{background-color:#cddf4d}.ui.inverted.olive.basic.button,.ui.inverted.olive.basic.buttons .button,.ui.inverted.olive.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.olive.basic.button:hover,.ui.inverted.olive.basic.buttons .button:hover,.ui.inverted.olive.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #d8ea5c inset!important;box-shadow:0 0 0 2px #d8ea5c inset!important;color:#d9e778!important}.ui.inverted.olive.basic.button:focus,.ui.inverted.olive.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #daef47 inset!important;box-shadow:0 0 0 2px #daef47 inset!important;color:#d9e778!important}.ui.inverted.olive.basic.active.button,.ui.inverted.olive.basic.buttons .active.button,.ui.inverted.olive.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #daed59 inset!important;box-shadow:0 0 0 2px #daed59 inset!important;color:#d9e778!important}.ui.inverted.olive.basic.button:active,.ui.inverted.olive.basic.buttons .button:active,.ui.inverted.olive.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #cddf4d inset!important;box-shadow:0 0 0 2px #cddf4d inset!important;color:#d9e778!important}.ui.yellow.button,.ui.yellow.buttons .button{background-color:#fbbd08;color:#fff;text-shadow:none;background-image:none}.ui.yellow.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.yellow.button:hover,.ui.yellow.buttons .button:hover{background-color:#eaae00;color:#fff;text-shadow:none}.ui.yellow.button:focus,.ui.yellow.buttons .button:focus{background-color:#daa300;color:#fff;text-shadow:none}.ui.yellow.button:active,.ui.yellow.buttons .button:active{background-color:#cd9903;color:#fff;text-shadow:none}.ui.yellow.active.button,.ui.yellow.button .active.button:active,.ui.yellow.buttons .active.button,.ui.yellow.buttons .active.button:active{background-color:#eaae00;color:#fff;text-shadow:none}.ui.basic.yellow.button,.ui.basic.yellow.buttons .button{-webkit-box-shadow:0 0 0 1px #fbbd08 inset!important;box-shadow:0 0 0 1px #fbbd08 inset!important;color:#fbbd08!important}.ui.basic.yellow.button:hover,.ui.basic.yellow.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #eaae00 inset!important;box-shadow:0 0 0 1px #eaae00 inset!important;color:#eaae00!important}.ui.basic.yellow.button:focus,.ui.basic.yellow.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #daa300 inset!important;box-shadow:0 0 0 1px #daa300 inset!important;color:#eaae00!important}.ui.basic.yellow.active.button,.ui.basic.yellow.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #eaae00 inset!important;box-shadow:0 0 0 1px #eaae00 inset!important;color:#cd9903!important}.ui.basic.yellow.button:active,.ui.basic.yellow.buttons .button:active{-webkit-box-shadow:0 0 0 1px #cd9903 inset!important;box-shadow:0 0 0 1px #cd9903 inset!important;color:#cd9903!important}.ui.buttons:not(.vertical)>.basic.yellow.button:not(:first-child){margin-left:-1px}.ui.inverted.yellow.button,.ui.inverted.yellow.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #ffe21f inset!important;box-shadow:0 0 0 2px #ffe21f inset!important;color:#ffe21f}.ui.inverted.yellow.button.active,.ui.inverted.yellow.button:active,.ui.inverted.yellow.button:focus,.ui.inverted.yellow.button:hover,.ui.inverted.yellow.buttons .button.active,.ui.inverted.yellow.buttons .button:active,.ui.inverted.yellow.buttons .button:focus,.ui.inverted.yellow.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:rgba(0,0,0,.6)}.ui.inverted.yellow.button:hover,.ui.inverted.yellow.buttons .button:hover{background-color:#ffdf05}.ui.inverted.yellow.button:focus,.ui.inverted.yellow.buttons .button:focus{background-color:#f5d500}.ui.inverted.yellow.active.button,.ui.inverted.yellow.buttons .active.button{background-color:#ffdf05}.ui.inverted.yellow.button:active,.ui.inverted.yellow.buttons .button:active{background-color:#ebcd00}.ui.inverted.yellow.basic.button,.ui.inverted.yellow.basic.buttons .button,.ui.inverted.yellow.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.yellow.basic.button:hover,.ui.inverted.yellow.basic.buttons .button:hover,.ui.inverted.yellow.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #ffdf05 inset!important;box-shadow:0 0 0 2px #ffdf05 inset!important;color:#ffe21f!important}.ui.inverted.yellow.basic.button:focus,.ui.inverted.yellow.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #f5d500 inset!important;box-shadow:0 0 0 2px #f5d500 inset!important;color:#ffe21f!important}.ui.inverted.yellow.basic.active.button,.ui.inverted.yellow.basic.buttons .active.button,.ui.inverted.yellow.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #ffdf05 inset!important;box-shadow:0 0 0 2px #ffdf05 inset!important;color:#ffe21f!important}.ui.inverted.yellow.basic.button:active,.ui.inverted.yellow.basic.buttons .button:active,.ui.inverted.yellow.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #ebcd00 inset!important;box-shadow:0 0 0 2px #ebcd00 inset!important;color:#ffe21f!important}.ui.primary.button,.ui.primary.buttons .button{background-color:#2185d0;color:#fff;text-shadow:none;background-image:none}.ui.primary.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.primary.button:hover,.ui.primary.buttons .button:hover{background-color:#1678c2;color:#fff;text-shadow:none}.ui.primary.button:focus,.ui.primary.buttons .button:focus{background-color:#0d71bb;color:#fff;text-shadow:none}.ui.primary.button:active,.ui.primary.buttons .button:active{background-color:#1a69a4;color:#fff;text-shadow:none}.ui.primary.active.button,.ui.primary.button .active.button:active,.ui.primary.buttons .active.button,.ui.primary.buttons .active.button:active{background-color:#1279c6;color:#fff;text-shadow:none}.ui.basic.primary.button,.ui.basic.primary.buttons .button{-webkit-box-shadow:0 0 0 1px #2185d0 inset!important;box-shadow:0 0 0 1px #2185d0 inset!important;color:#2185d0!important}.ui.basic.primary.button:hover,.ui.basic.primary.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #1678c2 inset!important;box-shadow:0 0 0 1px #1678c2 inset!important;color:#1678c2!important}.ui.basic.primary.button:focus,.ui.basic.primary.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #0d71bb inset!important;box-shadow:0 0 0 1px #0d71bb inset!important;color:#1678c2!important}.ui.basic.primary.active.button,.ui.basic.primary.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #1279c6 inset!important;box-shadow:0 0 0 1px #1279c6 inset!important;color:#1a69a4!important}.ui.basic.primary.button:active,.ui.basic.primary.buttons .button:active{-webkit-box-shadow:0 0 0 1px #1a69a4 inset!important;box-shadow:0 0 0 1px #1a69a4 inset!important;color:#1a69a4!important}.ui.buttons:not(.vertical)>.basic.primary.button:not(:first-child){margin-left:-1px}.ui.inverted.primary.button,.ui.inverted.primary.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #54c8ff inset!important;box-shadow:0 0 0 2px #54c8ff inset!important;color:#54c8ff}.ui.inverted.primary.button.active,.ui.inverted.primary.button:active,.ui.inverted.primary.button:focus,.ui.inverted.primary.button:hover,.ui.inverted.primary.buttons .button.active,.ui.inverted.primary.buttons .button:active,.ui.inverted.primary.buttons .button:focus,.ui.inverted.primary.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:#fff}.ui.inverted.primary.button:hover,.ui.inverted.primary.buttons .button:hover{background-color:#3ac0ff}.ui.inverted.primary.button:focus,.ui.inverted.primary.buttons .button:focus{background-color:#2bbbff}.ui.inverted.primary.active.button,.ui.inverted.primary.buttons .active.button{background-color:#3ac0ff}.ui.inverted.primary.button:active,.ui.inverted.primary.buttons .button:active{background-color:#21b8ff}.ui.inverted.primary.basic.button,.ui.inverted.primary.basic.buttons .button,.ui.inverted.primary.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.primary.basic.button:hover,.ui.inverted.primary.basic.buttons .button:hover,.ui.inverted.primary.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #3ac0ff inset!important;box-shadow:0 0 0 2px #3ac0ff inset!important;color:#54c8ff!important}.ui.inverted.primary.basic.button:focus,.ui.inverted.primary.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #2bbbff inset!important;box-shadow:0 0 0 2px #2bbbff inset!important;color:#54c8ff!important}.ui.inverted.primary.basic.active.button,.ui.inverted.primary.basic.buttons .active.button,.ui.inverted.primary.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #3ac0ff inset!important;box-shadow:0 0 0 2px #3ac0ff inset!important;color:#54c8ff!important}.ui.inverted.primary.basic.button:active,.ui.inverted.primary.basic.buttons .button:active,.ui.inverted.primary.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #21b8ff inset!important;box-shadow:0 0 0 2px #21b8ff inset!important;color:#54c8ff!important}.ui.secondary.button,.ui.secondary.buttons .button{background-color:#1b1c1d;color:#fff;text-shadow:none;background-image:none}.ui.secondary.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.secondary.button:hover,.ui.secondary.buttons .button:hover{background-color:#27292a;color:#fff;text-shadow:none}.ui.secondary.button:focus,.ui.secondary.buttons .button:focus{background-color:#2e3032;color:#fff;text-shadow:none}.ui.secondary.button:active,.ui.secondary.buttons .button:active{background-color:#343637;color:#fff;text-shadow:none}.ui.secondary.active.button,.ui.secondary.button .active.button:active,.ui.secondary.buttons .active.button,.ui.secondary.buttons .active.button:active{background-color:#27292a;color:#fff;text-shadow:none}.ui.basic.secondary.button,.ui.basic.secondary.buttons .button{-webkit-box-shadow:0 0 0 1px #1b1c1d inset!important;box-shadow:0 0 0 1px #1b1c1d inset!important;color:#1b1c1d!important}.ui.basic.secondary.button:hover,.ui.basic.secondary.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #27292a inset!important;box-shadow:0 0 0 1px #27292a inset!important;color:#27292a!important}.ui.basic.secondary.button:focus,.ui.basic.secondary.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #2e3032 inset!important;box-shadow:0 0 0 1px #2e3032 inset!important;color:#27292a!important}.ui.basic.secondary.active.button,.ui.basic.secondary.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #27292a inset!important;box-shadow:0 0 0 1px #27292a inset!important;color:#343637!important}.ui.basic.secondary.button:active,.ui.basic.secondary.buttons .button:active{-webkit-box-shadow:0 0 0 1px #343637 inset!important;box-shadow:0 0 0 1px #343637 inset!important;color:#343637!important}.ui.buttons:not(.vertical)>.basic.primary.button:not(:first-child){margin-left:-1px}.ui.inverted.secondary.button,.ui.inverted.secondary.buttons .button{background-color:transparent;-webkit-box-shadow:0 0 0 2px #545454 inset!important;box-shadow:0 0 0 2px #545454 inset!important;color:#545454}.ui.inverted.secondary.button.active,.ui.inverted.secondary.button:active,.ui.inverted.secondary.button:focus,.ui.inverted.secondary.button:hover,.ui.inverted.secondary.buttons .button.active,.ui.inverted.secondary.buttons .button:active,.ui.inverted.secondary.buttons .button:focus,.ui.inverted.secondary.buttons .button:hover{-webkit-box-shadow:none!important;box-shadow:none!important;color:#fff}.ui.inverted.secondary.button:hover,.ui.inverted.secondary.buttons .button:hover{background-color:#616161}.ui.inverted.secondary.button:focus,.ui.inverted.secondary.buttons .button:focus{background-color:#686868}.ui.inverted.secondary.active.button,.ui.inverted.secondary.buttons .active.button{background-color:#616161}.ui.inverted.secondary.button:active,.ui.inverted.secondary.buttons .button:active{background-color:#6e6e6e}.ui.inverted.secondary.basic.button,.ui.inverted.secondary.basic.buttons .button,.ui.inverted.secondary.buttons .basic.button{background-color:transparent;-webkit-box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;box-shadow:0 0 0 2px rgba(255,255,255,.5) inset!important;color:#fff!important}.ui.inverted.secondary.basic.button:hover,.ui.inverted.secondary.basic.buttons .button:hover,.ui.inverted.secondary.buttons .basic.button:hover{-webkit-box-shadow:0 0 0 2px #616161 inset!important;box-shadow:0 0 0 2px #616161 inset!important;color:#545454!important}.ui.inverted.secondary.basic.button:focus,.ui.inverted.secondary.basic.buttons .button:focus{-webkit-box-shadow:0 0 0 2px #686868 inset!important;box-shadow:0 0 0 2px #686868 inset!important;color:#545454!important}.ui.inverted.secondary.basic.active.button,.ui.inverted.secondary.basic.buttons .active.button,.ui.inverted.secondary.buttons .basic.active.button{-webkit-box-shadow:0 0 0 2px #616161 inset!important;box-shadow:0 0 0 2px #616161 inset!important;color:#545454!important}.ui.inverted.secondary.basic.button:active,.ui.inverted.secondary.basic.buttons .button:active,.ui.inverted.secondary.buttons .basic.button:active{-webkit-box-shadow:0 0 0 2px #6e6e6e inset!important;box-shadow:0 0 0 2px #6e6e6e inset!important;color:#545454!important}.ui.positive.button,.ui.positive.buttons .button{background-color:#21ba45;color:#fff;text-shadow:none;background-image:none}.ui.positive.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.positive.button:hover,.ui.positive.buttons .button:hover{background-color:#16ab39;color:#fff;text-shadow:none}.ui.positive.button:focus,.ui.positive.buttons .button:focus{background-color:#0ea432;color:#fff;text-shadow:none}.ui.positive.button:active,.ui.positive.buttons .button:active{background-color:#198f35;color:#fff;text-shadow:none}.ui.positive.active.button,.ui.positive.button .active.button:active,.ui.positive.buttons .active.button,.ui.positive.buttons .active.button:active{background-color:#13ae38;color:#fff;text-shadow:none}.ui.basic.positive.button,.ui.basic.positive.buttons .button{-webkit-box-shadow:0 0 0 1px #21ba45 inset!important;box-shadow:0 0 0 1px #21ba45 inset!important;color:#21ba45!important}.ui.basic.positive.button:hover,.ui.basic.positive.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #16ab39 inset!important;box-shadow:0 0 0 1px #16ab39 inset!important;color:#16ab39!important}.ui.basic.positive.button:focus,.ui.basic.positive.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #0ea432 inset!important;box-shadow:0 0 0 1px #0ea432 inset!important;color:#16ab39!important}.ui.basic.positive.active.button,.ui.basic.positive.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #13ae38 inset!important;box-shadow:0 0 0 1px #13ae38 inset!important;color:#198f35!important}.ui.basic.positive.button:active,.ui.basic.positive.buttons .button:active{-webkit-box-shadow:0 0 0 1px #198f35 inset!important;box-shadow:0 0 0 1px #198f35 inset!important;color:#198f35!important}.ui.buttons:not(.vertical)>.basic.primary.button:not(:first-child){margin-left:-1px}.ui.negative.button,.ui.negative.buttons .button{background-color:#db2828;color:#fff;text-shadow:none;background-image:none}.ui.negative.button{-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 0 rgba(34,36,38,.15) inset}.ui.negative.button:hover,.ui.negative.buttons .button:hover{background-color:#d01919;color:#fff;text-shadow:none}.ui.negative.button:focus,.ui.negative.buttons .button:focus{background-color:#ca1010;color:#fff;text-shadow:none}.ui.negative.button:active,.ui.negative.buttons .button:active{background-color:#b21e1e;color:#fff;text-shadow:none}.ui.negative.active.button,.ui.negative.button .active.button:active,.ui.negative.buttons .active.button,.ui.negative.buttons .active.button:active{background-color:#d41515;color:#fff;text-shadow:none}.ui.basic.negative.button,.ui.basic.negative.buttons .button{-webkit-box-shadow:0 0 0 1px #db2828 inset!important;box-shadow:0 0 0 1px #db2828 inset!important;color:#db2828!important}.ui.basic.negative.button:hover,.ui.basic.negative.buttons .button:hover{background:0 0!important;-webkit-box-shadow:0 0 0 1px #d01919 inset!important;box-shadow:0 0 0 1px #d01919 inset!important;color:#d01919!important}.ui.basic.negative.button:focus,.ui.basic.negative.buttons .button:focus{background:0 0!important;-webkit-box-shadow:0 0 0 1px #ca1010 inset!important;box-shadow:0 0 0 1px #ca1010 inset!important;color:#d01919!important}.ui.basic.negative.active.button,.ui.basic.negative.buttons .active.button{background:0 0!important;-webkit-box-shadow:0 0 0 1px #d41515 inset!important;box-shadow:0 0 0 1px #d41515 inset!important;color:#b21e1e!important}.ui.basic.negative.button:active,.ui.basic.negative.buttons .button:active{-webkit-box-shadow:0 0 0 1px #b21e1e inset!important;box-shadow:0 0 0 1px #b21e1e inset!important;color:#b21e1e!important}.ui.buttons:not(.vertical)>.basic.primary.button:not(:first-child){margin-left:-1px}.ui.buttons{display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-orient:horizontal;-webkit-box-direction:normal;-ms-flex-direction:row;flex-direction:row;font-size:0;vertical-align:baseline;margin:0 .25em 0 0}.ui.buttons:not(.basic):not(.inverted){-webkit-box-shadow:none;box-shadow:none}.ui.buttons:after{content:".";display:block;height:0;clear:both;visibility:hidden}.ui.buttons .button{-webkit-box-flex:1;-ms-flex:1 0 auto;flex:1 0 auto;margin:0;border-radius:0;margin:0}.ui.buttons:not(.basic):not(.inverted)>.button,.ui.buttons>.ui.button:not(.basic):not(.inverted){-webkit-box-shadow:0 0 0 1px transparent inset,0 0 0 0 rgba(34,36,38,.15) inset;box-shadow:0 0 0 1px transparent inset,0 0 0 0 rgba(34,36,38,.15) inset}.ui.buttons .button:first-child{border-left:none;margin-left:0;border-top-left-radius:.28571429rem;border-bottom-left-radius:.28571429rem}.ui.buttons .button:last-child{border-top-right-radius:.28571429rem;border-bottom-right-radius:.28571429rem}.ui.vertical.buttons{display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column}.ui.vertical.buttons .button{display:block;float:none;width:100%;margin:0;-webkit-box-shadow:none;box-shadow:none;border-radius:0}.ui.vertical.buttons .button:first-child{border-top-left-radius:.28571429rem;border-top-right-radius:.28571429rem}.ui.vertical.buttons .button:last-child{margin-bottom:0;border-bottom-left-radius:.28571429rem;border-bottom-right-radius:.28571429rem}.ui.vertical.buttons .button:only-child{border-radius:.28571429rem}.ui.menu{display:-webkit-box;display:-ms-flexbox;display:flex;margin:1rem 0;font-family:Lato,'Helvetica Neue',Arial,Helvetica,sans-serif;background:#fff;font-weight:400;border:1px solid rgba(34,36,38,.15);-webkit-box-shadow:0 1px 2px 0 rgba(34,36,38,.15);box-shadow:0 1px 2px 0 rgba(34,36,38,.15);border-radius:.28571429rem;min-height:2.85714286em}.ui.menu:after{content:'';display:block;height:0;clear:both;visibility:hidden}.ui.menu:first-child{margin-top:0}.ui.menu:last-child{margin-bottom:0}.ui.menu .menu{margin:0}.ui.menu:not(.vertical)>.menu{display:-webkit-box;display:-ms-flexbox;display:flex}.ui.menu:not(.vertical) .item{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center}.ui.menu .item{position:relative;vertical-align:middle;line-height:1;text-decoration:none;-webkit-tap-highlight-color:transparent;-webkit-box-flex:0;-ms-flex:0 0 auto;flex:0 0 auto;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background:0 0;padding:.92857143em 1.14285714em;text-transform:none;color:rgba(0,0,0,.87);font-weight:400;-webkit-transition:background .1s ease,color .1s ease,-webkit-box-shadow .1s ease;transition:background .1s ease,color .1s ease,-webkit-box-shadow .1s ease;transition:background .1s ease,box-shadow .1s ease,color .1s ease;transition:background .1s ease,box-shadow .1s ease,color .1s ease,-webkit-box-shadow .1s ease}.ui.menu>.item:first-child{border-radius:.28571429rem 0 0 .28571429rem}.ui.menu .item:before{position:absolute;content:'';top:0;right:0;height:100%;width:1px;background:rgba(34,36,38,.1)}.ui.menu .item>a:not(.ui),.ui.menu .item>p:only-child,.ui.menu .text.item>*{-webkit-user-select:text;-moz-user-select:text;-ms-user-select:text;user-select:text;line-height:1.3}.ui.menu .item>p:first-child{margin-top:0}.ui.menu .item>p:last-child{margin-bottom:0}.ui.menu .item>i.icon{opacity:.9;float:none;margin:0 .35714286em 0 0}.ui.menu:not(.vertical) .item>.button{position:relative;top:0;margin:-.5em 0;padding-bottom:.78571429em;padding-top:.78571429em;font-size:1em}.ui.menu>.container,.ui.menu>.grid{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:inherit;-ms-flex-align:inherit;align-items:inherit;-webkit-box-orient:inherit;-webkit-box-direction:inherit;-ms-flex-direction:inherit;flex-direction:inherit}.ui.menu .item>.input{width:100%}.ui.menu:not(.vertical) .item>.input{position:relative;top:0;margin:-.5em 0}.ui.menu .item>.input input{font-size:1em;padding-top:.57142857em;padding-bottom:.57142857em}.ui.menu .header.item,.ui.vertical.menu .header.item{margin:0;background:'';text-transform:normal;font-weight:700}.ui.vertical.menu .item>.header:not(.ui){margin:0 0 .5em;font-size:1em;font-weight:700}.ui.menu .item>i.dropdown.icon{padding:0;float:right;margin:0 0 0 1em}.ui.menu .dropdown.item .menu{min-width:calc(100% - 1px);border-radius:0 0 .28571429rem .28571429rem;background:#fff;margin:0 0 0;-webkit-box-shadow:0 1px 3px 0 rgba(0,0,0,.08);box-shadow:0 1px 3px 0 rgba(0,0,0,.08);-webkit-box-orient:vertical!important;-webkit-box-direction:normal!important;-ms-flex-direction:column!important;flex-direction:column!important}.ui.menu .ui.dropdown .menu>.item{margin:0;text-align:left;font-size:1em!important;padding:.78571429em 1.14285714em!important;background:0 0!important;color:rgba(0,0,0,.87)!important;text-transform:none!important;font-weight:400!important;-webkit-box-shadow:none!important;box-shadow:none!important;-webkit-transition:none!important;transition:none!important}.ui.menu .ui.dropdown .menu>.item:hover{background:rgba(0,0,0,.05)!important;color:rgba(0,0,0,.95)!important}.ui.menu .ui.dropdown .menu>.selected.item{background:rgba(0,0,0,.05)!important;color:rgba(0,0,0,.95)!important}.ui.menu .ui.dropdown .menu>.active.item{background:rgba(0,0,0,.03)!important;font-weight:700!important;color:rgba(0,0,0,.95)!important}.ui.menu .ui.dropdown.item .menu .item:not(.filtered){display:block}.ui.menu .ui.dropdown .menu>.item .icon:not(.dropdown){display:inline-block;font-size:1em!important;float:none;margin:0 .75em 0 0!important}.ui.secondary.menu .dropdown.item>.menu,.ui.text.menu .dropdown.item>.menu{border-radius:.28571429rem;margin-top:.35714286em}.ui.menu .pointing.dropdown.item .menu{margin-top:.75em}.ui.inverted.menu .search.dropdown.item>.search,.ui.inverted.menu .search.dropdown.item>.text{color:rgba(255,255,255,.9)}.ui.vertical.menu .dropdown.item>.icon{float:right;content:"\f0da";margin-left:1em}.ui.vertical.menu .dropdown.item .menu{left:100%;min-width:0;margin:0;-webkit-box-shadow:0 1px 3px 0 rgba(0,0,0,.08);box-shadow:0 1px 3px 0 rgba(0,0,0,.08);border-radius:0 .28571429rem .28571429rem .28571429rem}.ui.vertical.menu .dropdown.item.upward .menu{bottom:0}.ui.vertical.menu .dropdown.item:not(.upward) .menu{top:0}.ui.vertical.menu .active.dropdown.item{border-top-right-radius:0;border-bottom-right-radius:0}.ui.vertical.menu .dropdown.active.item{-webkit-box-shadow:none;box-shadow:none}.ui.item.menu .dropdown .menu .item{width:100%}.ui.menu .item>.label{background:#999;color:#fff;margin-left:1em;padding:.3em .78571429em}.ui.vertical.menu .item>.label{background:#999;color:#fff;margin-top:-.15em;margin-bottom:-.15em;padding:.3em .78571429em}.ui.menu .item>.floating.label{padding:.3em .78571429em}.ui.menu .item>img:not(.ui){display:inline-block;vertical-align:middle;margin:-.3em 0;width:2.5em}.ui.vertical.menu .item>img:not(.ui):only-child{display:block;max-width:100%;width:auto}.ui.menu .list .item:before{background:0 0!important}.ui.vertical.sidebar.menu>.item:first-child:before{display:block!important}.ui.vertical.sidebar.menu>.item::before{top:auto;bottom:0}@media only screen and (max-width:767px){.ui.menu>.ui.container{width:100%!important;margin-left:0!important;margin-right:0!important}}@media only screen and (min-width:768px){.ui.menu:not(.secondary):not(.text):not(.tabular):not(.borderless)>.container>.item:not(.right):not(.borderless):first-child{border-left:1px solid rgba(34,36,38,.1)}}.ui.link.menu .item:hover,.ui.menu .dropdown.item:hover,.ui.menu .link.item:hover,.ui.menu a.item:hover{cursor:pointer;background:rgba(0,0,0,.03);color:rgba(0,0,0,.95)}.ui.link.menu .item:active,.ui.menu .link.item:active,.ui.menu a.item:active{background:rgba(0,0,0,.03);color:rgba(0,0,0,.95)}.ui.menu .active.item{background:rgba(0,0,0,.05);color:rgba(0,0,0,.95);font-weight:400;-webkit-box-shadow:none;box-shadow:none}.ui.menu .active.item>i.icon{opacity:1}.ui.menu .active.item:hover,.ui.vertical.menu .active.item:hover{background-color:rgba(0,0,0,.05);color:rgba(0,0,0,.95)}.ui.menu .item.disabled,.ui.menu .item.disabled:hover{cursor:default!important;background-color:transparent!important;color:rgba(40,40,40,.3)!important}.ui.menu:not(.vertical) .left.item,.ui.menu:not(.vertical) :not(.dropdown)>.left.menu{display:-webkit-box;display:-ms-flexbox;display:flex;margin-right:auto!important}.ui.menu:not(.vertical) .right.item,.ui.menu:not(.vertical) .right.menu{display:-webkit-box;display:-ms-flexbox;display:flex;margin-left:auto!important}.ui.menu .right.item::before,.ui.menu .right.menu>.item::before{right:auto;left:0}.ui.vertical.menu{display:block;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;background:#fff;-webkit-box-shadow:0 1px 2px 0 rgba(34,36,38,.15);box-shadow:0 1px 2px 0 rgba(34,36,38,.15)}.ui.vertical.menu .item{display:block;background:0 0;border-top:none;border-right:none}.ui.vertical.menu>.item:first-child{border-radius:.28571429rem .28571429rem 0 0}.ui.vertical.menu>.item:last-child{border-radius:0 0 .28571429rem .28571429rem}.ui.vertical.menu .item>.label{float:right;text-align:center}.ui.vertical.menu .item>i.icon{width:1.18em;float:right;margin:0 0 0 .5em}.ui.vertical.menu .item>.label+i.icon{float:none;margin:0 .5em 0 0}.ui.vertical.menu .item:before{position:absolute;content:'';top:0;left:0;width:100%;height:1px;background:rgba(34,36,38,.1)}.ui.vertical.menu .item:first-child:before{display:none!important}.ui.vertical.menu .item>.menu{margin:.5em -1.14285714em 0}.ui.vertical.menu .menu .item{background:0 0;padding:.5em 1.33333333em;font-size:.85714286em;color:rgba(0,0,0,.5)}.ui.vertical.menu .item .menu .link.item:hover,.ui.vertical.menu .item .menu a.item:hover{color:rgba(0,0,0,.85)}.ui.vertical.menu .menu .item:before{display:none}.ui.vertical.menu .active.item{background:rgba(0,0,0,.05);border-radius:0;-webkit-box-shadow:none;box-shadow:none}.ui.vertical.menu>.active.item:first-child{border-radius:.28571429rem .28571429rem 0 0}.ui.vertical.menu>.active.item:last-child{border-radius:0 0 .28571429rem .28571429rem}.ui.vertical.menu>.active.item:only-child{border-radius:.28571429rem}.ui.vertical.menu .active.item .menu .active.item{border-left:none}.ui.vertical.menu .item .menu .active.item{background-color:transparent;font-weight:700;color:rgba(0,0,0,.95)}.ui.tabular.menu{border-radius:0;-webkit-box-shadow:none!important;box-shadow:none!important;border:none;background:none transparent;border-bottom:1px solid #d4d4d5}.ui.tabular.fluid.menu{width:calc(100% + (1px * 2))!important}.ui.tabular.menu .item{background:0 0;border-bottom:none;border-left:1px solid transparent;border-right:1px solid transparent;border-top:2px solid transparent;padding:.92857143em 1.42857143em;color:rgba(0,0,0,.87)}.ui.tabular.menu .item:before{display:none}.ui.tabular.menu .item:hover{background-color:transparent;color:rgba(0,0,0,.8)}.ui.tabular.menu .active.item{background:none #fff;color:rgba(0,0,0,.95);border-top-width:1px;border-color:#d4d4d5;font-weight:700;margin-bottom:-1px;-webkit-box-shadow:none;box-shadow:none;border-radius:.28571429rem .28571429rem 0 0!important}.ui.tabular.menu+.attached:not(.top).segment,.ui.tabular.menu+.attached:not(.top).segment+.attached:not(.top).segment{border-top:none;margin-left:0;margin-top:0;margin-right:0;width:100%}.top.attached.segment+.ui.bottom.tabular.menu{position:relative;width:calc(100% + (1px * 2));left:-1px}.ui.bottom.tabular.menu{background:none transparent;border-radius:0;-webkit-box-shadow:none!important;box-shadow:none!important;border-bottom:none;border-top:1px solid #d4d4d5}.ui.bottom.tabular.menu .item{background:0 0;border-left:1px solid transparent;border-right:1px solid transparent;border-bottom:1px solid transparent;border-top:none}.ui.bottom.tabular.menu .active.item{background:none #fff;color:rgba(0,0,0,.95);border-color:#d4d4d5;margin:-1px 0 0 0;border-radius:0 0 .28571429rem .28571429rem!important}.ui.vertical.tabular.menu{background:none transparent;border-radius:0;-webkit-box-shadow:none!important;box-shadow:none!important;border-bottom:none;border-right:1px solid #d4d4d5}.ui.vertical.tabular.menu .item{background:0 0;border-left:1px solid transparent;border-bottom:1px solid transparent;border-top:1px solid transparent;border-right:none}.ui.vertical.tabular.menu .active.item{background:none #fff;color:rgba(0,0,0,.95);border-color:#d4d4d5;margin:0 -1px 0 0;border-radius:.28571429rem 0 0 .28571429rem!important}.ui.vertical.right.tabular.menu{background:none transparent;border-radius:0;-webkit-box-shadow:none!important;box-shadow:none!important;border-bottom:none;border-right:none;border-left:1px solid #d4d4d5}.ui.vertical.right.tabular.menu .item{background:0 0;border-right:1px solid transparent;border-bottom:1px solid transparent;border-top:1px solid transparent;border-left:none}.ui.vertical.right.tabular.menu .active.item{background:none #fff;color:rgba(0,0,0,.95);border-color:#d4d4d5;margin:0 0 0 -1px;border-radius:0 .28571429rem .28571429rem 0!important}.ui.tabular.menu .active.dropdown.item{margin-bottom:0;border-left:1px solid transparent;border-right:1px solid transparent;border-top:2px solid transparent;border-bottom:none}.ui.pagination.menu{margin:0;display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;vertical-align:middle}.ui.pagination.menu .item:last-child{border-radius:0 .28571429rem .28571429rem 0}.ui.compact.menu .item:last-child{border-radius:0 .28571429rem .28571429rem 0}.ui.pagination.menu .item:last-child:before{display:none}.ui.pagination.menu .item{min-width:3em;text-align:center}.ui.pagination.menu .icon.item i.icon{vertical-align:top}.ui.pagination.menu .active.item{border-top:none;padding-top:.92857143em;background-color:rgba(0,0,0,.05);color:rgba(0,0,0,.95);-webkit-box-shadow:none;box-shadow:none}.ui.secondary.menu{background:0 0;margin-left:-.35714286em;margin-right:-.35714286em;border-radius:0;border:none;-webkit-box-shadow:none;box-shadow:none}.ui.secondary.menu .item{-ms-flex-item-align:center;align-self:center;-webkit-box-shadow:none;box-shadow:none;border:none;padding:.78571429em .92857143em;margin:0 .35714286em;background:0 0;-webkit-transition:color .1s ease;transition:color .1s ease;border-radius:.28571429rem}.ui.secondary.menu .item:before{display:none!important}.ui.secondary.menu .header.item{border-radius:0;border-right:none;background:none transparent}.ui.secondary.menu .item>img:not(.ui){margin:0}.ui.secondary.menu .dropdown.item:hover,.ui.secondary.menu .link.item:hover,.ui.secondary.menu a.item:hover{background:rgba(0,0,0,.05);color:rgba(0,0,0,.95)}.ui.secondary.menu .active.item{-webkit-box-shadow:none;box-shadow:none;background:rgba(0,0,0,.05);color:rgba(0,0,0,.95);border-radius:.28571429rem}.ui.secondary.menu .active.item:hover{-webkit-box-shadow:none;box-shadow:none;background:rgba(0,0,0,.05);color:rgba(0,0,0,.95)}.ui.secondary.inverted.menu .link.item,.ui.secondary.inverted.menu a.item{color:rgba(255,255,255,.7)!important}.ui.secondary.inverted.menu .dropdown.item:hover,.ui.secondary.inverted.menu .link.item:hover,.ui.secondary.inverted.menu a.item:hover{background:rgba(255,255,255,.08);color:#fff!important}.ui.secondary.inverted.menu .active.item{background:rgba(255,255,255,.15);color:#fff!important}.ui.secondary.item.menu{margin-left:0;margin-right:0}.ui.secondary.item.menu .item:last-child{margin-right:0}.ui.secondary.attached.menu{-webkit-box-shadow:none;box-shadow:none}.ui.vertical.secondary.menu .item:not(.dropdown)>.menu{margin:0 -.92857143em}.ui.vertical.secondary.menu .item:not(.dropdown)>.menu>.item{margin:0;padding:.5em 1.33333333em}.ui.secondary.vertical.menu>.item{border:none;margin:0 0 .35714286em;border-radius:.28571429rem!important}.ui.secondary.vertical.menu>.header.item{border-radius:0}.ui.vertical.secondary.menu .item>.menu .item{background-color:transparent}.ui.secondary.inverted.menu{background-color:transparent}.ui.secondary.pointing.menu{margin-left:0;margin-right:0;border-bottom:2px solid rgba(34,36,38,.15)}.ui.secondary.pointing.menu .item{border-bottom-color:transparent;border-bottom-style:solid;border-radius:0;-ms-flex-item-align:end;align-self:flex-end;margin:0 0 -2px;padding:.85714286em 1.14285714em;border-bottom-width:2px;-webkit-transition:color .1s ease;transition:color .1s ease}.ui.secondary.pointing.menu .header.item{color:rgba(0,0,0,.85)!important}.ui.secondary.pointing.menu .text.item{-webkit-box-shadow:none!important;box-shadow:none!important}.ui.secondary.pointing.menu .item:after{display:none}.ui.secondary.pointing.menu .dropdown.item:hover,.ui.secondary.pointing.menu .link.item:hover,.ui.secondary.pointing.menu a.item:hover{background-color:transparent;color:rgba(0,0,0,.87)}.ui.secondary.pointing.menu .dropdown.item:active,.ui.secondary.pointing.menu .link.item:active,.ui.secondary.pointing.menu a.item:active{background-color:transparent;border-color:rgba(34,36,38,.15)}.ui.secondary.pointing.menu .active.item{background-color:transparent;-webkit-box-shadow:none;box-shadow:none;border-color:#1b1c1d;font-weight:700;color:rgba(0,0,0,.95)}.ui.secondary.pointing.menu .active.item:hover{border-color:#1b1c1d;color:rgba(0,0,0,.95)}.ui.secondary.pointing.menu .active.dropdown.item{border-color:transparent}.ui.secondary.vertical.pointing.menu{border-bottom-width:0;border-right-width:2px;border-right-style:solid;border-right-color:rgba(34,36,38,.15)}.ui.secondary.vertical.pointing.menu .item{border-bottom:none;border-right-style:solid;border-right-color:transparent;border-radius:0!important;margin:0 -2px 0 0;border-right-width:2px}.ui.secondary.vertical.pointing.menu .active.item{border-color:#1b1c1d}.ui.secondary.inverted.pointing.menu{border-color:rgba(255,255,255,.1)}.ui.secondary.inverted.pointing.menu{border-width:2px;border-color:rgba(34,36,38,.15)}.ui.secondary.inverted.pointing.menu .item{color:rgba(255,255,255,.9)}.ui.secondary.inverted.pointing.menu .header.item{color:#fff!important}.ui.secondary.inverted.pointing.menu .link.item:hover,.ui.secondary.inverted.pointing.menu a.item:hover{color:rgba(0,0,0,.95)}.ui.secondary.inverted.pointing.menu .active.item{border-color:#fff;color:#fff}.ui.text.menu{background:none transparent;border-radius:0;-webkit-box-shadow:none;box-shadow:none;border:none;margin:1em -.5em}.ui.text.menu .item{border-radius:0;-webkit-box-shadow:none;box-shadow:none;-ms-flex-item-align:center;align-self:center;margin:0 0;padding:.35714286em .5em;font-weight:400;color:rgba(0,0,0,.6);-webkit-transition:opacity .1s ease;transition:opacity .1s ease}.ui.text.menu .item:before,.ui.text.menu .menu .item:before{display:none!important}.ui.text.menu .header.item{background-color:transparent;opacity:1;color:rgba(0,0,0,.85);font-size:.92857143em;text-transform:uppercase;font-weight:700}.ui.text.menu .item>img:not(.ui){margin:0}.ui.text.item.menu .item{margin:0}.ui.vertical.text.menu{margin:1em 0}.ui.vertical.text.menu:first-child{margin-top:0}.ui.vertical.text.menu:last-child{margin-bottom:0}.ui.vertical.text.menu .item{margin:.57142857em 0;padding-left:0;padding-right:0}.ui.vertical.text.menu .item>i.icon{float:none;margin:0 .35714286em 0 0}.ui.vertical.text.menu .header.item{margin:.57142857em 0 .71428571em}.ui.vertical.text.menu .item:not(.dropdown)>.menu{margin:0}.ui.vertical.text.menu .item:not(.dropdown)>.menu>.item{margin:0;padding:.5em 0}.ui.text.menu .item:hover{opacity:1;background-color:transparent}.ui.text.menu .active.item{background-color:transparent;border:none;-webkit-box-shadow:none;box-shadow:none;font-weight:400;color:rgba(0,0,0,.95)}.ui.text.menu .active.item:hover{background-color:transparent}.ui.text.pointing.menu .active.item:after{-webkit-box-shadow:none;box-shadow:none}.ui.text.attached.menu{-webkit-box-shadow:none;box-shadow:none}.ui.inverted.text.menu,.ui.inverted.text.menu .active.item,.ui.inverted.text.menu .item,.ui.inverted.text.menu .item:hover{background-color:transparent!important}.ui.fluid.text.menu{margin-left:0;margin-right:0}.ui.vertical.icon.menu{display:inline-block;width:auto}.ui.icon.menu .item{height:auto;text-align:center;color:#1b1c1d}.ui.icon.menu .item>.icon:not(.dropdown){margin:0;opacity:1}.ui.icon.menu .icon:before{opacity:1}.ui.menu .icon.item>.icon{width:auto;margin:0 auto}.ui.vertical.icon.menu .item>.icon:not(.dropdown){display:block;opacity:1;margin:0 auto;float:none}.ui.inverted.icon.menu .item{color:#fff}.ui.labeled.icon.menu{text-align:center}.ui.labeled.icon.menu .item{min-width:6em;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column}.ui.labeled.icon.menu .item>.icon:not(.dropdown){height:1em;display:block;font-size:1.71428571em!important;margin:0 auto .5rem!important}.ui.fluid.labeled.icon.menu>.item{min-width:0}@media only screen and (max-width:767px){.ui.stackable.menu{-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column}.ui.stackable.menu .item{width:100%!important}.ui.stackable.menu .item:before{position:absolute;content:'';top:auto;bottom:0;left:0;width:100%;height:1px;background:rgba(34,36,38,.1)}.ui.stackable.menu .left.item,.ui.stackable.menu .left.menu{margin-right:0!important}.ui.stackable.menu .right.item,.ui.stackable.menu .right.menu{margin-left:0!important}.ui.stackable.menu .left.menu,.ui.stackable.menu .right.menu{-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column}}.ui.menu .red.active.item,.ui.red.menu .active.item{border-color:#db2828!important;color:#db2828!important}.ui.menu .orange.active.item,.ui.orange.menu .active.item{border-color:#f2711c!important;color:#f2711c!important}.ui.menu .yellow.active.item,.ui.yellow.menu .active.item{border-color:#fbbd08!important;color:#fbbd08!important}.ui.menu .olive.active.item,.ui.olive.menu .active.item{border-color:#b5cc18!important;color:#b5cc18!important}.ui.green.menu .active.item,.ui.menu .green.active.item{border-color:#21ba45!important;color:#21ba45!important}.ui.menu .teal.active.item,.ui.teal.menu .active.item{border-color:#00b5ad!important;color:#00b5ad!important}.ui.blue.menu .active.item,.ui.menu .blue.active.item{border-color:#2185d0!important;color:#2185d0!important}.ui.menu .violet.active.item,.ui.violet.menu .active.item{border-color:#6435c9!important;color:#6435c9!important}.ui.menu .purple.active.item,.ui.purple.menu .active.item{border-color:#a333c8!important;color:#a333c8!important}.ui.menu .pink.active.item,.ui.pink.menu .active.item{border-color:#e03997!important;color:#e03997!important}.ui.brown.menu .active.item,.ui.menu .brown.active.item{border-color:#a5673f!important;color:#a5673f!important}.ui.grey.menu .active.item,.ui.menu .grey.active.item{border-color:#767676!important;color:#767676!important}.ui.inverted.menu{border:0 solid transparent;background:#1b1c1d;-webkit-box-shadow:none;box-shadow:none}.ui.inverted.menu .item,.ui.inverted.menu .item>a:not(.ui){background:0 0;color:rgba(255,255,255,.9)}.ui.inverted.menu .item.menu{background:0 0}.ui.inverted.menu .item:before{background:rgba(255,255,255,.08)}.ui.vertical.inverted.menu .item:before{background:rgba(255,255,255,.08)}.ui.vertical.inverted.menu .menu .item,.ui.vertical.inverted.menu .menu .item a:not(.ui){color:rgba(255,255,255,.5)}.ui.inverted.menu .header.item{margin:0;background:0 0;-webkit-box-shadow:none;box-shadow:none}.ui.inverted.menu .item.disabled,.ui.inverted.menu .item.disabled:hover{color:rgba(225,225,225,.3)}.ui.inverted.menu .dropdown.item:hover,.ui.inverted.menu .link.item:hover,.ui.inverted.menu a.item:hover,.ui.link.inverted.menu .item:hover{background:rgba(255,255,255,.08);color:#fff}.ui.vertical.inverted.menu .item .menu .link.item:hover,.ui.vertical.inverted.menu .item .menu a.item:hover{background:0 0;color:#fff}.ui.inverted.menu .link.item:active,.ui.inverted.menu a.item:active{background:rgba(255,255,255,.08);color:#fff}.ui.inverted.menu .active.item{background:rgba(255,255,255,.15);color:#fff!important}.ui.inverted.vertical.menu .item .menu .active.item{background:0 0;color:#fff}.ui.inverted.pointing.menu .active.item:after{background:#3d3e3f!important;margin:0!important;-webkit-box-shadow:none!important;box-shadow:none!important;border:none!important}.ui.inverted.menu .active.item:hover{background:rgba(255,255,255,.15);color:#fff!important}.ui.inverted.pointing.menu .active.item:hover:after{background:#3d3e3f!important}.ui.floated.menu{float:left;margin:0 .5rem 0 0}.ui.floated.menu .item:last-child:before{display:none}.ui.right.floated.menu{float:right;margin:0 0 0 .5rem}.ui.inverted.menu .red.active.item,.ui.inverted.red.menu{background-color:#db2828}.ui.inverted.red.menu .item:before{background-color:rgba(34,36,38,.1)}.ui.inverted.red.menu .active.item{background-color:rgba(0,0,0,.1)!important}.ui.inverted.menu .orange.active.item,.ui.inverted.orange.menu{background-color:#f2711c}.ui.inverted.orange.menu .item:before{background-color:rgba(34,36,38,.1)}.ui.inverted.orange.menu .active.item{background-color:rgba(0,0,0,.1)!important}.ui.inverted.menu .yellow.active.item,.ui.inverted.yellow.menu{background-color:#fbbd08}.ui.inverted.yellow.menu .item:before{background-color:rgba(34,36,38,.1)}.ui.inverted.yellow.menu .active.item{background-color:rgba(0,0,0,.1)!important}.ui.inverted.menu .olive.active.item,.ui.inverted.olive.menu{background-color:#b5cc18}.ui.inverted.olive.menu .item:before{background-color:rgba(34,36,38,.1)}.ui.inverted.olive.menu .active.item{background-color:rgba(0,0,0,.1)!important}.ui.inverted.green.menu,.ui.inverted.menu .green.active.item{background-color:#21ba45}.ui.inverted.green.menu .item:before{background-color:rgba(34,36,38,.1)}.ui.inverted.green.menu .active.item{background-color:rgba(0,0,0,.1)!important}.ui.inverted.menu .teal.active.item,.ui.inverted.teal.menu{background-color:#00b5ad}.ui.inverted.teal.menu .item:before{background-color:rgba(34,36,38,.1)}.ui.inverted.teal.menu .active.item{background-color:rgba(0,0,0,.1)!important}.ui.inverted.blue.menu,.ui.inverted.menu .blue.active.item{background-color:#2185d0}.ui.inverted.blue.menu .item:before{background-color:rgba(34,36,38,.1)}.ui.inverted.blue.menu .active.item{background-color:rgba(0,0,0,.1)!important}.ui.inverted.menu .violet.active.item,.ui.inverted.violet.menu{background-color:#6435c9}.ui.inverted.violet.menu .item:before{background-color:rgba(34,36,38,.1)}.ui.inverted.violet.menu .active.item{background-color:rgba(0,0,0,.1)!important}.ui.inverted.menu .purple.active.item,.ui.inverted.purple.menu{background-color:#a333c8}.ui.inverted.purple.menu .item:before{background-color:rgba(34,36,38,.1)}.ui.inverted.purple.menu .active.item{background-color:rgba(0,0,0,.1)!important}.ui.inverted.menu .pink.active.item,.ui.inverted.pink.menu{background-color:#e03997}.ui.inverted.pink.menu .item:before{background-color:rgba(34,36,38,.1)}.ui.inverted.pink.menu .active.item{background-color:rgba(0,0,0,.1)!important}.ui.inverted.brown.menu,.ui.inverted.menu .brown.active.item{background-color:#a5673f}.ui.inverted.brown.menu .item:before{background-color:rgba(34,36,38,.1)}.ui.inverted.brown.menu .active.item{background-color:rgba(0,0,0,.1)!important}.ui.inverted.grey.menu,.ui.inverted.menu .grey.active.item{background-color:#767676}.ui.inverted.grey.menu .item:before{background-color:rgba(34,36,38,.1)}.ui.inverted.grey.menu .active.item{background-color:rgba(0,0,0,.1)!important}.ui.fitted.menu .item,.ui.fitted.menu .item .menu .item,.ui.menu .fitted.item{padding:0}.ui.horizontally.fitted.menu .item,.ui.horizontally.fitted.menu .item .menu .item,.ui.menu .horizontally.fitted.item{padding-top:.92857143em;padding-bottom:.92857143em}.ui.menu .vertically.fitted.item,.ui.vertically.fitted.menu .item,.ui.vertically.fitted.menu .item .menu .item{padding-left:1.14285714em;padding-right:1.14285714em}.ui.borderless.menu .item .menu .item:before,.ui.borderless.menu .item:before,.ui.menu .borderless.item:before{background:0 0!important}.ui.compact.menu{display:-webkit-inline-box;display:-ms-inline-flexbox;display:inline-flex;margin:0;vertical-align:middle}.ui.compact.vertical.menu{display:inline-block}.ui.compact.menu .item:last-child{border-radius:0 .28571429rem .28571429rem 0}.ui.compact.menu .item:last-child:before{display:none}.ui.compact.vertical.menu{width:auto!important}.ui.compact.vertical.menu .item:last-child::before{display:block}.ui.menu.fluid,.ui.vertical.menu.fluid{width:100%!important}.ui.item.menu,.ui.item.menu .item{width:100%;padding-left:0!important;padding-right:0!important;margin-left:0!important;margin-right:0!important;text-align:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center}.ui.attached.item.menu{margin:0 -1px!important}.ui.item.menu .item:last-child:before{display:none}.ui.menu.two.item .item{width:50%}.ui.menu.three.item .item{width:33.333%}.ui.menu.four.item .item{width:25%}.ui.menu.five.item .item{width:20%}.ui.menu.six.item .item{width:16.666%}.ui.menu.seven.item .item{width:14.285%}.ui.menu.eight.item .item{width:12.5%}.ui.menu.nine.item .item{width:11.11%}.ui.menu.ten.item .item{width:10%}.ui.menu.eleven.item .item{width:9.09%}.ui.menu.twelve.item .item{width:8.333%}.ui.menu.fixed{position:fixed;z-index:101;margin:0;width:100%}.ui.menu.fixed,.ui.menu.fixed .item:first-child,.ui.menu.fixed .item:last-child{border-radius:0!important}.ui.fixed.menu,.ui[class*="top fixed"].menu{top:0;left:0;right:auto;bottom:auto}.ui[class*="top fixed"].menu{border-top:none;border-left:none;border-right:none}.ui[class*="right fixed"].menu{border-top:none;border-bottom:none;border-right:none;top:0;right:0;left:auto;bottom:auto;width:auto;height:100%}.ui[class*="bottom fixed"].menu{border-bottom:none;border-left:none;border-right:none;bottom:0;left:0;top:auto;right:auto}.ui[class*="left fixed"].menu{border-top:none;border-bottom:none;border-left:none;top:0;left:0;right:auto;bottom:auto;width:auto;height:100%}.ui.fixed.menu+.ui.grid{padding-top:2.75rem}.ui.pointing.menu .item:after{visibility:hidden;position:absolute;content:'';top:100%;left:50%;-webkit-transform:translateX(-50%) translateY(-50%) rotate(45deg);transform:translateX(-50%) translateY(-50%) rotate(45deg);background:0 0;margin:.5px 0 0;width:.57142857em;height:.57142857em;border:none;border-bottom:1px solid #d4d4d5;border-right:1px solid #d4d4d5;z-index:2;-webkit-transition:background .1s ease;transition:background .1s ease}.ui.vertical.pointing.menu .item:after{position:absolute;top:50%;right:0;bottom:auto;left:auto;-webkit-transform:translateX(50%) translateY(-50%) rotate(45deg);transform:translateX(50%) translateY(-50%) rotate(45deg);margin:0 -.5px 0 0;border:none;border-top:1px solid #d4d4d5;border-right:1px solid #d4d4d5}.ui.pointing.menu .active.item:after{visibility:visible}.ui.pointing.menu .active.dropdown.item:after{visibility:hidden}.ui.pointing.menu .active.item .menu .active.item:after,.ui.pointing.menu .dropdown.active.item:after{display:none}.ui.pointing.menu .active.item:hover:after{background-color:#f2f2f2}.ui.pointing.menu .active.item:after{background-color:#f2f2f2}.ui.pointing.menu .active.item:hover:after{background-color:#f2f2f2}.ui.vertical.pointing.menu .active.item:hover:after{background-color:#f2f2f2}.ui.vertical.pointing.menu .active.item:after{background-color:#f2f2f2}.ui.vertical.pointing.menu .menu .active.item:after{background-color:#fff}.ui.attached.menu{top:0;bottom:0;border-radius:0;margin:0 -1px;width:calc(100% - (-1px * 2));max-width:calc(100% - (-1px * 2));-webkit-box-shadow:none;box-shadow:none}.ui.attached+.ui.attached.menu:not(.top){border-top:none}.ui[class*="top attached"].menu{bottom:0;margin-bottom:0;top:0;margin-top:1rem;border-radius:.28571429rem .28571429rem 0 0}.ui.menu[class*="top attached"]:first-child{margin-top:0}.ui[class*="bottom attached"].menu{bottom:0;margin-top:0;top:0;margin-bottom:1rem;-webkit-box-shadow:0 1px 2px 0 rgba(34,36,38,.15),none;box-shadow:0 1px 2px 0 rgba(34,36,38,.15),none;border-radius:0 0 .28571429rem .28571429rem}.ui[class*="bottom attached"].menu:last-child{margin-bottom:0}.ui.top.attached.menu>.item:first-child{border-radius:.28571429rem 0 0 0}.ui.bottom.attached.menu>.item:first-child{border-radius:0 0 0 .28571429rem}.ui.attached.menu:not(.tabular){border:1px solid #d4d4d5}.ui.attached.inverted.menu{border:none}.ui.attached.tabular.menu{margin-left:0;margin-right:0;width:100%}.ui.mini.menu{font-size:.78571429rem}.ui.mini.vertical.menu{width:9rem}.ui.tiny.menu{font-size:.85714286rem}.ui.tiny.vertical.menu{width:11rem}.ui.small.menu{font-size:.92857143rem}.ui.small.vertical.menu{width:13rem}.ui.menu{font-size:1rem}.ui.vertical.menu{width:15rem}.ui.large.menu{font-size:1.07142857rem}.ui.large.vertical.menu{width:18rem}.ui.huge.menu{font-size:1.21428571rem}.ui.huge.vertical.menu{width:22rem}.ui.big.menu{font-size:1.14285714rem}.ui.big.vertical.menu{width:20rem}.ui.massive.menu{font-size:1.28571429rem}.ui.massive.vertical.menu{width:25rem}.ui.form{position:relative;max-width:100%}.ui.form>p{margin:1em 0}.ui.form .field{clear:both;margin:0 0 1em}.ui.form .field:last-child,.ui.form .fields:last-child .field{margin-bottom:0}.ui.form .fields .field{clear:both;margin:0}.ui.form .field>label{display:block;margin:0 0 .28571429rem 0;color:rgba(0,0,0,.87);font-size:.92857143em;font-weight:700;text-transform:none}.ui.form input:not([type]),.ui.form input[type=date],.ui.form input[type=datetime-local],.ui.form input[type=email],.ui.form input[type=file],.ui.form input[type=number],.ui.form input[type=password],.ui.form input[type=search],.ui.form input[type=tel],.ui.form input[type=text],.ui.form input[type=time],.ui.form input[type=url],.ui.form textarea{width:100%;vertical-align:top}.ui.form ::-webkit-datetime-edit,.ui.form ::-webkit-inner-spin-button{height:1.21428571em}.ui.form input:not([type]),.ui.form input[type=date],.ui.form input[type=datetime-local],.ui.form input[type=email],.ui.form input[type=file],.ui.form input[type=number],.ui.form input[type=password],.ui.form input[type=search],.ui.form input[type=tel],.ui.form input[type=text],.ui.form input[type=time],.ui.form input[type=url]{font-family:Lato,'Helvetica Neue',Arial,Helvetica,sans-serif;margin:0;outline:0;-webkit-appearance:none;tap-highlight-color:rgba(255,255,255,0);line-height:1.21428571em;padding:.67857143em 1em;font-size:1em;background:#fff;border:1px solid rgba(34,36,38,.15);color:rgba(0,0,0,.87);border-radius:.28571429rem;-webkit-box-shadow:0 0 0 0 transparent inset;box-shadow:0 0 0 0 transparent inset;-webkit-transition:color .1s ease,border-color .1s ease;transition:color .1s ease,border-color .1s ease}.ui.form textarea{margin:0;-webkit-appearance:none;tap-highlight-color:rgba(255,255,255,0);padding:.78571429em 1em;background:#fff;border:1px solid rgba(34,36,38,.15);outline:0;color:rgba(0,0,0,.87);border-radius:.28571429rem;-webkit-box-shadow:0 0 0 0 transparent inset;box-shadow:0 0 0 0 transparent inset;-webkit-transition:color .1s ease,border-color .1s ease;transition:color .1s ease,border-color .1s ease;font-size:1em;line-height:1.2857;resize:vertical}.ui.form textarea:not([rows]){height:12em;min-height:8em;max-height:24em}.ui.form input[type=checkbox],.ui.form textarea{vertical-align:top}.ui.form input.attached{width:auto}.ui.form select{display:block;height:auto;width:100%;background:#fff;border:1px solid rgba(34,36,38,.15);border-radius:.28571429rem;-webkit-box-shadow:0 0 0 0 transparent inset;box-shadow:0 0 0 0 transparent inset;padding:.62em 1em;color:rgba(0,0,0,.87);-webkit-transition:color .1s ease,border-color .1s ease;transition:color .1s ease,border-color .1s ease}.ui.form .field>.selection.dropdown{width:100%}.ui.form .field>.selection.dropdown>.dropdown.icon{float:right}.ui.form .inline.field>.selection.dropdown,.ui.form .inline.fields .field>.selection.dropdown{width:auto}.ui.form .inline.field>.selection.dropdown>.dropdown.icon,.ui.form .inline.fields .field>.selection.dropdown>.dropdown.icon{float:none}.ui.form .field .ui.input,.ui.form .fields .field .ui.input,.ui.form .wide.field .ui.input{width:100%}.ui.form .inline.field:not(.wide) .ui.input,.ui.form .inline.fields .field:not(.wide) .ui.input{width:auto;vertical-align:middle}.ui.form .field .ui.input input,.ui.form .fields .field .ui.input input{width:auto}.ui.form .eight.fields .ui.input input,.ui.form .five.fields .ui.input input,.ui.form .four.fields .ui.input input,.ui.form .nine.fields .ui.input input,.ui.form .seven.fields .ui.input input,.ui.form .six.fields .ui.input input,.ui.form .ten.fields .ui.input input,.ui.form .three.fields .ui.input input,.ui.form .two.fields .ui.input input,.ui.form .wide.field .ui.input input{-webkit-box-flex:1;-ms-flex:1 0 auto;flex:1 0 auto;width:0}.ui.form .error.message,.ui.form .success.message,.ui.form .warning.message{display:none}.ui.form .message:first-child{margin-top:0}.ui.form .field .prompt.label{white-space:normal;background:#fff!important;border:1px solid #e0b4b4!important;color:#9f3a38!important}.ui.form .inline.field .prompt,.ui.form .inline.fields .field .prompt{vertical-align:top;margin:-.25em 0 -.5em .5em}.ui.form .inline.field .prompt:before,.ui.form .inline.fields .field .prompt:before{border-width:0 0 1px 1px;bottom:auto;right:auto;top:50%;left:0}.ui.form .field.field input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px ivory inset!important;box-shadow:0 0 0 100px ivory inset!important;border-color:#e5dfa1!important}.ui.form .field.field input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 100px ivory inset!important;box-shadow:0 0 0 100px ivory inset!important;border-color:#d5c315!important}.ui.form .error.error input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px #fffaf0 inset!important;box-shadow:0 0 0 100px #fffaf0 inset!important;border-color:#e0b4b4!important}.ui.form ::-webkit-input-placeholder{color:rgba(191,191,191,.87)}.ui.form :-ms-input-placeholder{color:rgba(191,191,191,.87)!important}.ui.form ::-moz-placeholder{color:rgba(191,191,191,.87)}.ui.form :focus::-webkit-input-placeholder{color:rgba(115,115,115,.87)}.ui.form :focus:-ms-input-placeholder{color:rgba(115,115,115,.87)!important}.ui.form :focus::-moz-placeholder{color:rgba(115,115,115,.87)}.ui.form .error ::-webkit-input-placeholder{color:#e7bdbc}.ui.form .error :-ms-input-placeholder{color:#e7bdbc!important}.ui.form .error ::-moz-placeholder{color:#e7bdbc}.ui.form .error :focus::-webkit-input-placeholder{color:#da9796}.ui.form .error :focus:-ms-input-placeholder{color:#da9796!important}.ui.form .error :focus::-moz-placeholder{color:#da9796}.ui.form input:not([type]):focus,.ui.form input[type=date]:focus,.ui.form input[type=datetime-local]:focus,.ui.form input[type=email]:focus,.ui.form input[type=file]:focus,.ui.form input[type=number]:focus,.ui.form input[type=password]:focus,.ui.form input[type=search]:focus,.ui.form input[type=tel]:focus,.ui.form input[type=text]:focus,.ui.form input[type=time]:focus,.ui.form input[type=url]:focus{color:rgba(0,0,0,.95);border-color:#85b7d9;border-radius:.28571429rem;background:#fff;-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.35) inset;box-shadow:0 0 0 0 rgba(34,36,38,.35) inset}.ui.form textarea:focus{color:rgba(0,0,0,.95);border-color:#85b7d9;border-radius:.28571429rem;background:#fff;-webkit-box-shadow:0 0 0 0 rgba(34,36,38,.35) inset;box-shadow:0 0 0 0 rgba(34,36,38,.35) inset;-webkit-appearance:none}.ui.form.success .success.message:not(:empty){display:block}.ui.form.success .compact.success.message:not(:empty){display:inline-block}.ui.form.success .icon.success.message:not(:empty){display:-webkit-box;display:-ms-flexbox;display:flex}.ui.form.warning .warning.message:not(:empty){display:block}.ui.form.warning .compact.warning.message:not(:empty){display:inline-block}.ui.form.warning .icon.warning.message:not(:empty){display:-webkit-box;display:-ms-flexbox;display:flex}.ui.form.error .error.message:not(:empty){display:block}.ui.form.error .compact.error.message:not(:empty){display:inline-block}.ui.form.error .icon.error.message:not(:empty){display:-webkit-box;display:-ms-flexbox;display:flex}.ui.form .field.error .input,.ui.form .field.error label,.ui.form .fields.error .field .input,.ui.form .fields.error .field label{color:#9f3a38}.ui.form .field.error .corner.label,.ui.form .fields.error .field .corner.label{border-color:#9f3a38;color:#fff}.ui.form .field.error input:not([type]),.ui.form .field.error input[type=date],.ui.form .field.error input[type=datetime-local],.ui.form .field.error input[type=email],.ui.form .field.error input[type=file],.ui.form .field.error input[type=number],.ui.form .field.error input[type=password],.ui.form .field.error input[type=search],.ui.form .field.error input[type=tel],.ui.form .field.error input[type=text],.ui.form .field.error input[type=time],.ui.form .field.error input[type=url],.ui.form .field.error select,.ui.form .field.error textarea,.ui.form .fields.error .field input:not([type]),.ui.form .fields.error .field input[type=date],.ui.form .fields.error .field input[type=datetime-local],.ui.form .fields.error .field input[type=email],.ui.form .fields.error .field input[type=file],.ui.form .fields.error .field input[type=number],.ui.form .fields.error .field input[type=password],.ui.form .fields.error .field input[type=search],.ui.form .fields.error .field input[type=tel],.ui.form .fields.error .field input[type=text],.ui.form .fields.error .field input[type=time],.ui.form .fields.error .field input[type=url],.ui.form .fields.error .field select,.ui.form .fields.error .field textarea{background:#fff6f6;border-color:#e0b4b4;color:#9f3a38;border-radius:'';-webkit-box-shadow:none;box-shadow:none}.ui.form .field.error input:not([type]):focus,.ui.form .field.error input[type=date]:focus,.ui.form .field.error input[type=datetime-local]:focus,.ui.form .field.error input[type=email]:focus,.ui.form .field.error input[type=file]:focus,.ui.form .field.error input[type=number]:focus,.ui.form .field.error input[type=password]:focus,.ui.form .field.error input[type=search]:focus,.ui.form .field.error input[type=tel]:focus,.ui.form .field.error input[type=text]:focus,.ui.form .field.error input[type=time]:focus,.ui.form .field.error input[type=url]:focus,.ui.form .field.error select:focus,.ui.form .field.error textarea:focus{background:#fff6f6;border-color:#e0b4b4;color:#9f3a38;-webkit-appearance:none;-webkit-box-shadow:none;box-shadow:none}.ui.form .field.error select{-webkit-appearance:menulist-button}.ui.form .field.error .ui.dropdown,.ui.form .field.error .ui.dropdown .item,.ui.form .field.error .ui.dropdown .text,.ui.form .fields.error .field .ui.dropdown,.ui.form .fields.error .field .ui.dropdown .item{background:#fff6f6;color:#9f3a38}.ui.form .field.error .ui.dropdown,.ui.form .fields.error .field .ui.dropdown{border-color:#e0b4b4!important}.ui.form .field.error .ui.dropdown:hover,.ui.form .fields.error .field .ui.dropdown:hover{border-color:#e0b4b4!important}.ui.form .field.error .ui.dropdown:hover .menu,.ui.form .fields.error .field .ui.dropdown:hover .menu{border-color:#e0b4b4}.ui.form .field.error .ui.multiple.selection.dropdown>.label,.ui.form .fields.error .field .ui.multiple.selection.dropdown>.label{background-color:#eacbcb;color:#9f3a38}.ui.form .field.error .ui.dropdown .menu .item:hover,.ui.form .fields.error .field .ui.dropdown .menu .item:hover{background-color:#fbe7e7}.ui.form .field.error .ui.dropdown .menu .selected.item,.ui.form .fields.error .field .ui.dropdown .menu .selected.item{background-color:#fbe7e7}.ui.form .field.error .ui.dropdown .menu .active.item,.ui.form .fields.error .field .ui.dropdown .menu .active.item{background-color:#fdcfcf!important}.ui.form .field.error .checkbox:not(.toggle):not(.slider) .box,.ui.form .field.error .checkbox:not(.toggle):not(.slider) label,.ui.form .fields.error .field .checkbox:not(.toggle):not(.slider) .box,.ui.form .fields.error .field .checkbox:not(.toggle):not(.slider) label{color:#9f3a38}.ui.form .field.error .checkbox:not(.toggle):not(.slider) .box:before,.ui.form .field.error .checkbox:not(.toggle):not(.slider) label:before,.ui.form .fields.error .field .checkbox:not(.toggle):not(.slider) .box:before,.ui.form .fields.error .field .checkbox:not(.toggle):not(.slider) label:before{background:#fff6f6;border-color:#e0b4b4}.ui.form .field.error .checkbox .box:after,.ui.form .field.error .checkbox label:after,.ui.form .fields.error .field .checkbox .box:after,.ui.form .fields.error .field .checkbox label:after{color:#9f3a38}.ui.form .disabled.field,.ui.form .disabled.fields .field,.ui.form .field :disabled{pointer-events:none;opacity:.45}.ui.form .field.disabled>label,.ui.form .fields.disabled>label{opacity:.45}.ui.form .field.disabled :disabled{opacity:1}.ui.loading.form{position:relative;cursor:default;pointer-events:none}.ui.loading.form:before{position:absolute;content:'';top:0;left:0;background:rgba(255,255,255,.8);width:100%;height:100%;z-index:100}.ui.loading.form:after{position:absolute;content:'';top:50%;left:50%;margin:-1.5em 0 0 -1.5em;width:3em;height:3em;-webkit-animation:form-spin .6s linear;animation:form-spin .6s linear;-webkit-animation-iteration-count:infinite;animation-iteration-count:infinite;border-radius:500rem;border-color:#767676 rgba(0,0,0,.1) rgba(0,0,0,.1) rgba(0,0,0,.1);border-style:solid;border-width:.2em;-webkit-box-shadow:0 0 0 1px transparent;box-shadow:0 0 0 1px transparent;visibility:visible;z-index:101}@-webkit-keyframes form-spin{from{-webkit-transform:rotate(0);transform:rotate(0)}to{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes form-spin{from{-webkit-transform:rotate(0);transform:rotate(0)}to{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}.ui.form .required.field>.checkbox:after,.ui.form .required.field>label:after,.ui.form .required.fields.grouped>label:after,.ui.form .required.fields:not(.grouped)>.field>.checkbox:after,.ui.form .required.fields:not(.grouped)>.field>label:after{margin:-.2em 0 0 .2em;content:'*';color:#db2828}.ui.form .required.field>label:after,.ui.form .required.fields.grouped>label:after,.ui.form .required.fields:not(.grouped)>.field>label:after{display:inline-block;vertical-align:top}.ui.form .required.field>.checkbox:after,.ui.form .required.fields:not(.grouped)>.field>.checkbox:after{position:absolute;top:0;left:100%}.ui.form .inverted.segment .ui.checkbox .box,.ui.form .inverted.segment .ui.checkbox label,.ui.form .inverted.segment label,.ui.inverted.form .inline.field>label,.ui.inverted.form .inline.field>p,.ui.inverted.form .inline.fields .field>label,.ui.inverted.form .inline.fields .field>p,.ui.inverted.form .inline.fields>label,.ui.inverted.form .ui.checkbox .box,.ui.inverted.form .ui.checkbox label,.ui.inverted.form label{color:rgba(255,255,255,.9)}.ui.inverted.form input:not([type]),.ui.inverted.form input[type=date],.ui.inverted.form input[type=datetime-local],.ui.inverted.form input[type=email],.ui.inverted.form input[type=file],.ui.inverted.form input[type=number],.ui.inverted.form input[type=password],.ui.inverted.form input[type=search],.ui.inverted.form input[type=tel],.ui.inverted.form input[type=text],.ui.inverted.form input[type=time],.ui.inverted.form input[type=url]{background:#fff;border-color:rgba(255,255,255,.1);color:rgba(0,0,0,.87);-webkit-box-shadow:none;box-shadow:none}.ui.form .grouped.fields{display:block;margin:0 0 1em}.ui.form .grouped.fields:last-child{margin-bottom:0}.ui.form .grouped.fields>label{margin:0 0 .28571429rem 0;color:rgba(0,0,0,.87);font-size:.92857143em;font-weight:700;text-transform:none}.ui.form .grouped.fields .field,.ui.form .grouped.inline.fields .field{display:block;margin:.5em 0;padding:0}.ui.form .fields{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-orient:horizontal;-webkit-box-direction:normal;-ms-flex-direction:row;flex-direction:row;margin:0 -.5em 1em}.ui.form .fields>.field{-webkit-box-flex:0;-ms-flex:0 1 auto;flex:0 1 auto;padding-left:.5em;padding-right:.5em}.ui.form .fields>.field:first-child{border-left:none;-webkit-box-shadow:none;box-shadow:none}.ui.form .two.fields>.field,.ui.form .two.fields>.fields{width:50%}.ui.form .three.fields>.field,.ui.form .three.fields>.fields{width:33.33333333%}.ui.form .four.fields>.field,.ui.form .four.fields>.fields{width:25%}.ui.form .five.fields>.field,.ui.form .five.fields>.fields{width:20%}.ui.form .six.fields>.field,.ui.form .six.fields>.fields{width:16.66666667%}.ui.form .seven.fields>.field,.ui.form .seven.fields>.fields{width:14.28571429%}.ui.form .eight.fields>.field,.ui.form .eight.fields>.fields{width:12.5%}.ui.form .nine.fields>.field,.ui.form .nine.fields>.fields{width:11.11111111%}.ui.form .ten.fields>.field,.ui.form .ten.fields>.fields{width:10%}@media only screen and (max-width:767px){.ui.form .fields{-ms-flex-wrap:wrap;flex-wrap:wrap}.ui.form:not(.unstackable) .eight.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .eight.fields:not(.unstackable)>.fields,.ui.form:not(.unstackable) .five.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .five.fields:not(.unstackable)>.fields,.ui.form:not(.unstackable) .four.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .four.fields:not(.unstackable)>.fields,.ui.form:not(.unstackable) .nine.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .nine.fields:not(.unstackable)>.fields,.ui.form:not(.unstackable) .seven.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .seven.fields:not(.unstackable)>.fields,.ui.form:not(.unstackable) .six.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .six.fields:not(.unstackable)>.fields,.ui.form:not(.unstackable) .ten.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .ten.fields:not(.unstackable)>.fields,.ui.form:not(.unstackable) .three.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .three.fields:not(.unstackable)>.fields,.ui.form:not(.unstackable) .two.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .two.fields:not(.unstackable)>.fields,.ui.form:not(.unstackable) [class*="equal width"].fields:not(.unstackable)>.field,.ui[class*="equal width"].form:not(.unstackable) .fields>.field{width:100%!important;margin:0 0 1em}}.ui.form .fields .wide.field{width:6.25%;padding-left:.5em;padding-right:.5em}.ui.form .one.wide.field{width:6.25%!important}.ui.form .two.wide.field{width:12.5%!important}.ui.form .three.wide.field{width:18.75%!important}.ui.form .four.wide.field{width:25%!important}.ui.form .five.wide.field{width:31.25%!important}.ui.form .six.wide.field{width:37.5%!important}.ui.form .seven.wide.field{width:43.75%!important}.ui.form .eight.wide.field{width:50%!important}.ui.form .nine.wide.field{width:56.25%!important}.ui.form .ten.wide.field{width:62.5%!important}.ui.form .eleven.wide.field{width:68.75%!important}.ui.form .twelve.wide.field{width:75%!important}.ui.form .thirteen.wide.field{width:81.25%!important}.ui.form .fourteen.wide.field{width:87.5%!important}.ui.form .fifteen.wide.field{width:93.75%!important}.ui.form .sixteen.wide.field{width:100%!important}@media only screen and (max-width:767px){.ui.form:not(.unstackable) .fields:not(.unstackable)>.eight.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.eleven.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.fifteen.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.five.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.four.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.fourteen.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.nine.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.seven.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.six.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.sixteen.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.ten.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.thirteen.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.three.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.twelve.wide.field,.ui.form:not(.unstackable) .fields:not(.unstackable)>.two.wide.field,.ui.form:not(.unstackable) .five.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .five.fields:not(.unstackable)>.fields,.ui.form:not(.unstackable) .four.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .four.fields:not(.unstackable)>.fields,.ui.form:not(.unstackable) .three.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .three.fields:not(.unstackable)>.fields,.ui.form:not(.unstackable) .two.fields:not(.unstackable)>.field,.ui.form:not(.unstackable) .two.fields:not(.unstackable)>.fields{width:100%!important}.ui.form .fields{margin-bottom:0}}.ui.form [class*="equal width"].fields>.field,.ui[class*="equal width"].form .fields>.field{width:100%;-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto}.ui.form .inline.fields{margin:0 0 1em;-webkit-box-align:center;-ms-flex-align:center;align-items:center}.ui.form .inline.fields .field{margin:0;padding:0 1em 0 0}.ui.form .inline.field>label,.ui.form .inline.field>p,.ui.form .inline.fields .field>label,.ui.form .inline.fields .field>p,.ui.form .inline.fields>label{display:inline-block;width:auto;margin-top:0;margin-bottom:0;vertical-align:baseline;font-size:.92857143em;font-weight:700;color:rgba(0,0,0,.87);text-transform:none}.ui.form .inline.fields>label{margin:.035714em 1em 0 0}.ui.form .inline.field>input,.ui.form .inline.field>select,.ui.form .inline.fields .field>input,.ui.form .inline.fields .field>select{display:inline-block;width:auto;margin-top:0;margin-bottom:0;vertical-align:middle;font-size:1em}.ui.form .inline.field>:first-child,.ui.form .inline.fields .field>:first-child{margin:0 .85714286em 0 0}.ui.form .inline.field>:only-child,.ui.form .inline.fields .field>:only-child{margin:0}.ui.form .inline.fields .wide.field{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center}.ui.form .inline.fields .wide.field>input,.ui.form .inline.fields .wide.field>select{width:100%}.ui.mini.form{font-size:.78571429rem}.ui.tiny.form{font-size:.85714286rem}.ui.small.form{font-size:.92857143rem}.ui.form{font-size:1rem}.ui.large.form{font-size:1.14285714rem}.ui.big.form{font-size:1.28571429rem}.ui.huge.form{font-size:1.42857143rem}.ui.massive.form{font-size:1.71428571rem}.ui.checkbox{position:relative;display:inline-block;-webkit-backface-visibility:hidden;backface-visibility:hidden;outline:0;vertical-align:baseline;font-style:normal;min-height:17px;font-size:1rem;line-height:17px;min-width:17px}.ui.checkbox input[type=checkbox],.ui.checkbox input[type=radio]{cursor:pointer;position:absolute;top:0;left:0;opacity:0!important;outline:0;z-index:3;width:17px;height:17px}.ui.checkbox .box,.ui.checkbox label{cursor:auto;position:relative;display:block;padding-left:1.85714em;outline:0;font-size:1em}.ui.checkbox .box:before,.ui.checkbox label:before{position:absolute;top:0;left:0;width:17px;height:17px;content:'';background:#fff;border-radius:.21428571rem;-webkit-transition:border .1s ease,opacity .1s ease,-webkit-transform .1s ease,-webkit-box-shadow .1s ease;transition:border .1s ease,opacity .1s ease,-webkit-transform .1s ease,-webkit-box-shadow .1s ease;transition:border .1s ease,opacity .1s ease,transform .1s ease,box-shadow .1s ease;transition:border .1s ease,opacity .1s ease,transform .1s ease,box-shadow .1s ease,-webkit-transform .1s ease,-webkit-box-shadow .1s ease;border:1px solid #d4d4d5}.ui.checkbox .box:after,.ui.checkbox label:after{position:absolute;font-size:14px;top:0;left:0;width:17px;height:17px;text-align:center;opacity:0;color:rgba(0,0,0,.87);-webkit-transition:border .1s ease,opacity .1s ease,-webkit-transform .1s ease,-webkit-box-shadow .1s ease;transition:border .1s ease,opacity .1s ease,-webkit-transform .1s ease,-webkit-box-shadow .1s ease;transition:border .1s ease,opacity .1s ease,transform .1s ease,box-shadow .1s ease;transition:border .1s ease,opacity .1s ease,transform .1s ease,box-shadow .1s ease,-webkit-transform .1s ease,-webkit-box-shadow .1s ease}.ui.checkbox label,.ui.checkbox+label{color:rgba(0,0,0,.87);-webkit-transition:color .1s ease;transition:color .1s ease}.ui.checkbox+label{vertical-align:middle}.ui.checkbox .box:hover::before,.ui.checkbox label:hover::before{background:#fff;border-color:rgba(34,36,38,.35)}.ui.checkbox label:hover,.ui.checkbox+label:hover{color:rgba(0,0,0,.8)}.ui.checkbox .box:active::before,.ui.checkbox label:active::before{background:#f9fafb;border-color:rgba(34,36,38,.35)}.ui.checkbox .box:active::after,.ui.checkbox label:active::after{color:rgba(0,0,0,.95)}.ui.checkbox input:active~label{color:rgba(0,0,0,.95)}.ui.checkbox input:focus~.box:before,.ui.checkbox input:focus~label:before{background:#fff;border-color:#96c8da}.ui.checkbox input:focus~.box:after,.ui.checkbox input:focus~label:after{color:rgba(0,0,0,.95)}.ui.checkbox input:focus~label{color:rgba(0,0,0,.95)}.ui.checkbox input:checked~.box:before,.ui.checkbox input:checked~label:before{background:#fff;border-color:rgba(34,36,38,.35)}.ui.checkbox input:checked~.box:after,.ui.checkbox input:checked~label:after{opacity:1;color:rgba(0,0,0,.95)}.ui.checkbox input:not([type=radio]):indeterminate~.box:before,.ui.checkbox input:not([type=radio]):indeterminate~label:before{background:#fff;border-color:rgba(34,36,38,.35)}.ui.checkbox input:not([type=radio]):indeterminate~.box:after,.ui.checkbox input:not([type=radio]):indeterminate~label:after{opacity:1;color:rgba(0,0,0,.95)}.ui.checkbox input:checked:focus~.box:before,.ui.checkbox input:checked:focus~label:before,.ui.checkbox input:not([type=radio]):indeterminate:focus~.box:before,.ui.checkbox input:not([type=radio]):indeterminate:focus~label:before{background:#fff;border-color:#96c8da}.ui.checkbox input:checked:focus~.box:after,.ui.checkbox input:checked:focus~label:after,.ui.checkbox input:not([type=radio]):indeterminate:focus~.box:after,.ui.checkbox input:not([type=radio]):indeterminate:focus~label:after{color:rgba(0,0,0,.95)}.ui.read-only.checkbox,.ui.read-only.checkbox label{cursor:default}.ui.checkbox input[disabled]~.box:after,.ui.checkbox input[disabled]~label,.ui.disabled.checkbox .box:after,.ui.disabled.checkbox label{cursor:default!important;opacity:.5;color:#000}.ui.checkbox input.hidden{z-index:-1}.ui.checkbox input.hidden+label{cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.ui.radio.checkbox{min-height:15px}.ui.radio.checkbox .box,.ui.radio.checkbox label{padding-left:1.85714em}.ui.radio.checkbox .box:before,.ui.radio.checkbox label:before{content:'';-webkit-transform:none;transform:none;width:15px;height:15px;border-radius:500rem;top:1px;left:0}.ui.radio.checkbox .box:after,.ui.radio.checkbox label:after{border:none;content:''!important;width:15px;height:15px;line-height:15px}.ui.radio.checkbox .box:after,.ui.radio.checkbox label:after{top:1px;left:0;width:15px;height:15px;border-radius:500rem;-webkit-transform:scale(.46666667);transform:scale(.46666667);background-color:rgba(0,0,0,.87)}.ui.radio.checkbox input:focus~.box:before,.ui.radio.checkbox input:focus~label:before{background-color:#fff}.ui.radio.checkbox input:focus~.box:after,.ui.radio.checkbox input:focus~label:after{background-color:rgba(0,0,0,.95)}.ui.radio.checkbox input:indeterminate~.box:after,.ui.radio.checkbox input:indeterminate~label:after{opacity:0}.ui.radio.checkbox input:checked~.box:before,.ui.radio.checkbox input:checked~label:before{background-color:#fff}.ui.radio.checkbox input:checked~.box:after,.ui.radio.checkbox input:checked~label:after{background-color:rgba(0,0,0,.95)}.ui.radio.checkbox input:focus:checked~.box:before,.ui.radio.checkbox input:focus:checked~label:before{background-color:#fff}.ui.radio.checkbox input:focus:checked~.box:after,.ui.radio.checkbox input:focus:checked~label:after{background-color:rgba(0,0,0,.95)}.ui.slider.checkbox{min-height:1.25rem}.ui.slider.checkbox input{width:3.5rem;height:1.25rem}.ui.slider.checkbox .box,.ui.slider.checkbox label{padding-left:4.5rem;line-height:1rem;color:rgba(0,0,0,.4)}.ui.slider.checkbox .box:before,.ui.slider.checkbox label:before{display:block;position:absolute;content:'';border:none!important;left:0;z-index:1;top:.4rem;background-color:rgba(0,0,0,.05);width:3.5rem;height:.21428571rem;-webkit-transform:none;transform:none;border-radius:500rem;-webkit-transition:background .3s ease;transition:background .3s ease}.ui.slider.checkbox .box:after,.ui.slider.checkbox label:after{background:#fff -webkit-gradient(linear,left top,left bottom,from(transparent),to(rgba(0,0,0,.05)));background:#fff -webkit-linear-gradient(transparent,rgba(0,0,0,.05));background:#fff linear-gradient(transparent,rgba(0,0,0,.05));position:absolute;content:''!important;opacity:1;z-index:2;border:none;-webkit-box-shadow:0 1px 2px 0 rgba(34,36,38,.15),0 0 0 1px rgba(34,36,38,.15) inset;box-shadow:0 1px 2px 0 rgba(34,36,38,.15),0 0 0 1px rgba(34,36,38,.15) inset;width:1.5rem;height:1.5rem;top:-.25rem;left:0;-webkit-transform:none;transform:none;border-radius:500rem;-webkit-transition:left .3s ease;transition:left .3s ease}.ui.slider.checkbox input:focus~.box:before,.ui.slider.checkbox input:focus~label:before{background-color:rgba(0,0,0,.15);border:none}.ui.slider.checkbox .box:hover,.ui.slider.checkbox label:hover{color:rgba(0,0,0,.8)}.ui.slider.checkbox .box:hover::before,.ui.slider.checkbox label:hover::before{background:rgba(0,0,0,.15)}.ui.slider.checkbox input:checked~.box,.ui.slider.checkbox input:checked~label{color:rgba(0,0,0,.95)!important}.ui.slider.checkbox input:checked~.box:before,.ui.slider.checkbox input:checked~label:before{background-color:#545454!important}.ui.slider.checkbox input:checked~.box:after,.ui.slider.checkbox input:checked~label:after{left:2rem}.ui.slider.checkbox input:focus:checked~.box,.ui.slider.checkbox input:focus:checked~label{color:rgba(0,0,0,.95)!important}.ui.slider.checkbox input:focus:checked~.box:before,.ui.slider.checkbox input:focus:checked~label:before{background-color:#000!important}.ui.toggle.checkbox{min-height:1.5rem}.ui.toggle.checkbox input{width:3.5rem;height:1.5rem}.ui.toggle.checkbox .box,.ui.toggle.checkbox label{min-height:1.5rem;padding-left:4.5rem;color:rgba(0,0,0,.87)}.ui.toggle.checkbox label{padding-top:.15em}.ui.toggle.checkbox .box:before,.ui.toggle.checkbox label:before{display:block;position:absolute;content:'';z-index:1;-webkit-transform:none;transform:none;border:none;top:0;background:rgba(0,0,0,.05);-webkit-box-shadow:none;box-shadow:none;width:3.5rem;height:1.5rem;border-radius:500rem}.ui.toggle.checkbox .box:after,.ui.toggle.checkbox label:after{background:#fff -webkit-gradient(linear,left top,left bottom,from(transparent),to(rgba(0,0,0,.05)));background:#fff -webkit-linear-gradient(transparent,rgba(0,0,0,.05));background:#fff linear-gradient(transparent,rgba(0,0,0,.05));position:absolute;content:''!important;opacity:1;z-index:2;border:none;-webkit-box-shadow:0 1px 2px 0 rgba(34,36,38,.15),0 0 0 1px rgba(34,36,38,.15) inset;box-shadow:0 1px 2px 0 rgba(34,36,38,.15),0 0 0 1px rgba(34,36,38,.15) inset;width:1.5rem;height:1.5rem;top:0;left:0;border-radius:500rem;-webkit-transition:background .3s ease,left .3s ease;transition:background .3s ease,left .3s ease}.ui.toggle.checkbox input~.box:after,.ui.toggle.checkbox input~label:after{left:-.05rem;-webkit-box-shadow:0 1px 2px 0 rgba(34,36,38,.15),0 0 0 1px rgba(34,36,38,.15) inset;box-shadow:0 1px 2px 0 rgba(34,36,38,.15),0 0 0 1px rgba(34,36,38,.15) inset}.ui.toggle.checkbox input:focus~.box:before,.ui.toggle.checkbox input:focus~label:before{background-color:rgba(0,0,0,.15);border:none}.ui.toggle.checkbox .box:hover::before,.ui.toggle.checkbox label:hover::before{background-color:rgba(0,0,0,.15);border:none}.ui.toggle.checkbox input:checked~.box,.ui.toggle.checkbox input:checked~label{color:rgba(0,0,0,.95)!important}.ui.toggle.checkbox input:checked~.box:before,.ui.toggle.checkbox input:checked~label:before{background-color:#2185d0!important}.ui.toggle.checkbox input:checked~.box:after,.ui.toggle.checkbox input:checked~label:after{left:2.15rem;-webkit-box-shadow:0 1px 2px 0 rgba(34,36,38,.15),0 0 0 1px rgba(34,36,38,.15) inset;box-shadow:0 1px 2px 0 rgba(34,36,38,.15),0 0 0 1px rgba(34,36,38,.15) inset}.ui.toggle.checkbox input:focus:checked~.box,.ui.toggle.checkbox input:focus:checked~label{color:rgba(0,0,0,.95)!important}.ui.toggle.checkbox input:focus:checked~.box:before,.ui.toggle.checkbox input:focus:checked~label:before{background-color:#0d71bb!important}.ui.fitted.checkbox .box,.ui.fitted.checkbox label{padding-left:0!important}.ui.fitted.toggle.checkbox{width:3.5rem}.ui.fitted.slider.checkbox{width:3.5rem}@font-face{font-family:Checkbox;src:url(data:application/x-font-ttf;charset=utf-8;base64,AAEAAAALAIAAAwAwT1MvMg8SBD8AAAC8AAAAYGNtYXAYVtCJAAABHAAAAFRnYXNwAAAAEAAAAXAAAAAIZ2x5Zn4huwUAAAF4AAABYGhlYWQGPe1ZAAAC2AAAADZoaGVhB30DyAAAAxAAAAAkaG10eBBKAEUAAAM0AAAAHGxvY2EAmgESAAADUAAAABBtYXhwAAkALwAAA2AAAAAgbmFtZSC8IugAAAOAAAABknBvc3QAAwAAAAAFFAAAACAAAwMTAZAABQAAApkCzAAAAI8CmQLMAAAB6wAzAQkAAAAAAAAAAAAAAAAAAAABEAAAAAAAAAAAAAAAAAAAAABAAADoAgPA/8AAQAPAAEAAAAABAAAAAAAAAAAAAAAgAAAAAAADAAAAAwAAABwAAQADAAAAHAADAAEAAAAcAAQAOAAAAAoACAACAAIAAQAg6AL//f//AAAAAAAg6AD//f//AAH/4xgEAAMAAQAAAAAAAAAAAAAAAQAB//8ADwABAAAAAAAAAAAAAgAANzkBAAAAAAEAAAAAAAAAAAACAAA3OQEAAAAAAQAAAAAAAAAAAAIAADc5AQAAAAABAEUAUQO7AvgAGgAAARQHAQYjIicBJjU0PwE2MzIfAQE2MzIfARYVA7sQ/hQQFhcQ/uMQEE4QFxcQqAF2EBcXEE4QAnMWEP4UEBABHRAXFhBOEBCoAXcQEE4QFwAAAAABAAABbgMlAkkAFAAAARUUBwYjISInJj0BNDc2MyEyFxYVAyUQEBf9SRcQEBAQFwK3FxAQAhJtFxAQEBAXbRcQEBAQFwAAAAABAAAASQMlA24ALAAAARUUBwYrARUUBwYrASInJj0BIyInJj0BNDc2OwE1NDc2OwEyFxYdATMyFxYVAyUQEBfuEBAXbhYQEO4XEBAQEBfuEBAWbhcQEO4XEBACEm0XEBDuFxAQEBAX7hAQF20XEBDuFxAQEBAX7hAQFwAAAQAAAAIAAHRSzT9fDzz1AAsEAAAAAADRsdR3AAAAANGx1HcAAAAAA7sDbgAAAAgAAgAAAAAAAAABAAADwP/AAAAEAAAAAAADuwABAAAAAAAAAAAAAAAAAAAABwQAAAAAAAAAAAAAAAIAAAAEAABFAyUAAAMlAAAAAAAAAAoAFAAeAE4AcgCwAAEAAAAHAC0AAQAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAOAK4AAQAAAAAAAQAIAAAAAQAAAAAAAgAHAGkAAQAAAAAAAwAIADkAAQAAAAAABAAIAH4AAQAAAAAABQALABgAAQAAAAAABgAIAFEAAQAAAAAACgAaAJYAAwABBAkAAQAQAAgAAwABBAkAAgAOAHAAAwABBAkAAwAQAEEAAwABBAkABAAQAIYAAwABBAkABQAWACMAAwABBAkABgAQAFkAAwABBAkACgA0ALBDaGVja2JveABDAGgAZQBjAGsAYgBvAHhWZXJzaW9uIDIuMABWAGUAcgBzAGkAbwBuACAAMgAuADBDaGVja2JveABDAGgAZQBjAGsAYgBvAHhDaGVja2JveABDAGgAZQBjAGsAYgBvAHhSZWd1bGFyAFIAZQBnAHUAbABhAHJDaGVja2JveABDAGgAZQBjAGsAYgBvAHhGb250IGdlbmVyYXRlZCBieSBJY29Nb29uLgBGAG8AbgB0ACAAZwBlAG4AZQByAGEAdABlAGQAIABiAHkAIABJAGMAbwBNAG8AbwBuAC4AAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA) format('truetype')}.ui.checkbox .box:after,.ui.checkbox label:after{font-family:Checkbox}.ui.checkbox input:checked~.box:after,.ui.checkbox input:checked~label:after{content:'\e800'}.ui.checkbox input:indeterminate~.box:after,.ui.checkbox input:indeterminate~label:after{font-size:12px;content:'\e801'}`;
    /* adds gmUI components */
    ui = '.pure{--bulma-white: hsl(0, 0%, 100%);--bulma-black: hsl(0, 0%, 4%);--bulma-light: hsl(0, 0%, 96%);--bulma-dark: hsl(0, 0%, 21%);--bulma-turquoise: hsl(171, 100%, 41%);--bulma-blue: hsl(217, 71%, 53%);--bulma-cyan: hsl(204, 86%, 53%);--bulma-green: hsl(141, 53%, 53%);--bulma-yellow: hsl(48, 100%, 67%);--bulma-red: hsl(348, 100%, 61%);--bulma-primary: hsl(171, 100%, 41%);--bulma-link: hsl(217, 71%, 53%);--bulma-info: hsl(204, 86%, 53%);--bulma-success: hsl(141, 53%, 53%);--bulma-warning: hsl(48, 100%, 67%);--bulma-danger: hsl(348, 100%, 61%);--bulma-white-inverted: hsl(0, 0%, 4%);--bulma-black-inverted: hsl(0, 0%, 100%);--bulma-light-inverted: hsl(0, 0%, 21%);--bulma-dark-inverted:  hsl(0, 0%, 96%);--bulma-turquoise-inverted: #fff;--bulma-blue-inverted: #fff;--bulma-cyan-inverted: #fff;--bulma-green-inverted: #fff;--bulma-yellow-inverted: rgba(0, 0, 0, 0.7);--bulma-red-inverted: #fff;--bulma-primary-inverted: #fff;--bulma-link-inverted: #fff;--bulma-info-inverted: #fff;--bulma-success-inverted: #fff;--bulma-warning-inverted: rgba(0, 0, 0, 0.7);--bulma-danger-inverted: #fff;--bulma-black-bis: hsl(0, 0%, 7%);--bulma-black-ter: hsl(0, 0%, 14%);--bulma-grey-darker: hsl(0, 0%, 21%);--bulma-grey-dark: hsl(0, 0%, 29%);--bulma-grey-light: hsl(0, 0%, 71%);--bulma-grey-lighter: hsl(0, 0%, 86%);--bulma-white-ter: hsl(0, 0%, 96%);--bulma-white-bis: hsl(0, 0%, 98%);}.bulma.white{background-color: var(--bulma-white); color: var(--bulma-white-inverted);border-color: var(--bulma-white);}.bulma.black{background-color: var(--bulma-black); color: var(--bulma-black-inverted);border-color: var(--bulma-black);}.bulma.light{background-color: var(--bulma-light); color: var(--bulma-light-inverted);border-color: var(--bulma-light);}.bulma.dark{background-color: var(--bulma-dark); color: var(--bulma-dark-inverted);border-color: var(--bulma-dark);}.bulma.turquoise{background-color: var(--bulma-turquoise); color: var(--bulma-turquoise-inverted);border-color: var(--bulma-turquoise);}.bulma.blue{background-color: var(--bulma-blue); color: var(--bulma-blue-inverted);border-color: var(--bulma-blue);}.bulma.cyan{background-color: var(--bulma-cyan); color: var(--bulma-cyan-inverted);border-color: var(--bulma-cyan);}.bulma.green{background-color: var(--bulma-green); color: var(--bulma-green-inverted);border-color: var(--bulma-green);}.bulma.yellow{background-color: var(--bulma-yellow); color: var(--bulma-yellow-inverted);border-color: var(--bulma-yellow);}.bulma.red{background-color: var(--bulma-red); color: var(--bulma-red-inverted);border-color: var(--bulma-red);}.bulma.primary{background-color: var(--bulma-primary); color: var(--bulma-primary-inverted);border-color: var(--bulma-primary);}.bulma.link{background-color: var(--bulma-link); color: var(--bulma-link-inverted);border-color: var(--bulma-link);}.bulma.info{background-color: var(--bulma-info); color: var(--bulma-info-inverted);border-color: var(--bulma-info);}.bulma.success{background-color: var(--bulma-success); color: var(--bulma-success-inverted);border-color: var(--bulma-success);}.bulma.warning{background-color: var(--bulma-warning); color: var(--bulma-warning-inverted);border-color: var(--bulma-warning);}.bulma.danger{background-color: var(--bulma-danger); color: var(--bulma-danger-inverted);border-color: var(--bulma-danger);}.bulma.bg-white{background-color: var(--bulma-white);}.bulma.bg-black{background-color: var(--bulma-black);}.bulma.bg-light{background-color: var(--bulma-light);}.bulma.bg-dark{background-color: var(--bulma-dark);}.bulma.bg-turquoise{background-color: var(--bulma-turquoise);}.bulma.bg-blue{background-color: var(--bulma-blue);}.bulma.bg-cyan{background-color: var(--bulma-cyan);}.bulma.bg-green{background-color: var(--bulma-green);}.bulma.bg-yellow{background-color: var(--bulma-yellow);}.bulma.bg-red{background-color: var(--bulma-red);}.bulma.bg-primary{background-color: var(--bulma-primary);}.bulma.bg-link{background-color: var(--bulma-link);}.bulma.bg-info{background-color: var(--bulma-info);}.bulma.bg-success{background-color: var(--bulma-success);}.bulma.bg-warning{background-color: var(--bulma-warning);}.bulma.bg-danger{background-color: var(--bulma-danger);}.bulma.bg-black-bis{background-color: var(--bulma-black-bis);}.bulma.bg-black-ter{background-color: var(--bulma-black-ter);}.bulma.bg-grey-darker{background-color: var(--bulma-grey-darker);}.bulma.bg-grey-dark{background-color: var(--bulma-grey-dark);}.bulma.bg-grey-light{background-color: var(--bulma-grey-light);}.bulma.bg-grey-lighter{background-color: var(--bulma-grey-lighter);}.bulma.bg-white-ter{background-color: var(--bulma-white-ter);}.bulma.bg-white-bis{background-color: var(--bulma-white-bis);}.bulma.text-white{color: var(--bulma-white);}.bulma.text-black{color: var(--bulma-black);}.bulma.text-light{color: var(--bulma-light);}.bulma.text-dark{color: var(--bulma-dark);}.bulma.text-turquoise{color: var(--bulma-turquoise);}.bulma.text-blue{color: var(--bulma-blue);}.bulma.text-cyan{color: var(--bulma-cyan);}.bulma.text-green{color: var(--bulma-green);}.bulma.text-yellow{color: var(--bulma-yellow);}.bulma.text-red{color: var(--bulma-red);}.bulma.text-primary{color: var(--bulma-primary);}.bulma.text-link{color: var(--bulma-link);}.bulma.text-info{color: var(--bulma-info);}.bulma.text-success{color: var(--bulma-success);}.bulma.text-warning{color: var(--bulma-warning);}.bulma.text-danger{color: var(--bulma-danger);}.bulma.text-black-bis{color: var(--bulma-black-bis);}.bulma.text-black-ter{color: var(--bulma-black-ter);}.bulma.text-grey-darker{color: var(--bulma-grey-darker);}.bulma.text-grey-dark{color: var(--bulma-grey-dark);}.bulma.text-grey-light{color: var(--bulma-grey-light);}.bulma.text-grey-lighter{color: var(--bulma-grey-lighter);}.bulma.text-white-ter{color: var(--bulma-white-ter);}.bulma.text-white-bis{color: var(--bulma-white-bis);}.gm-button.ui.button:not(.mini):not(.tiny):not(.small):not(.medium):not(.large):not(.big):not(.huge):not(.massive){margin: 0 4px; min-width: 96px;line-height: 1.2;}.gm-button.ui.button{cursor: pointer;}.gm-dialog, .gm-dialog dialog, .gm-dialog dialog > *{padding:0;margin:0;position:relative; box-sizing: border-box;}.overlay{position: fixed; top:0;left:0; right:0; bottom:0;z-index: 2147483647; background-color: rgba(0, 0, 0, 0.45);}.gm-dialog dialog {position: absolute; top:10%; left: 15%;overflow: hidden;min-width: 256px; width: 60%;background-color: #FFF; border: none;}.gm-dialog dialog > header,.gm-dialog dialog > footer{min-height: 64px;padding: 12px;clear:both;background-color: rgba(0,0,0,.03);}.gm-dialog dialog > footer{text-align: right;}.gm-dialog dialog > header > h1{font-size: 24px;font-weight: normal;text-decoration: none;margin:0;padding:4px 0 0 12px;}.gm-dialog dialog > header > [data-name="close"]{position:absolute;right:12px;top:50%; transform: translate(0,-50%);font-size: 20px !important; line-height: 1; padding: 5px 16px 6px;}.gm-dialog dialog > section{min-height: 128px;text-align: center; font-size: 24px; font-weight: normal;overflow-y:scroll;scrollbar-width: none;ms-overflow-style: none;}.gm-dialog dialog > section::-webkit-scrollbar { width: 0; height: 0;}.gm-dialog dialog > header, .gm-dialog dialog > section{border: none;border-bottom:1px solid rgba(0,0,0,.125);}@media (max-height: 640px), (max-width: 950px) {.gm-dialog dialog{left: 6px;right: 6px; top:6px;bottom: 6px;transform: unset;max-height:calc(100% - 12px);width:calc(100% - 12px);}}.flex-center{display: flex !important;align-items: center !important;justify-content: center !important;}.noscroll{overflow: hidden !important;}.gm-list.rounded, .gm-dialog dialog{border-radius: 4px !important;}.screencenter{top: 50% !important;left: 50% !important;right:auto !important;bottom:auto !important;transform: translate(-50%, -50%) !important;position:absolute !important;}.fullscreen{left: 0 !important;right: 0 !important; top:0 !important;bottom: 0 !important;max-height:100% !important;width:100% !important;height:100% !important;transform: unset !important;position: fixed !important;}.gm-dialog .fullscreen{left: 6px !important;right: 6px !important; top:6px !important;bottom: 6px !important;height: auto !important;max-height:calc(100% - 12px) !important;width:calc(100% - 12px) !important;}@keyframes fadeIn {from {opacity: 0;}to {opacity: 1;}}@keyframes fadeOut {from {opacity: 1;}to {opacity: 0;}}.fadeIn {animation-name: fadeIn;animation-duration: .75s;animation-fill-mode: both;}.fadeOut {animation-name: fadeOut;animation-duration: .75s;animation-fill-mode: both;}.gm-dialog *:not(input):not(textarea), .noselect{-webkit-touch-callout: none;-webkit-user-select: none;-moz-user-select: none;user-select: none;}[disabled], .gm-dialog .disabled{pointer-events: none !important;}[hidden], [class*="gm-"].hidden, [class*="gm-"] .hidden, dialog:not([open]){display:none !important;z-index: -1 !important;}';


    function load(){
        if (ready === true) return;
        ready = true;
        [reset, pure, semantic, ui].forEach(s => addstyle(s));
    }

    return load;
}));

/**
 * Module gmUI
 */
(function(root, factory){
    /* globals define, require, module, self, innerWidth */
    const dependencies = ["gmtools", "gmfind", "gmdata", "gmstyles"];
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
        root["gmUI"] = factory(...dependencies.map(dep => require(dep)));/*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function(gmtools, gmfind, gmdata, gmStyles, undef, doc = document){

    const {NodeFinder, ResizeSensor, isValidSelector} = gmfind;
    const {trigger, isPlainObject, html2element, loadcss, Events, uniqid, GMinfo, u, s, b, f, n} = gmtools;
    const {addstyle} = gmdata;

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

        isManaged(button){
            return button instanceof Element && this.list.some(item => item.element === button);
        }

        constructor(root){
            if (root instanceof Element === false) throw new Error('gmButtons Invalid argument root');
            Object.defineProperties(this, {
                root: {configurable: true, enumerable: false, writable: false, value: root},
                list: {configurable: true, enumerable: false, writable: false, value: []}
            });
            const $this = this;


            /** Button Detection **/
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
                            if (flag === null ? true : flag === false) {
                                this.removeAttribute('disabled');
                                this.classList.remove('disabled');
                            }else this.classList.add('disabled');
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
            gmStyles();

        }
    }



    const gmDialog = (function(){

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
                `<div class="gm-dialog overlay pure">
                    <dialog>
                        <header><h1></h1><span class="gm-button ui button mini" data-name="close">&times;</span></header>
                        <section></section>
                        <footer>
                            <span class="gm-button ui inverted button red" data-name="dismiss">Cancel</span>
                            <span class="gm-button ui inverted button primary" data-name="confirm">OK</span>
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
                            title: $this.overlay.querySelector('dialog > header > h1'),
                            footer: $this.overlay.querySelector('dialog > footer'),
                            body: $this.overlay.querySelector('dialog > section'),
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

                                dialog.classList.remove('fullscreen');
                                if (conf.fullscreen === true) dialog.classList.add('fullscreen');

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
                                    dialog.classList.remove('screencenter');
                                    if (conf.position.center === true ? flag === false : false) dialog.classList.add('screencenter');
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
                                gmStyles();
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
                                $this.container.classList.add('noscroll');
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
                                if (allclosed === true) $this.container.classList.remove('noscroll');
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
                //enable buttons features
                new gmButtons(dialog);

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
                            callback.call($this, $this);
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
                this.elements.body.classList.remove('flex-center');
                if (this.elements.body.children.length === 0) this.elements.body.classList.add('flex-center');
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

            if (!(message instanceof Element) ? (typeof message !== s ? message.length > 0 : false) : false)
                throw new Error("gmFlash invalid message.");
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
                    if (typeof val === s ? val.length > 0 : false) classes.concat(val.split(/\s+/));
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
        }


    }

    /**
     * Userscript Tab Management
     */
    class gmTabs {

        isValidPath(path){
            return typeof path === s ? /^\/?[a-z][\w\-]+(?:\/[a-z][\w\-]+)?$/i.test(path) : false;
        }

        get path(){
            return null;
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
                                if (typeof callback === f) callback();
                                transition.cleanup(el);
                            }, animateDuration + 10);
                            setTimeout(() => {
                                el.style["animation-duration"] = animateDuration + "ms";
                                el.classList.add(...animateClasses);
                            });
                        } else if (typeof callback === f) callback();
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

        }
    }





    return {
        gmButtons: gmButtons,
        gmDialog: gmDialog,
        gmFlash: gmFlash,
        gmTabs: gmTabs
    };
}));




/**
 * AiO Module
 */
(function(root, factory){
    /* globals define, require, module, self */
    const dependencies = ['gmtools', 'gmdata', 'gmfind', 'gmstyles', 'gmui'];
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
        root["gmUtils"] = factory(...dependencies.map(dep => require(dep)));/*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function(...args){
    return Object.assign({version: "1.2.6"}, ...args);
}));