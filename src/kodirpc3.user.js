// ==UserScript==
// @version     3.5
// @name        KodiRPC 3.0
// @description Send Stream URL to Kodi using jsonRPC
// @author      daedelus
// @namespace   https://github.com/ngsoft
// @icon        https://kodi.tv/favicon-32x32.png
// 
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/configurator.min.js
// @require     https://cdn.jsdelivr.net/npm/izitoast@1.4.0/dist/js/iziToast.min.js
// @require     https://cdn.jsdelivr.net/gh/mathiasbynens/utf8.js@v3.0.0/utf8.min.js
// @resource    iziToastCSS https://cdn.jsdelivr.net/npm/izitoast@1.4.0/dist/css/iziToast.min.css
//
// 
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// @grant       GM_unregisterMenuCommand
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @run-at      document-end
//
// @include     *
// ==/UserScript==

/**
 * todo: replace monkeyconfig by https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@master/gm_config.js
 */


(function(undef){
    /* globals 	unsafeWindow, GM_info, GM, self, EventTarget, iziToast, MonkeyConfig, utf8, URLSearchParams, jwplayer */
    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */
    /* jshint sub:true */


    const

            // Scallar types
            string = "string",
            bool = "boolean",
            object = "object",
            number = "number",
            int = 'int',
            float = 'float',
            array = 'array',
            s = string,
            b = bool,
            f = "function",
            o = object,
            u = "undefined",
            n = number,

            //time
            second = 1000,
            minute = 60 * second,
            hour = minute * 60,
            day = hour * 24,
            week = day * 7,
            year = 365 * day,
            month = Math.round(year / 12),
            global = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window),
            doc = global.document,
            // GMInfo
            GMinfo = (typeof GM_info !== 'undefined' ? GM_info : (typeof GM === 'object' && GM !== null && typeof GM.info === 'object' ? GM.info : null)),
            scriptname = GMinfo ? `${GMinfo.script.name} @${GMinfo.script.version}` : "",
            UUID = GMinfo ? GMinfo.script.uuid : "",
            utils = {},
            // youtube desktop_polymer.js overrides the originals so we export them before the script loads
            parseJson = JSON.parse,
            stringify = JSON.stringify;

    // Pass sandboxed functions into the module GM
    [
        'GM_setValue',
        'GM_getValue',
        'GM_deleteValue',
        'GM_listValues',
        'GM_addValueChangeListener',
        'GM_removeValueChangeListener',
        'GM_registerMenuCommand',
        'GM_unregisterMenuCommand',
        'GM_getResourceText',
        'GM_getResourceURL',
        'GM_xmlhttpRequest',
        'GM_download',
        'GM_log',
        'GM_openInTab',
        'GM_getTab',
        'GM_saveTab',
        'GM_getTabs',
        'GM_addStyle',
        'GM_notification',
        'GM_setClipboard'
    ].forEach(v => utils[v] = self[v]);



    /**
     * Test if given argument is a plain object
     * @param {any} v
     * @returns {Boolean}
     */
    function isPlainObject(v){
        return v instanceof Object && Object.getPrototypeOf(v) === Object.prototype;
    }


    /**
     * Generate a unique ID
     * @returns {String}
     */
    function uniqid(){
        return  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }


    /**
     * Sanitize a given filename
     * @param {string} input
     * @param {string} replacement
     * @returns {string}
     */
    function sanitizeFileName(input, replacement){
        replacement = typeof replacement === s ? replacement : "";
        
        if (typeof input === s) {
            // using utf8 encoder to remove invalid characters
            input = utf8.encode(input);
            return input
                    .replace(/[\/\?<>\\:\*\|":\'\`\’]/g, replacement)
                    .replace(/[\x00-\x1f\x80-\x9f]/g, replacement)
                    .replace(/^\.+$/, replacement)
                    //.replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, replacement)
                    .replace(/[\. ]+$/, replacement)
                    .substring(0, 255);
        }

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
     * Load events not triggered in certains browsers
     *
     * @param {function} callback
     * @returns {Promise}
     */
    on.loaded = function(){
        return new Promise(resolve => {

            const worker = () => {
                if (doc.readyState !== "complete") {
                    setTimeout(() => {
                        worker();
                    }, 100);
                } else resolve(doc.body);
            };

            worker();
        });
    };




    /**
     * Defines an Interface
     */
    class Iface {

        get __ABSTRACT(){
            return [];
        }

        constructor(){

            let
                    name = this.constructor.name,
                    proto = Object.getPrototypeOf(this),
                    parents = [];

            while (proto instanceof Iface) {
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
                    throw new Error('Iface class ' + iface.constructor.name + ' does not declare methods that are not abstract (do you need to make it an interface?).');
                }

                parents.forEach(proto => {
                    Object.keys(Object.getOwnPropertyDescriptors(proto)).forEach(method => {
                        if (typeof proto[method] === f && methods.includes(method)) {

                            if (iface[method].length !== proto[method].length) {
                                throw new Error(`Iface ${iface.constructor.name}.${method}() expects ${iface[method].length} parameters, ${proto[method].length} given in ${proto.constructor.name}.${method}()`);
                            }
                            declared.push(method);
                        }
                    });
                });
                if (methods.length > declared.length) {
                    throw new Error('class ' + name + ' does not declare ' + methods.filter(m => declared.includes(m) === false).join('(), ') + '().');
                }
            } else throw new Error('Iface ' + name + ' cannot be instanciated.');
        }
    }


    /**
     * DataStore Interface
     * @type {Class}
     */
    class DataStore extends Iface {
        constructor(){
            super();
        }
        /**
         * Gets a value from the storage
         * @param {string|undefined} key if not using key all the storage will be returned
         * @returns {any}
         */
        get(key){ }
        /**
         * Adds a value to the storage
         * @param {string|Object} key storage key or key/value pair
         * @param {any} [val]
         * @returns {DataStore}
         */
        set(key, val){ }
        /**
         * Checks if storage has a value for the given key
         * @param {string} key
         * @returns {Boolean}
         */
        has(key){ }
        /**
         * Remove a value from the storage
         * @param {string} key
         * @returns {DataStore}
         */
        remove(key){ }
        /**
         * Empty the storage
         * @returns {DataStore}
         */
        clear(){ }
    }


    /**
     * Store data into GreaseMonkey 3 or Tampermonkey
     * @type {Class}
     * @extends {DataStore}
     */
    class gmStore extends DataStore {
        constructor(){
            super();
            const errors = ["GM_getValue", "GM_setValue", "GM_deleteValue", "GM_listValues"].filter(x => typeof utils[x] !== f);
            if (errors.length > 0) throw new Error('gmStore:  %s are not available.'.replace('%s', errors.join(', ')));
        }
        get(key){
            let retval;
            if (typeof key === s) retval = utils.GM_getValue(key);
            else if (typeof key === u) {
                retval = {};
                utils.GM_listValues().forEach(key => retval[key] = this.get(key));
            }
            return retval;

        }
        set(key, val){
            if (typeof key === s && typeof val !== u) utils.GM_setValue(key, val);
            else if (isPlainObject(key)) Object.keys(key).forEach(k => this.set(k, key[k]));
            return this;
        }
        has(key){
            return utils.GM_listValues().includes(key);
        }
        remove(key){
            if (typeof key === s) utils.GM_deleteValue(key);
            return this;
        }
        clear(){
            utils.GM_listValues().forEach(key => this.remove(key));
            return this;
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

            if (!target.hasOwnProperty('__Events__')) {
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

        throw new Error('Invalid argument target.');

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
     * Build a RPC Request
     * @param {string} method
     * @param {object} params
     * @param {int} id
     * @returns {string|undefined}
     */
    function RPCRequest(method, params, id){
        params = params || {};
        if (typeof method === s && isPlainObject(params)) {
            return stringify({
                jsonrpc: '2.0',
                method: method,
                params: params,
                id: typeof id === n ? id : Math.floor(Math.random() * (99 - 1) + 1)
            });
        }
    };




    class Settings {

        get servers(){
            let servers = this._config.get('servers') || [];

            if (servers.length == 0) {
                let server = new Server();
                this.saveServer(server);
                servers = this._config.get('servers');
            }
            return  servers.map(id => {
                if (this._config.has(id)) return new Server(this._config.get(id));
                return new Server();
            });
        }

        get server(){
            return this.servers[0];
        }


        get clients(){
            return this.servers.map(s => new Client(s));
        }


        saveServer(server){
            if (!(server instanceof Server)) server = new Server();
                let
                    id = server.id,
                    servers = this._config.get('servers') || [];

            if (!servers.includes(id)) servers.push(id);
            this._config.set('servers', servers);
            this._config.set(id, server._params);
        }

        removeServer(server){
            if (server instanceof Server) {
                let
                        servers = this._config.get('servers') || [],
                        index = servers.indexOf(server.id);
                this._config.remove(server.id);
                if (index > -1) servers.splice(index, 1);
                this._config.set('servers', servers);
            }
        }


        constructor(){
            this._config = new gmStore();
        }
    }





    /**
     * A Kodi RPC Server Config
     */
    class Server {

        constructor(data){

            this._params = {
                name: 'localhost',
                host: "127.0.0.1",
                port: 8080,
                pathname: '/jsonrpc',
                user: null,
                auth: null,
                id: uniqid(),
                enabled: true
            };
            if (isPlainObject(data)) Object.assign(this._params, data);
        }

        dirty(){
            return this._dirty === true;
        }

        set enabled(flag){
            if (typeof flag === b) {
                this._params.enabled = flag;
                this.dirty = true;
            }

        }

        set name(name){
            if (typeof name === s && name.length > 0) {
                this._params.name = name;
                this._dirty = true;
            }
        }

        set host(host){
            if (typeof host === s && host.length > 0) {
                this._params.host = host;
                this._dirty = true;
            }
        }


        set pathname(pathname){
            if (typeof pathname !== s) return;

            if (/^\//.test(pathname)) {
                this._params.pathname = pathname;
                this._dirty = true;
            }
        }

        set user(user){
            if (user === null) {
                this._params.user = this._params.auth = null;
                this._dirty = true;
                return;
            }
            if (typeof user !== s) return;
            this._params.user = user.length > 0 ? user : null;

        }
        set port(port){
            if (typeof port !== n) return;
            if ((port > 0) && (port < 65536)) {
                this._params.port = port;
                this._dirty = true;
            }
        }
        set auth(pass){
            if ((typeof pass === s ? pass.length > 0 : false) && (this.user !== null)) {
                this._params.auth = btoa(this.user + ':' + pass);
                this._dirty = true;
                return;
            }
            this.user = null;
        }

        get enabled(){
            return this._params.enabled !== false;
        }

        get name(){
            return this._params.name;
        }
        get host(){
            return this._params.host;
        }

        get pathname(){
            return this._params.pathname;
        }

        get user(){
            return this._params.user;
        }
        get port(){
            return this._params.port;
        }
        get auth(){
            return this._params.auth;
        }
        get id(){
            return this._params.id;
        }
        get address(){
            return  new URL('http://' + this.host + ':' + this.port + this.pathname);
        }
        get headers(){
            const headers = {
                "Content-Type": "application/json"
            };
            if (typeof this._params.auth === s) headers["Authorization"] = 'Basic ' + this._params.auth;
            return headers;
        }

        get client(){
            if (!(this._client instanceof Client)) this._client = new Client(this);
            return this._client;
        }


        send(method, params){
            const that = this;
            return new Promise((resolve, reject) => {
                let data = RPCRequest(method, params);
                if (data === undef) reject();
                utils.GM_xmlhttpRequest({
                    method: 'POST',
                    url: that.address,
                    data: data,
                    headers: that.headers,
                    onload(xhr){
                        if (xhr.status === 200) resolve(parseJson(xhr.response));
                        else reject();
                    },
                    onerror(){
                        reject();
                    }
                });
            });

        }



    }


    // From Kassi Share Firefox Extension
    // @link https://raw.githubusercontent.com/goldenratio/youtube-to-XBMC/master/src/js/background_scripts/player.js
    class Client
    {
        /**
         * @param kodiConf {KodiConfig}
         */
        constructor(server){
            if (server instanceof Server) this.server = server;
            else throw new Error('Invalid Server');
        }

        clearPlaylist(){
            const params = {
                playlistid: 1
            };

            return this.server.send("Playlist.Clear", params);
        }

        addToPlaylist(file){
            const params = {
                playlistid: 1,
                item: {
                    file: file
                }
            };
            return this.server.send("Playlist.Add", params);
        }

        playFromPlaylist(position = 0){
            const params = {
                item: {
                    playlistid: 1,
                    position: position
                }
            };

            return this.server.send("Player.Open", params);
        }

        getActivePlayers(){
            const params = {};
            return this.server.send("Player.GetActivePlayers", params);
        }

        getPluginVersion(pluginId){

            const params = {
                addonid: pluginId,
                "properties": ["version"]
            };

            return this.server.send("Addons.GetAddonDetails", params);
        }

        queue(file){
            return new Promise((resolve, reject) => {

                if (!file)
                {
                    reject();
                    return;
                }

                this.addToPlaylist(file)
                        .then(response => {

                            const result = response.result;
                            if (result == 'OK') {
                                return this.getActivePlayers();
                            }
                            return reject();
                        })
                        .then(response => {

                            const result = response.result;
                            // check if no video is playing and start the first video in queue
                            if (result && result.length <= 0) {
                                return this.playFromPlaylist();
                            }
                        })
                        .then(response => {
                            resolve(response);
                        })
                        .catch(() => {
                            reject();
                        });

            });

        }


        ping(){
            return this.server.send("JSONRPC.Ping");
        }




        playVideo(file){
            return new Promise((resolve, reject) => {
                this.clearPlaylist()
                        .then(response => {
                            return this.addToPlaylist(file);
                        })
                        .then(response => {
                            return this.playFromPlaylist();
                        })
                        .then(response => {
                            resolve(response);
                        }).catch(() => {
                    reject();
                });

            });
        }


        queueVideo(file){
            return new Promise((resolve, reject) => {

                this.getActivePlayers()
                        .then(response => {

                            const result = response.result;
                            if (result && result.length <= 0)
                            {
                                return this.clearPlaylist();
                            }
                        })
                        .then(response => {
                            return this.queue(file);
                        })
                        .then(response => {

                            resolve(response);
                        })
                        .catch(() => {

                            reject();
                        });

            });

        }

        directPlay(file){
            return this.server.send("Player.Open", {
                item: {
                    file: file
                }
            });
        }

        directPlayOrQueueVideo(file){

            return new Promise((resolve, reject) => {

                if (!file) {
                    reject();
                    return;
                }

                this.getActivePlayers()
                        .then(response => {
                            const result = response.result;
                            if (result && result.length <= 0) {
                                this
                                        .directPlay(file)
                                        .then(response => {
                                            if (response.result == 'OK') {
                                                resolve(response);
                                            }
                                            reject();
                                        })
                                        .catch(() => {
                                            reject();
                                        });
                            } else {
                                this.queue(file)
                                        .then(response => {
                                            resolve(response);
                                        })
                                        .catch(() => {
                                            reject();
                                        });
                            }
                        })
                        .catch(() => {
                            reject();
                        });

            });



        }

        send(link, success, error){
            if (typeof link === s) {
                this
                        .directPlayOrQueueVideo(link)
                        .then(response => {
                            if (typeof success === f) success.call(this, this);
                        })
                        .catch(() => {
                            if (typeof error === f) error.call(this, this);

                        });
            }

        }
    }



    /**
     * Manages GM_registerMenuCommand, GM_unregisterMenuCommand
     */
    class ContextMenu {

        static add(desc, callback, name){

            this.commands = this.commands || {};

            if (typeof name === u) name = uniqid();

            if (typeof desc === s && typeof callback === f) {
                // reserve id
                let command = {
                    name: name,
                    description: desc,
                    callback: callback
                };
                command.id = utils.GM_registerMenuCommand(desc, callback);
                this.commands[name] = command;
            }

            return this;


        }
        
        static remove(name){
            this.commands = this.commands || {};
            let id ;
            if(typeof name === n){
                Object.keys(this.commands).forEach(key => {
                    if (this.commands[key].id == name) name = this.commands[key].name;
                });
            }
            if (
                    (typeof name === s) &&
                    (id = typeof this.commands[name] !== u ? this.commands[name].id : undef)
                    ) {
                utils.GM_unregisterMenuCommand(id);
                delete this.commands[name];

            }

            return this;
        }


        static clear(){
            let list = Object.keys(this.commands);
            list.forEach(key => this.remove(key));

        }


    }





    class Notify {

        static load(){
            return new Promise(resolve=>{
                if (this.loaded !== true) {
                    utils.GM_addStyle(utils.GM_getResourceText('iziToastCSS') + `.iziToast-wrapper {z-index: 2147483647 !important;} .iziToast-wrapper-bottomRight{top: 40% !important;bottom: auto !important;}`);
                    this.loaded = true;
                }
                resolve(iziToast);
            });
        }


        static notice(message, title = ''){


            this.load().then(iziToast => {
                iziToast.info({
                    title: title,
                    message: message
                });
            });

        }


        static success(message, title = ''){
            
            this.load().then(iziToast=>{
                iziToast.success({
                    title: title,
                    message: message
                });
            });

        }
        
        static error(message, title = ''){
            this.load().then(iziToast => {
                iziToast.error({
                    title: title,
                    message: message
                });
            });
        }
    }



    class Configurator {

        static get hidden(){
            return this._open !== true;
        }


        static open(server){
            if (!this.hidden) return;

            const settings = new Settings();
            if (!(server instanceof Server)) server = settings.server;
            this._open = true;

            const cfg = new MonkeyConfig({
                title: GM_info.script.name,
                buttons: ['check', 'save', 'cancel'],
                params: {
                    id: {
                        type: 'hidden',
                        default: server.id
                    },
                    name: {
                        type: 'text',
                        default: server.name
                    },
                    host: {
                        type: 'text',
                        default: server.host
                    },
                    user: {
                        type: 'text',
                        default: server.user || ''
                    },
                    password: {
                        type: 'password',
                        default: ''
                    }
                },
                onSave(values){
                    ['name', 'host', 'user'].forEach(key => server[key] = values[key]);
                    server.auth = values.password;

                    settings.saveServer(server);
                    //check connection
                    server.client
                            .ping()
                            .then(() => {
                                Notify.success('Connection to ' + server.name + ' Success');

                            })
                            .catch(() => {
                                Notify.error('Connection to ' + server.name + ' Error');
                            });
                }




            });
            cfg.on('close', () => {
                this._open = false;
            });
            cfg.open();

        }

    }



    class KodiRPC {

        static send(url, success, error){

            if (typeof url !== s) throw new Error('invalid url');
            success = typeof success === f ? success : client => {
                Notify.success('Link sent to ' + client.server.name);
            };
            error = typeof error === f ? error : client => {
                Notify.error('Error ' + client.server.name);
                };

            (new Settings()).servers.forEach(server => {
                if (server.enabled) {
                    server.client.send(url, success, error);
                }
            });
        }

        static action(url){
            return () => {
                this.send(url);
            };
        }




    }


    /**
     * Interface for Kodi Plugin
     */
    class KodiPlugin extends Iface {

        get __ABSTRACT(){
            return ['send', 'setParam', 'addMenuEntry'];
        }

        send(){

            (new Settings()).servers.forEach(server => {
                server.client.getPluginVersion(this.identifier())
                        .then(response => {
                            if (!response.error) {
                                server.client.send(this.url.href, () => {
                                    Notify.success('Video sent to ' + server.name, this.name());

                                },
                                        () => {
                                    Notify.error('Error ' + server.name);
                                });

                            } else Notify.error('Plugin not installed on ' + server.name, this.name());
                        })
                        .catch(console.error);
            });
        }

        setParam(key, value){

            if (
                    (typeof key === s) &&
                    (typeof value === s)
                    ) {
                this.url.searchParams.set(key, value);
            }
            return this;
        }

        addMenuEntry(){

            let title = '';

            this.tags.forEach(t => {
                title += '[' + t.toUpperCase() + ']';
            });

            title += ' Send Video ';
            title += this.description();

            ContextMenu.add(title, () => {
                this.send();
            }, this.identifier() + '.' + this.description());
        }


        /**
         * @returns {String}
         */
        identifier(){}
        /**
         * @returns {String}
         */
        name(){}
        /**
         * @returns {String}
         */
        description(){}

        constructor(){
            super();
            this.url = new URL('plugin://' + this.identifier() + '/');
            this.tags = [];
            this.tags.push(this.name());
        }
    }







    /**
     * Copy url to clipboard
     */
    class Clipboard extends KodiPlugin {
        send(){
            utils.GM_setClipboard(this.url.href);
            Notify.success('Link copied to clipboard', this.name());
        }


        addMenuEntry(){
            if (typeof this.id !== n) this.id = 0;
            this.id++;

            let title = '';

            this.tags.forEach(t => {
                title += '[' + t.toUpperCase() + ']';
            });

            title += ' Copy link ';
            title += this.description();

            ContextMenu.add(title, () => {
                this.send();
            }, this.identifier() + '.' + this.id);
        }

        identifier(){
            return 'clip';
        }

        name(){
            return 'CLIPBOARD';
        }

        description(){
            return this.desc || '';
        }

        constructor(url, desc, tags){
            super();
            this.desc = desc;
            if (url instanceof URL) url = url.href;
            if (typeof url !== s) throw new Error('Invalid url');
            this.url = new URL(url);
            if (Array.isArray(tags)) tags.forEach(t => this.tags.push(t));
            this.addMenuEntry();
        }


    }
    
    
    /**
     * Legacy Kodi RPC Send
     */
    class Kodi extends KodiPlugin {

        send(){

            (new Settings()).servers.forEach(server => {
                server.client.ping()
                        .then(response => {
                            if (!response.error) {
                                server.client.send(this.url.href, () => {
                                    Notify.success('Video sent to ' + server.name);

                                },
                                        () => {
                                    Notify.error('Error ' + server.name);
                                });

                            } else Notify.error('Error ' + server.name);
                        })
                        .catch(console.error);
            });
        }


        addMenuEntry(){
            if (typeof Kodi.id !== n) Kodi.id = 0;
            Kodi.id++;

            let title = '';

            this.tags.forEach(t => {
                title += '[' + t.toUpperCase() + ']';
            });

            title += ' Send Video ';
            title += this.description();

            ContextMenu.add(title, () => {
                this.send();
            }, this.identifier() + '.' + Kodi.id);
        }

        identifier(){
            return 'kodi';
        }

        name(){
            return 'Kodi';
        }

        description(){
            return this.desc || '';
        }

        constructor(url, desc, tags){
            super();
            this.desc = desc;

            if (typeof url !== s) throw new Error('Invalid url');
            this.url = new URL(url);
            if (Array.isArray(tags)) tags.forEach(t => this.tags.push(t));
            this.addMenuEntry();
        }


    }



    /**
     * Youtube kodi plugin
     */
    class Youtube extends KodiPlugin {
        identifier(){
            return 'plugin.video.youtube';
        }
        name(){
            return 'YOUTUBE';
        }

        description(){
            return this.xid;
        }

        constructor(xid){
            super();
            if (typeof xid !== s) throw new Error('Invalid xid');
            this
                    .setParam('action', 'play_video')
                    .setParam('videoid', xid);

            this.xid = xid;
            this.addMenuEntry();
            YoutubeAPI.AddMenuEntry(xid);
        }
    }




    /**
     * Dailymotion Kodi Plugin
     */
    class Dailymotion extends KodiPlugin {
        identifier(){
            return 'plugin.video.dailymotion_com';
        }
        name(){
            return 'DAILYMOTION';
        }
        description(){
            return this.xid;
        }

        constructor(xid){
            super();
            if (typeof xid !== s) throw new Error('Invalid xid');
            this
                    .setParam('mode', 'playVideo')
                    .setParam('url', xid);
            this.xid = xid;
            this.addMenuEntry();
        }
    }


    /**
     * Crunchyroll Kodi Plugin
     */
    class Crunchyroll extends KodiPlugin {
        identifier(){
            return 'plugin.video.crunchyroll';
        }
        name(){
            return 'CRUNCHYROLL';
        }

        description(){
            return this.xid;
        }

        constructor(xid){
            super();
            if (typeof xid !== s) throw new Error('Invalid xid');
            this
                    .setParam('mode', 'videoplay')
                    .setParam('episode_id', xid);
            this.xid = xid;
            this.addMenuEntry();
        }
    }

    /**
     * Kodi Plugin created by me (can load subtitle tracks)
     */
    class RPCStream extends KodiPlugin {
        identifier(){
            return 'plugin.video.rpcstream';
        }
        name(){
            return 'RPCSTREAM';
        }

        description(){
            return this.desc;
        }

        tags(){
            return this._tags || [];
        }

        constructor(url, subs, description, params, menu = true){
            super();
            let title = doc.title;
            if (
                    title.length < 1 &&
                    window.frameElement &&
                    window.frameElement.ownerDocument
                    ) {
                title = window.frameElement.ownerDocument.title;
            }

            if (url instanceof URL) url = url.href;

            params = Object.assign({
                title: title,
                referer: location.origin + location.pathname,
                useragent: navigator.userAgent,
                url: url
            }, params || {});

            // some titles can break the json, so we encode it (plugin detects if encoded)
            params.title = btoa(sanitizeFileName(params.title, ' ').replace(/\s+/, ' '));

            if (typeof subs === s) {
                params.subtitles = subs;
            }
            this.setParam('request', btoa(stringify(params)));
            if (typeof params.mode === n) this.setParam('mode', '' + params.mode);//needs a string

            if (isPlainObject(description)) {
                if (Array.isArray(description.tags)) description.tags.forEach(t => this.tags.push(t));
                description = description.desc;
            }


            if (typeof description === s) {
                this.desc = description;
            } else this.desc = '';

            if (menu === true) this.addMenuEntry();

        }
    }

    // Extractors



    class FetchAPI {
        fetch(url, headers){

            return new Promise((resolve, reject) => {

                if (url instanceof URL) url = url.href;
                if (!/^http/.test(typeof url === string ? url : '')) {
                    reject(new Error('Invalid URL provided.'));
                    return;
                }

                headers = isPlainObject(headers) ? headers : {};

                utils.GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    headers: headers,
                    onload(xhr){
                        if (xhr.status !== 200) reject(new Error('Invalid status code: ' + url + ': ' + xhr.status));
                        else resolve(xhr.response);

                    },
                    onerror(){
                        reject(new Error('Cannot fetch ' + url));
                    }
                });
            });
        }



        fetchJSON(url, headers){

            headers = isPlainObject(headers) ? headers : {};
            headers = Object.assign({
                'Accept': 'application/json, text/plain, */*'
            }, headers);
            return  this.fetch(url, headers)
                    .then(text => parseJson(text));
        }


        post(url, data, headers){
            return new Promise((resolve, reject) => {

                if (url instanceof URL) url = url.href;
                if (!/^http/.test(typeof url === string ? url : '')) {
                    reject(new Error('Invalid URL provided.'));
                    return;
                }
                headers = isPlainObject(headers) ? headers : {};
                headers = Object.assign({"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"}, headers);

                data = data || '';

                if (isPlainObject(data)) {
                    const sp = new URLSearchParams();

                    Object.keys(data).forEach(key => {
                        sp.set(key, data[key]);
                    });

                    data = sp.toString();
                }

                if (typeof data !== string) {
                    reject(new Error('Invalid post  data.'));
                    return;
                }


                utils.GM_xmlhttpRequest({
                    method: 'POST',
                    url: url,
                    data: data,
                    headers: headers,
                    onload(xhr){
                        if (xhr.status !== 200) reject(new Error('Invalid status code: ' + url + ': ' + xhr.status));
                        else resolve(xhr.response);
                    },
                    onerror(){
                        reject(new Error('Cannot fetch ' + url));
                    }
                });
            });
        }




    }



    /**
     * Youtube API is too complex (api key, number of requests)
     * so we use another api
     * and this api can be used with other websites
     */
    class DownSubAPI extends FetchAPI {

        /**
         * Get Subtitles
         */
        getSubtitles(url){

            return new Promise((resolve, reject) => {
                if (url instanceof URL) url = url.href;

                if (typeof url !== string) throw new Error('Invalid url');

                this.getSubContext(url)
                        .then(context => {
                            this.fetchJSON('https://get-info.downsub.com/' + context, Object.assign({}, this.headers))
                                    .then(obj => {
                                        if (Array.isArray(obj.subtitles)) {

                                            const result = {};
                                            obj.subtitles.forEach(sub => {
                                                let url = new URL(obj.urlSubtitle);
                                                url.searchParams.set('title', obj.title);
                                                url.searchParams.set('url', sub.url);
                                                result[sub.code] = url.href;
                                            });
                                            resolve(result);
                                        } else reject(new Error('Cannot fetch subtitle data.'));

                                    })
                                    .catch(err => reject(err));
                        });
            });
        }



        /**
         * loads the search page and get the context constant
         */
        getSubContext(url){
            return new Promise((resolve, reject) => {
                
                const fetchUrl = new URL('https://downsub.com/');

                fetchUrl.searchParams.set('url', url);

                this
                        .fetch(fetchUrl, Object.assign({}, this.headers))
                        .then(html => {
                            let matches, obj;
                            if ((matches = /const\ context=\'(.*?)\';/i.exec(html)) !== null) {
                                if (obj = parseJson(atob(matches[1]))) {
                                    resolve(obj.id);
                                    return;
                                }
                            }
                            reject(new Error('Cannot parse context.'));
                        })
                        .catch(error => reject(error));
            });
        }
        constructor(){
            super();
            this.headers = {
                Origin: 'https://downsub.com',
                Referer: 'https://downsub.com/'
            };
        }
    }

    class Youtube5sAPI extends FetchAPI {

        getVideo(url){
            return new Promise((resolve, reject) => {
                if (url instanceof URL) url = url.href;
                if (typeof url !== string) throw new Error('Invalid url');
                this
                        .getVideoLink(url)
                        .then(data => resolve(data))
                        .catch(err => reject(err));
            });



        }


        getAjaxSeach(url){
            return new Promise((resolve, reject) => {
                if (url instanceof URL) url = url.href;

                if (typeof url !== string) throw new Error('Invalid url');
                this
                        .post('https://yt5s.com/api/ajaxSearch', {q: url, vt: 'home'}, Object.assign({}, this.headers))
                        .then(json => {
                            let obj = parseJson(json);
                            if (!obj.error) resolve(obj);
                            else reject(new Error(obj.error));
                        })
                        .catch(err => reject(err));
            });
        }


        getVideoLink(url){
            return new Promise((resolve, reject) => {
                this.getAjaxSeach(url)
                        .then(obj => {
                            const qualities = [
                                '720p',
                                '1080p',
                                '480p',
                                '360p'
                            ];
                            let fquality;

                            if (obj.links && obj.links.mp4) {
                                for (let i = 0; i < qualities.length; i++) {
                                    Object.keys(obj.links.mp4).forEach(key => {
                                        const data = obj.links.mp4[key];
                                        if (data.q == qualities[i]) {
                                            fquality = fquality || qualities[i];
                                        }
                                    });
                                    if (typeof fquality === string) break;
                                }
                            }

                            if (typeof fquality !== string) {
                                reject(new Error('Cannot find quality for video.'));
                                return;
                            }
                            this.post(
                                    'https://backend.svcenter.xyz/api/convert', {
                                        v_id: obj.vid,
                                        ftype: 'mp4',
                                        fquality: fquality,
                                        token: obj.token,
                                        timeExpire: obj.timeExpires,
                                        client: 'yt5s.com'
                                    }, Object.assign({"X-Requested-Key": "de0cfuirtgf67a"}, this.headers))
                                    .then(json => {
                                        const data = parseJson(json);
                                        if (data.c_server) {

                                            let worker = () => {
                                                this.post(data.c_server + '/api/json/convert', {
                                                    v_id: obj.vid,
                                                    ftype: 'mp4',
                                                    fquality: fquality,
                                                    token: obj.token,
                                                    timeExpire: obj.timeExpires,
                                                    fname: obj.fn
                                                }, Object.assign({}, this.headers))
                                                        .then(jsonString => {
                                                            let serverData = parseJson(jsonString);

                                                            if (typeof serverData.jobID === string) {
                                                                setTimeout(() => {
                                                                    worker();
                                                                }, 200);
                                                                return;
                                                            } else if (
                                                                    serverData.statusCode === 200 &&
                                                                    /^http/.test(serverData.result)
                                                                    ) {

                                                                resolve({
                                                                    url: serverData.result,
                                                                    title: obj.title
                                                                });
                                                                return;

                                                            }
                                                            reject(new Error('Cannot get Video URL.'));
                                                        })
                                                        .catch(err => reject(err));

                                            };
                                            worker();
                                            return;
                                        }
                                        reject(new Error('Cannot get Server.'));
                                    })
                                    .catch(err => reject(err));
                        })
                        .catch(err => reject(err));
            });
        }


        resolveUrl(link){
            return new Promise((resolve, reject) => {


                let iframe = doc.createElement('iframe');

                iframe.onload = () => {
                    resolve(link);

                    doc.body.removeChild(iframe);
                };
                iframe.style.opacity = 0;
                iframe.src = link;


                doc.body.appendChild(iframe);
                
            });
        }

        constructor(){
            super();

            this.headers = {
                Origin: 'https://yt5s.com',
                Referer: 'https://yt5s.com/'
            };
        }

    }



    class YoutubeAPI {

        static AddMenuEntry(xid){
            if (typeof this.id !== n) this.id = 0;
            this.id++;


            ContextMenu.add('[RPCSTREAM][YT5S] Send Video ' + xid, () => {


                Notify.notice('Resolving ' + xid, 'YOUTUBE');
                
                const api = new YoutubeAPI(xid);
                
                
                api.getVideo().then(data => {

                    let
                            title = data.title,
                            url = data.url;

                    api.getSubs().then(obj => {
                        let
                                subs = obj.en || null,
                                rpcstream = new RPCStream(url, subs, xid, {mode: 0, title: title}, false);
                        rpcstream.send();
                    });
                }).catch(err=>{
                    console.error(err);
                    Notify.error('Cannot send video ' + xid, 'YOUTUBE');
                });
            }, 'plugin.video.rpcstream.yt5s.' + this.id);



        }
        
        getSubs(){

            return new Promise((resolve, reject)=>{
                const api = new DownSubAPI();
                api.getSubtitles(this.url)
                    .then(subs => resolve(subs))
                    .catch(err => {
                        console.error(err);
                        resolve([]);
                    });
            });

        }


        getVideo(){
            return new Promise((resolve, reject) => {
                const api = new Youtube5sAPI();
                api.getVideo(this.url)
                        .then(data => resolve(data))
                        .catch(err => reject(err));
            });
        }

        constructor(xid){
            this.xid = xid;
            this.url = new URL('https://www.youtube.com/watch');
            this.url.searchParams.set('v', xid);

        }
    }






    class VimeoEmbedAPI {

        getJson(embedUrl, referer){
            
            return new Promise((resolve, reject)=>{
                if (typeof embedUrl !== s || typeof referer !== s) {
                    reject(new Error('Invalid argument(s)'));
                }


                utils.GM_xmlhttpRequest({
                    method: 'GET',
                    url: embedUrl.trim('/') + '/config',
                    headers: {
                        'Referer': referer
                    },
                    onload(xhr){
                        if (xhr.status === 200) {
                            resolve(parseJson(xhr.response));

                        } else reject(new Error('Cannot get Vimeo data.'));
                    },
                    onerror(){
                        reject(new Error('Cannot get Vimeo data.'));
                    }
                });

            });
        }



        getStreams(embedUrl, referer){
            
            return new Promise((resolve, reject) => {

                this
                        .getJson(embedUrl, referer)
                        .then(jsonObj => {
                            let result = {dash: [], hls: []}, cnt = 0;
                            ['dash', 'hls'].forEach(mode => {
                                if (
                                        jsonObj.request &&
                                        jsonObj.request.files &&
                                        jsonObj.request.files[mode] &&
                                        jsonObj.request.files[mode].cdns
                                        ) {
                                    let obj = jsonObj.request.files[mode].cdns;
                                    Object.keys(obj).forEach(key => {
                                        result[mode].push({
                                            cdn: key.split('_', 2).pop(),
                                            mode: mode,
                                            url: obj[key].url
                                        });
                                        cnt++;
                                    });
                                }


                            });
                            if (cnt === 0) reject(new Error('Cannot get streams.'));
                            else resolve(result);
                        })
                        .catch(error => reject(error));
            });
        }


        constructor(url){
            if (typeof url !== s) throw new Error('Invalid vimeo url');
            let xid = url.trim('/').split('/').pop();

            this.getStreams(url, location.href)
                    .then(result => {

                        result.hls.forEach(entry => {
                            (new RPCStream(entry.url, null,
                                    {
                                        tags: ['vimeo', entry.cdn],
                                        desc: xid
                                    },
                                    {
                                        mode: 0,
                                        title: doc.title
                                    }

                            ));
                        });



                    })
                    .catch(err => {
                        console.error(err);
                    });


        }

    }




    /**
     * Extracted from Python Youtube-dl extractor
     * Dailymotion Kodi addon doesn't supports subtitles and i don't want to rewrite it to break updates.
     */
    class DailymotionAPI {

        getToken(){

            return new Promise((resolve, reject) => {

                if (this.token !== null) {
                    resolve(this.token);
                    return;
                }

                let  data = {
                    'client_id': 'f1a362d288c1b98099c7',
                    'client_secret': 'eea605b96e01c796ff369935357eca920c5da4c5',
                    'grant_type': 'client_credentials'
                }, encoded = new URLSearchParams();
                Object.keys(data).forEach(function(k){
                    encoded.set(k, data[k]);
                });

                utils.GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://graphql.api.dailymotion.com/oauth/token',
                    data: encoded.toString(),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    onload(xhr){
                        if (xhr.status === 200) {
                            let json = parseJson(xhr.response);
                            resolve(this.token = json.access_token);

                        } else reject(new Error('Cannot get Dailymotion access Token.'));
                    },
                    onerror(){
                        reject(new Error('Cannot get Dailymotion access Token.'));
                    }
                });
            });

        }


        getMetadata(xid){

            return new Promise((resolve, reject) => {

                this.getToken().then(token => {

                    let
                            headers = Object.assign({
                                'Authorization': 'Bearer ' + token
                            }, this.headers),
                            url = 'https://www.dailymotion.com/player/metadata/video/' + xid,
                            error = new Error('Cannot get Dailymotion Metadata for ' + xid + '.');


                    utils.GM_xmlhttpRequest({
                        method: 'POST',
                        url: url,
                        headers: headers,
                        data: stringify({app: 'com.dailymotion.neon'}),
                        onload(xhr){
                            if (xhr.status === 200) {
                                let json = parseJson(xhr.response);
                                resolve(json);

                            } else reject(error);
                        },
                        onerror(){
                            reject(error);
                        }
                    });



                });


            });
        }


        getMediaList(metadata){
            const that = this;
            return new Promise((resolve, reject) => {
                if (isPlainObject(metadata)) {

                    if (typeof metadata.qualities !== u) {

                        let result = {};

                        Object.keys(metadata.qualities).forEach(key => {
                            let arr = metadata.qualities[key];
                            if (Array.isArray(arr)) {
                                arr.forEach(obj => {
                                    if (
                                            (typeof obj.type !== u) &&
                                            (typeof obj.url !== u)
                                            ) {
                                        if (obj.type === 'application/x-mpegURL') {
                                            //parse m3u8
                                            that.parseM3U8(obj.url).then(data => {
                                                data.forEach(obj => {

                                                    let key = obj.name + 'p';
                                                    key = key.replace('"', '');
                                                    result[key] = {
                                                        url: obj.url.replace(/\#.*$/, ''),
                                                        resolution: key,
                                                        hls: true
                                                    };

                                                });
                                                if (Object.keys(result).length > 0) {
                                                    resolve(result);
                                                }
                                            });

                                        }
                                    }
                                });
                            }

                        });


                    }

                } else reject(new Error('Invalid Metadata.'));
            });

        }
        getSubtitles(metadata){
            let url = null;
            if (isPlainObject(metadata)) {
                if (
                        (typeof metadata.subtitles !== u) &&
                        (typeof metadata.subtitles.data !== u) &&
                        (typeof metadata.subtitles.data.en !== u) &&
                        (typeof metadata.subtitles.data.en.urls !== u)

                        ) {
                    metadata.subtitles.data.en.urls.forEach(u => url = u);
                }
            }
            return url;
        }

        /**
         * Decodes the M3U8 to get qualities
         */
        parseM3U8(m3u8url){

            let regex = /(#EXT-X-STREAM-INF.*)\n([^#].*)/;

            return new Promise((resolve, reject) => {

                let error = new Error('Cannot get Dailymotion HLS Info');
                utils.GM_xmlhttpRequest({
                    method: 'GET',
                    url: m3u8url,
                    onload(xhr){
                        if (xhr.status === 200) {
                            let text = xhr.response, result = [], matches;

                            while ((matches = regex.exec(text)) !== null) {
                                text = text.replace(matches[0], '');
                                let
                                        line = matches[1].replace('#EXT-X-STREAM-INF:', ''),
                                        data = {};

                                line.split(',').forEach(t => {
                                    let kv = t.split('=');
                                    if (kv.length == 2) {
                                        let key = kv[0].trim(), value = kv[1].replace(/"/, '').trim();
                                        data[key.toLowerCase()] = value;
                                    }
                                });
                                if (Object.keys(data).length > 0) {
                                    data.url = matches[2].trim();
                                    result.push(data);
                                }
                            }
                            if (result.length > 0) {
                                resolve(result);
                                return;
                            }


                        }
                        reject(error);
                    },
                    onerror(){
                        reject(error);
                    }
                });



            });

        }



        constructor(){
            this.token = null;
            this.headers = {
                'Content-Type': 'application/json',
                'Origin': 'https://www.dailymotion.com'
            };

        }




        /**
         * Creates RPCStream menu entry using dailymotion xid
         */
        static rpcstream(xid){


            if (typeof this.id !== n) this.id = 0;
            this.id++;


            ContextMenu.add('[RPCSTREAM][DAILYMOTION] Send Video ' + xid, () => {

                Notify.notice('Resolving ' + xid, 'DAILYMOTION');

                let d = new DailymotionAPI();

                d
                        .getMetadata(xid)
                        .then(meta => {
                            let
                                    subs = d.getSubtitles(meta), link;
                            d
                                    .getMediaList(meta)
                                    .then(list => {
                                        ['480p', '720p', '1080p'].forEach(res => {
                                            if (typeof list[res] !== u) link = list[res].url;
                                        });
                                        if (typeof link !== u) {
                                            (new RPCStream(link, subs, xid, {
                                                mode: 0,
                                                title: meta.title,
                                                referer: 'https://www.dailymotion.com/video/' + xid,
                                                useragent: 'Mozilla/5.0 (Linux; Android 7.1.1; Pixel Build/NMF26O) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.91 Mobile Safari/537.36'
                                            }, false)).send();
                                        } else Notify.error('Cannot send video ' + xid, 'DAILYMOTION');
                                    });
                        })
                        .catch(err => {
                            console.error(err);
                            Notify.error('Cannot send video ' + xid, 'DAILYMOTION');
                        });
            });

        }
    }




    const resolveurl = {
        // from each plugins in script.module.resolveurl
        // script.module.urlresolver is nice too but comes with bloatwares
        patterns: [
            '(?://|\.)(abcvideo\.cc)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(adultswim\.com)/videos/((?!streams)[a-z\-]+/[a-z\-]+)',
            '(?://|\.)(aliez\.me)/(?:(?:player/video\.php\?id=([0-9]+)&s=([A-Za-z0-9]+))|(?:video/([0-9]+)/([A-Za-z0-9]+)))',
            '(?://|\.)(amazon\.com)/clouddrive/share/([0-9a-zA-Z]+)',
            '(?://|\.)(anavids\.com)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(anavids\.com)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)((?:aparat\.cam|wolfstream\.tv))/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(bitchute\.com)/(?:video|embed)/([\w-]+)/',
            '(?://|\.)(brighteon\.com)/(?:embed)?/?([\w-]+)',
            '(?://|\.)(brupload\.net)/([0-9A-Za-z]+)',
            '(?://|\.)(castamp\.com)/embed\.php\?c=(.*?)&',
            '(?://|\.)(cda\.pl)/(?:.\d+x\d+|video)/([0-9a-zA-Z]+)',
            '(?://|\.)(chromecast\.video)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(clicknupload\.(?:com?|me|link|org|cc))/(?:f/)?([0-9A-Za-z]+)',
            '(?://|\.)((?:clipwatching\.com|highstream.tv))/(?:embed-)?(\w+)',
            '(?://|\.)(cloud9\.to)/embed/([0-9a-zA-Z-_]+)',
            '(?://|\.)(cloudb2?\.me)/(?:embed-|emb.html\?)?([0-9a-zA-Z]+)',
            '(?://|\.)(cloud\.mail\.ru)/public/([0-9A-Za-z]+/[^/]+)',
            '(?://|\.)(cos\.tv)/videos/play/([0-9a-zA-Z]+)',
            '(?://|\.)(dailymotion\.com|dai\.ly)(?:/(?:video|embed|sequence|swf)(?:/video)?)?/([0-9a-zA-Z]+)',
            '(?://|\.)(datemule\.(?:co|com))/watch/(?:featured/)?([\w-]+)',
            '(?://|\.)(daxab\.com)/player/([^\n]+)',
            '(?://|\.)(dood(?:stream)?\.(?:com|watch|to|so|cx|la|ws))/(?:d|e)/([0-9a-zA-Z]+)',
            '(?://|\.)(downace\.com)/(?:embed/)?([0-9a-zA-Z]+)',
            '(?://|\.)(easyload\.io)/e/([0-9a-zA-Z]+)',
            '(?://)(.*\.elupload\.com)/(?:embed/)?([0-9a-zA-Z]+)',
            '(?://|\.)((?:entervideo|eplayvid)\.(?:com|net))/(?:watch/)?([0-9a-zA-Z]+)',
            '(?://|\.)(evoload\.io)/(?:e|f|v)/([0-9a-zA-Z]+)',
            '(?://|\.)(facebook\.com)/.+?video_id=([0-9a-zA-Z]+)',
            '(?://|\.)(fastdrive\.io)/([0-9a-zA-Z]+)',
            '(?://|\.)(fastplay\.(?:sx|cc|to))/(?:flash-|embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)((?:fembed|feurl|femax20|24hd|anime789|[fv]cdn|sharinglink|streamm4u|votrefil[em]s?|femoload|asianclub|dailyplanet|[jf]player|mrdhan|there|sexhd|gcloud|mediashore|xstreamcdn|vcdnplay|vidohd|vidsource|viplayer|zidiplay|embedsito|dutrag|youvideos|moviepl|vidcloud|diasfem)\.(?:com|club|io|xyz|pw|net|to|live|me|stream|co|cc|org|ru|tv|fun|info))/(?:v|f)/([a-zA-Z0-9-]+)',
            '(?://|\.)(filepup.(?:net))/(?:play|files)/([0-9a-zA-Z]+)',
            '(?://|\.)(filerio\.in)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(flashx\.(?:tv|to|sx|cc|bz))/(?:embed-|dl\?|embed.php\?c=)?([0-9a-zA-Z]+)',
            '(?://|\.)(gamovideo\.com)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(gofile\.io)\/(?:\\?c=|d/)([0-9a-zA-Z]+)',
            '(?://|\.)(gogo-play\.net)/(?:streaming|embed|load|ajax)\.php\?id=([a-zA-Z0-9]+)',
            '(?://|\.)((?:gomoplayer|tunestream|xvideosharing)\.(?:com|net))/(?:embed-)?([0-9a-zA-Z]+)',
            'https?://(.*?(?:\.googlevideo|\.bp\.blogspot|blogger|(?:plus|drive|get|docs)\.google|google(?:usercontent|drive|apis))\.com)/(.*?(?:videoplayback\?|[\?&]authkey|host/)*.+)',
            '(?://|\.)(gounlimited\.to)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)((?:hdvid|vidhdthe)\.(?:tv|fun|online))/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(holavid\.com)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(hugefiles\.(?:net|cc))/([0-9a-zA-Z/]+)',
            '(?://|\.)(hxload\.(?:to|co|io))/(?:embed/|\\?e=)?([0-9a-zA-Z]+)',
            '(?://|\.)(indavideo\.hu)/(?:player/video|video)/([0-9A-Za-z-_]+)',
            '(?://|\.)(itemfix\.com)/v\?t=([0-9A-Za-z_]+)',
            '(?://|\.)(jetload\.(?:net|tv|to))/(?:[a-zA-Z]/|.*?embed\.php\?u=)?([0-9a-zA-Z]+)',
            '(?://|\.)(k2s\.cc)/(?:file/)?([0-9a-f]+)',
            '(?://|\.)(lbry\.tv|odysee\.com)/(\@[^:\/]+\:[^:\/]+\/[^:\/]+:[0-9a-zA-Z]+)',
            '(?://|\.)(letsupload\.(?:io|org))/([0-9a-zA-Z]+)',
            '(?://|\.)(stream\.lewd\.host)/embed/([0-9a-zA-Z]+)',
            '(?://|\.)(liivideo\.com)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(mail\.ru)/(?:\w+/)?(?:videos/embed/)?(inbox|mail|embed|mailua|list|bk|v)/(?:([^/]+)/[^.]+/)?(\d+)',
            '(?://|\.)(megaup\.net)/([0-9a-zA-Z]+)',
            '(?://|\.)(megogo\.(?:net|ru))/.+?(?:id=|view/)(\d+)',
            '(?://|\.)(mixdrop\.(?:co|to|sx))/(?:f|e)/(\w+)',
            '(?://|\.)(mp4upload\.com)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(my?cloud\.to)/embed/([\S]+)',
            '(?://|\.)(my?stream\.(?:la|to|cloud|xyz|fun|press))/(?:external|embed-|watch/)?([0-9a-zA-Z_]+)',
            '(?://|\.)(myupload\.co)/plugins/mediaplayer/site/_embed.php\?u=([0-9a-zA-Z]+)',
            '(?://|\.)(newtube\.app)/(?:user/\w+|embed)/(\w+)',
            '(?://|\.)(ninjastream\.to)/(?:watch|download)/([0-9a-zA-Z]+)',
            '(?://|\.)(nxload\.com)/(?:v/|embed[-/])?([0-9a-zA-Z]+)',
            '(?://|\.)(ok\.ru|odnoklassniki\.ru)/(?:videoembed|video)/(\d+)',
            '(?://|\.)(onlystream\.tv)/(?:e/)?([0-9a-zA-Z-_/]+)',
            '(?://|\.)(oogly\.io)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(pandafiles\.com)/([0-9a-zA-Z]+)',
            '(?://|\.)(peertube\.uno)/videos/(?:embed|watch)/([0-9a-f-]+)',
            '(?://|\.)(pixeldrain\.com)/(?:u|l)/([0-9a-zA-Z\-]+)',
            '(?://|\.)(pkspeed\.net)/(?:embed-)?([A-Za-z0-9]+)',
            '(?://|\.)(play(?:hd|drive)\.(?:one|xyz))/e/([0-9a-zA-Z]+)',
            '(?://|\.)(playtube\.ws)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(config\.playwire\.com)/(.+?)/(?:zeus|player)\.json',
            '(?://|\.)(cdn\.playwire\.com.+?\d+)/(?:config|embed)/(\d+)',
            '(?://|\.)(putload\.tv|shitmovie\.com)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(rapidgator\.net|rg\.to)/+file/+([a-z0-9]+)(?=[/?#]|$)',
            '(?://|\.)(rumble\.com)/(?:embed/)?([^/\?]+)',
            '(?://|\.)(rutube\.ru)/(?:play/embed/|video/)([0-9a-zA-Z]+)',
            '(?://|\.)(videos\.sapo\.pt)/([0-9a-zA-Z]+)',
            '(?://|\.)(saruch\.co)/(?:embed|video)/([0-9a-zA-Z]+)',
            '(?://|\.)(sendfox\.org)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(sendvid\.com)/([0-9a-zA-Z]+)',
            '(?://|\.)(sibnet\.ru)/(?:shell\.php\?videoid=|.*video)([0-9a-zA-Z]+)',
            '(?://|\.)(speedostream\.com)/(?:embed-)?([^\n]+)',
            '(?://|\.)(speedvideo\.net)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(speedwatch\.io)/(?:plyr|e|play-embed|file)/([0-9a-zA-Z]+)',
            '(?://|\.)(streamable\.com)/(?:s/)?([a-zA-Z0-9]+(?:/[a-zA-Z0-9]+)?)',
            '(?://|\.)(streamani\.net)/(?:streaming|embed|load|ajax)\.php\?id=([a-zA-Z0-9]+)',
            '(?://|\.)(streamingcommunity\.(?:one|xyz|video|vip|work|name|live|tv|space))/watch/(\d+(?:\\?e=)?\d+)',
            '(?://|\.)(streamlare\.com)/(?:e|v)/([0-9A-Za-z]+)',
            '(?://|\.)(streamoupload\.com)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(streamrapid\.ru)/embed-([^\n]+)',
            '(?://|\.)((?:tube|player|cloudemb|stream)?s?b?(?:embed\d?|embedsb\d?|play\d?|video)?\.(?:com|net|org|one))/(?:embed-|e|play|d)?/?([0-9a-zA-Z]+)',
            '(?://|\.)(str(?:eam)?tap?e?\.(?:com|cloud|net|pe))/(?:e|v)/([0-9a-zA-Z]+)',
            '(?://|\.)(streamty\.com)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(streamvid\.co)/player/([0-9a-zA-Z]+)',
            '(?://|\.)(streamwire\.net)/(?:embed-|e/)?([0-9a-zA-Z]+)',
            '(?://|\.)(streamzz?\.(?:cc|vg|to|ws))/([0-9a-zA-Z]+)',
            '(?://|\.)(superitu\.com)/embed/redirector\.php\?id=([0-9a-zA-Z=]+)',
            '(?://|\.)(supervideo\.tv)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(thevid\.(?:net|tv|live))/(?:video|e|v)/([A-Za-z0-9]+)',
            '(?://|\.)(trollvid(?:\.net|\.io)|mp4edge\.com)/(?:embed\.php.file=|embed/|stream/)([0-9a-zA-Z]+)',
            '(?://|\.)(truhd\.xyz)/embed/([0-9a-zA-Z]+)',
            '(?://|\.)(tubitv\.com)/(?:video|embed)/(\d+)',
            '(?://|\.)(tudou\.com)/programs/view/([0-9a-zA-Z]+)',
            '(?://|\.)(tune\.(?:video|pk))/(?:player|video|play)/(?:[\w\.\?]+=)?(\d+)',
            '(?://|\.)(tusfiles\.(?:net|com))/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)((?:hls\.|flow\.)?tvlogy\.to)/(?:embed/|watch\.php\?v=|player/index.php\?data=)?([0-9a-zA-Z/]+)',
            '(?://|\.)(upstream\.to)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(uptobox.com|uptostream.com)/(?:iframe/)?([0-9A-Za-z_]+)',
            '(?://|\.)((?:upvideo|videoloca|makaveli|tnaket|highload)\.(?:to|xyz))/(?:e|v|f)/([0-9a-zA-Z]+)',
            '(?://|\.)(uqload\.com)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(userload\.co)/(?:e|f|embed)/([0-9a-zA-Z]+)',
            '(?://|\.)(userscloud\.com)/(?:embed-|embed/)?([0-9a-zA-Z/]+)',
            '(?://|\.)(veehd\.com)/video/([0-9A-Za-z]+)',
            '(?://|\.)(veoh\.com)/(?:watch/|.+?permalinkId=)?([0-9a-zA-Z/]+)',
            '(?://|\.)(vev\.(?:io|red))/(?:embed/)?([0-9a-zA-Z]+)',
            '(?://|\.)(vidbob\.com)/(?:embed-)?([0-9a-zA-Z-]+)',
            '(?://|\.)((?:v[ie]d[bp][oe]?m|myvii?d|v[ei]dshar[er]?)\.(?:com|net|org))(?::\d+)?/(?:embed[/-])?([A-Za-z0-9]+)',
            '(?://|\.)(vidcloud\.(?:co|pro|is))/(?:embed\d/|v/|player\?fid=)([0-9a-zA-Z?&=]+)',
            '(?://|\.)((?:vidcloud9|vidnode|vidnext|vidembed)\.(?:com|net|cc))/(?:streaming|embedplus|load(?:server)?)(?:\.php)?\?id=([0-9a-zA-Z]+)',
            '(?://|\.)((?:videa|videakid)\.hu)/(?:player/?\?v=|player/v/|videok/)(?:.*-|)([0-9a-zA-Z]+)',
            '(?://|\.)(videoapne\.co)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(thevideobee\.to)/(?:embed-)?([0-9A-Za-z]+)',
            '(?://|\.)(videobin\.co)/(?:embed-|source/)?([0-9a-zA-Z]+)',
            '(?://|\.)(videohost2\.com)/playh\.php\?id=([0-9a-f]+)',
            '(?://|\.)(videomega\.co)/(?:e/)?([0-9a-zA-Z]+)',
            '(?://|\.)(videooo\.news)/(?:embed-)?([^\n]+)',
            '(?://|\.)(videoseyred\.in)/embed/([0-9a-zA-Z]+)',
            '(?://|\.)(videos\.sh)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(videovard\.sx)/[vef]/([0-9a-zA-Z]+)',
            '(?://|\.)(videowood\.tv)/(?:embed/|video/)([0-9a-z]+)',
            '(?://|\.)(videoz\.me)/(?:embed-)?([0-9a-zA-Z]+)',
            /(?:\/\/|\.)(?:play44|playbb|video44|byzoo|playpanda|videozoo|videowing|easyvideo)\.(?:me|org|net|eu)\/(?:embed[/0-9a-zA-Z]*?|gplus|picasa|gogo\/)(?:\.php*)\?.*?((?:vid|video|id|file)=[%0-9a-zA-Z_\-\./]+|.*)[\?&]*.*/,
            '(?://|\.)((?:videozupload|videzup)\.(?:net|pl|top))/video/([0-9a-z]+)',
            '(?://|\.)(vidfast\.co)/(?:embed-)?([a-zA-Z0-9]+)',
            '(?://|\.)(vidia\.tv)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(vidlox\.(?:tv|me|xyz))/(?:embed-|source/)?([0-9a-zA-Z]+)',
            '(?://|\.)(vidmojo\.net)/(?:embed-)?([^\n]+)',
            '(?://|\.)(vidmoly\.(?:me|to|net))/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(vidmx\.xyz)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(vid(?:org|piz)\.(?:net|xyz))/(?:embed[/-])?([0-9A-Za-z]+)',
            '(?://|\.)(vidoza\.(?:net|co))/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(vidspace\.io)/(?:embed-)?([a-zA-Z0-9]+)',
            '(?://|\.)(vidstore\.me)/(.+)',
            '(?://|\.)(vidstreaming\.io)/(?:streaming|embed|load)\.php\?id=([a-zA-Z0-9]+)',
            '(?://|\.)(vidto\.[sm]e)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(viduplayer\.com)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(vidwatch\d*\.me)/(?:embed-)?([a-zA-Z0-9]+)',
            '(?://|\.)(vidzi\.(?:tv|nu))/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(vimeo\.com)/(?:video/)?([0-9a-zA-Z]+)',
            '(?://|\.)(v[ie]uclips\.(?:net|com))/(?:embed/)?([0-9a-zA-Z]+)',
            '(?://|\.)(vivo\.sx)/(?:embed/)?([0-9a-zA-Z]+)',
            '(?://|\.)(vk\.com)/(?:video_ext\.php\?|video)(.+)',
            '(?://|\.)(vkprime\.com)/(?:embed-)?([a-zA-Z0-9]+)',
            '(?://|\.)(speedwatch\.us|vkspeed\.com)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(videoslala\.com)/v/([^\n]+)',
            '(?://|\.)((?:videoslala|myfeminist)\.(?:com|net))/embed/([^\n]+)',
            '(?://|\.)(vlare\.tv)/(?:v|embed)/([\w-]+)(?:/(?:false|true)/(?:false|true)/\d+?)?',
            '(?://|\.)(voe\.sx)/(?:e/)?([0-9A-Za-z]+)',
            '(?://|\.)(vshare\.eu)/(?:embed-|)?([0-9a-zA-Z/]+)',
            '(?://|\.)(vudeo\.net)/(?:embed-)?([0-9a-zA-Z-]+)',
            '(?://|\.)(vupload\.com)/(?:e/|v/)?([0-9A-Za-z]+)',
            '(?://|\.)(vup\.to)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(watchvideo[0-9]?[0-9]?\.us)/(?:embed-)?([0-9a-zA-Z]+)',
            '(?://|\.)(weshare\.me)/(?:services/mediaplayer/site/_embed(?:\.max)?\.php\?u=)?([A-Za-z0-9]+)',
            '(?://|\.)(wstream\.video)/(?:video6zvimpy52/|video.php\?file_code=)?([0-9a-zA-Z]+)',
            '(?://|\.)((?:yadi\.sk|disk\.yandex\.ru))/i/([\w\-]+)',
            '(?://|\.)(youdbox\.(?:com|net|org))/(?:embed-)?(\w+)',
            '(?://|\.)(yourupload\.com|yucache\.net)/(?:watch|embed)?/?([0-9A-Za-z]+)',
            '(?://|\.)(cloudvideo\.tv)/(?:embed[/-])?([A-Za-z0-9]+)'
        ].map(re => re instanceof RegExp ? re : new RegExp(re)),

        resolve(url){
            url = url instanceof URL ? url.href : url;
            if (typeof url === string) {
                let i, re;
                for (i = 0; i < this.patterns.length; i++) {
                    re = this.patterns[i];
                    if (re.test(url)) return true;
                }
            }
            return false;
        }
    };



    // add Configurator
    if (window === window.parent) {
        ContextMenu.add('Configure ' + GMinfo.script.name, () => {
            Configurator.open();
        }, 'configure');
    }


    on.loaded().then(() => {
        
        Events(doc.body)
                //legacy support
                .on('kodirpc.send', e => {
                    if (e.data && e.data.link) {
                        let
                                success = e.data.success || null,
                                error = e.data.error || null,
                                rpcstream = new RPCStream(e.data.link, null, null, {mode: 0}, false);

                        KodiRPC.send(rpcstream.url.href, success, error);
                    }
                })
                .one('kodirpc.ready', () => {
                    //module detection
                    Object.defineProperty(doc.body, 'KRPCM', {
                        configurable: true, value: {}
                    });
                    console.debug("KodiRPC Module @" + GMinfo.script.version, "started");
                })
                .trigger('kodirpc.ready')
                // exposes api for an helper
                .on('kodirpc.add', e => {
                    if (isPlainObject(e.data)) {

                        let
                                data = e.data,
                                url = data.url || null,
                                subs = data.subtitles || null,
                                description = data.description || null,
                                params = data.params || {},
                                tags = data.tags || null;
                        if (typeof url === string || url instanceof URL) {
                            if (typeof description === string) desc = {desc: description};
                            else desc = {desc: ''};
                            desc.tags = tags;
                            // Adds RPCStream MenuItem
                            (new RPCStream(url, subs, desc, params));
                            // Adds Clipboard Entry
                            (new Clipboard(url, description, tags));
                        } else console.warn('Invalid data for event', e);
                    }

                });
        
        
        
        // resolveurl

        if (resolveurl.resolve(location.href)) {
            let

                    tags = ['resolve'],
                    desc = 'from ' + location.hostname,
                    subtitles = null;

            (new RPCStream(location.href, null, {desc: desc, tags: tags}, {mode: 3}));
        }



        // crunchyroll plugin
        if (/crunchyroll/.test(location.host)) {
            
            if (/\-\d+$/.test(location.pathname)) {
                (new Crunchyroll(location.pathname.split("-").pop()));
            }
            // todo: add episode selector 'ul.list-of-seasons li[id*="_videos_media"] a.episode[href^="/"]'

            return;
        }


        //dailymotion plugin

        if (
                (/dailymotion/.test(location.host)) &&
                window === window.parent //not in iframe
                ) {

            //intercept page changes
            let evts = Events(doc.body);

            // attach events
            evts.on(UUID + '.pagechange', e => {
                ContextMenu.clear();
                let url = new URL((e.detail.url[0] === '/' ? (location.origin + e.detail.url) : e.detail.url));
                if (/\/video\/\w+$/.test(url)) {
                    let xid = url.pathname.substr(url.pathname.lastIndexOf('/') + 1);
                    (new Dailymotion(xid));
                    DailymotionAPI.rpcstream(xid);
                }
            });

            // intercept forward change
            global.history.pushState = (function(){
                const old = global.history.pushState;
                return function(state, title, url){
                    evts.trigger(UUID + '.pagechange', {
                        detail: {
                            state: state,
                            title: title,
                            url: url
                        }
                    });
                    return old.call(global.history, state, title, url);
                };
            })();

            // intercept backward change
            Events(global).on('popstate', e => {
                evts.trigger(UUID + '.pagechange', {
                    detail: {
                        state: e.state,
                        title: null,
                        url: location.pathname
                    }
                });
            });
            


            // first page load
            if (/\/video\/\w+$/.test(location.pathname)) {
                evts.trigger(UUID + '.pagechange', {
                    detail: {
                        state: null,
                        title: null,
                        url: location.pathname
                    }

                });
            }

            return;
        }

        NodeFinder.find('iframe[src*="dailymotion.com/embed/"]', iframe => {

            let
                    link = new URL(iframe.src),
                    xid = link.pathname.substr(link.pathname.lastIndexOf('/') + 1);

            (new Dailymotion(xid));
            DailymotionAPI.rpcstream(xid);
        });


        // Youtube Addon
        if (
                (/youtube/.test(location.host)) &&
                window === window.parent //not in iframe
                ) {

            //intercept page changes
            let evts = Events(doc.body);

            // attach events
            evts.on(UUID + '.pagechange', e => {
                if (e.detail && e.detail.xid) {
                    (new Youtube(e.detail.xid));
                }
            }).on('yt-history-load yt-navigate', e => {
                ContextMenu.clear();
                if (
                        e.detail &&
                        e.detail.endpoint &&
                        e.detail.endpoint.watchEndpoint &&
                        e.detail.endpoint.watchEndpoint.videoId
                        ) {

                    evts.trigger(UUID + '.pagechange', {detail: {
                            xid: e.detail.endpoint.watchEndpoint.videoId
                        }});

                }



            });


            // first page load
            if (/v\=\w+/.test(location.search)) {
                let url = new URL(location.href);
                evts.trigger(UUID + '.pagechange', {
                    detail: {
                        xid: url.searchParams.get('v')
                    }

                });
            }

            return;
        }

        NodeFinder.find('iframe[src*="youtube.com/embed/"]', iframe => {
            let src = new URL(iframe.src), xid;
            src.search = "";
            src.href = src.href.replace('embed/', 'watch?v=');
            xid = src.searchParams.get('v');
            (new Youtube(xid));
        });


        //Vimeo
        NodeFinder.find('iframe[src*="player.vimeo.com/video/"]', iframe => {
            let src = new URL(iframe.src);
            (new VimeoEmbedAPI(src.origin + src.pathname));
        });

        NodeFinder.find('video[data-src^="http"], video[src^="http"], video source[src^="http"], video[data-src^="//"], video[src^="//"], video source[src^="//"]', element => {
            let
                    host = location.hostname,
                    video = element.closest('video'),
                    tracks = video.querySelectorAll('track, track[srclang="und"], track[srclang="en"]'),
                    subtitles;


            tracks.forEach(track => {
                subtitles = track.dataset.src || track.src;
            });



            let
                    src = getURL(element.dataset.src || element.src),
                    tags = [], desc = "from " + host;

            if (element.tagName === "SOURCE") tags.push('source');



            (new RPCStream(src, subtitles, {desc: desc, tags: tags}));
            (new RPCStream(src, subtitles, {desc: desc, tags: tags.concat(['hls'])}, {mode: 2}));
            (new Kodi(src, desc, tags));
            (new Clipboard(src, desc, tags));
            if (typeof subtitles === s) (new Clipboard(subtitles, desc, tags.concat(['subs'])));

        });

        // Jwplayer Video Detection
        NodeFinder.find('video.jw-video', video => {

            let container;

            if (
                    (typeof jwplayer === f) &&
                    (container = video.closest('div[id]')) !== null
                    ) {

                let jw = jwplayer(container.id);
                if (typeof jw.getPlaylist === f) {
                    let playlist = jw.getPlaylist()[0], track;

                    if (playlist.tracks) {
                        playlist.tracks.forEach(t => {

                            if (typeof track !== 'string') {
                                track = t.file;
                            } else if (t.label && /^en/i.test(t.label)) {
                                track = t.file;
                            }

                        });
                    }



                    let
                            uni = playlist.sources.length === 1,
                            host = location.hostname,
                            tags = ['jwplayer'],
                            trackAdded = false;



                    playlist.sources.forEach((source, i) => {
                        if (/^http/.test(source.file)) {
                            let desc = uni ? '' : `${i} `;
                            desc += `from ${host}`;
                            (new RPCStream(source.file, track, {desc: desc, tags: tags}));
                            (new RPCStream(source.file, track, {desc: desc, tags: tags.concat(['hls'])}, {mode: 2}));
                            (new Kodi(source.file, desc, tags));
                            (new Clipboard(source.file, desc, tags.concat(['video'])));
                            if (typeof track === s && trackAdded === false) {
                                (new Clipboard(track, desc, tags.concat(['subs'])));
                                trackAdded = true;
                            }
                        }
                    });

                }
            }
        });
        
        //animixplay


        if (/\/(player|goplyr)\.html\#/.test(location.href)) {
            let
                    src = new URL(location.href),
                    hashes = src.hash.replace(/^\#/, '').split('#'), url = '';

            for (let i = 0; i < hashes.length; i++) {
                try {
                    let str = hashes[i];
                    url = atob(str);
                    if (/^http/.test(url)) break;
                } catch (e) {
                }
            }

            if (/^http/.test(url)) {
                (new RPCStream(url, null, 'from ' + src.hostname, {mode: 0}));
            }
        }


    });

})();