// ==UserScript==
// @version     3.1.2
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
// @require
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
            utils = {};

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
    JSON.RPCRequest = function(method, params, id){
        params = params || {};
        if (typeof method === s && isPlainObject(params)) {
            return this.stringify({
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
                let data = JSON.RPCRequest(method, params);
                if (data === undef) reject();
                utils.GM_xmlhttpRequest({
                    method: 'POST',
                    url: that.address,
                    data: data,
                    headers: that.headers,
                    onload(xhr){
                        if (xhr.status === 200) resolve(JSON.parse(xhr.response));
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
            if (typeof Clipboard.id !== n) Clipboard.id = 0;
            Clipboard.id++;

            let title = '';

            this.tags.forEach(t => {
                title += '[' + t.toUpperCase() + ']';
            });

            title += ' Copy link ';
            title += this.description();

            ContextMenu.add(title, () => {
                this.send();
            }, this.identifier() + '.' + Clipboard.id);
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
            params = Object.assign({
                title: title,
                referer: location.origin + location.pathname,
                useragent: navigator.userAgent,
                url: url
            }, params);

            // some titles can break the json, so we encode it (plugin detects if encoded)
            params.title = btoa(sanitizeFileName(params.title, ' ').replace(/\s+/, ' '));

            if (typeof subs === s) {
                params.subtitles = subs;
            }
            this.setParam('request', btoa(JSON.stringify(params)));
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
                            resolve(JSON.parse(xhr.response));

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
                            (new RPCStream(
                                    entry.url,
                                    null,
                                    {tags: ['vimeo', entry.cdn], desc: xid}, {
                                mode: 0,
                                title: doc.title
                            }
                            ));
                        });



                    })
                    .catch(console.error);
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
                            let json = JSON.parse(xhr.response);
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
                        data: JSON.stringify({app: 'com.dailymotion.neon'}),
                        onload(xhr){
                            if (xhr.status === 200) {
                                let json = JSON.parse(xhr.response);
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
                                        (new RPCStream(
                                                link, subs,
                                                {tags: ['dailymotion'], desc: xid}, {
                                            mode: 0,
                                            title: meta.title,
                                            referer: 'https://www.dailymotion.com/video/' + xid,
                                            useragent: 'Mozilla/5.0 (Linux; Android 7.1.1; Pixel Build/NMF26O) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.91 Mobile Safari/537.36'
                                        }
                                        ));
                                    }
                                });
                    })
                    .catch(console.error);

        }

    }

    // add Configurator
    if (window === window.parent) {
        ContextMenu.add('Configure ' + GMinfo.script.name, () => {
            Configurator.open();
        }, 'configure');
    }






    on.loaded().then(() => {
        
        Events(doc.body).on('kodirpc.send', e => {
            if (e.data && e.data.link) {
                let
                        success = e.data.success || null,
                        error = e.data.error || null,
                        rpcstream = new RPCStream(e.data.link, null, null, {mode: 0}, false);

                KodiRPC.send(rpcstream.url.href, success, error);
            }
        }).one('kodirpc.ready', () => {
            //module detection
            Object.defineProperty(doc.body, 'KRPCM', {
                configurable: true, value: {}
            });
            console.debug("KodiRPC Module version", GMinfo.script.version, "started");
        }).trigger('kodirpc.ready');
        
        
        
        

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


        if (/yt5s/.test(location.host)) {

            return NodeFinder.find('#search-result .detail #asuccess[href^="http"]', btn => {

                let
                        link = btn.href,
                        title = doc.querySelector('.detail .content .clearfix h3').innerText.trim(),
                        xid = doc.querySelector('#video_id').value,
                        resolveURL = url => new Promise((resolve, reject) => {
                                const err = new Error('Cannot resolve YT5S url.');
                                utils.GM_xmlhttpRequest({
                                    method: 'HEAD',
                                    url: link,
                                    onreadystatechange(xhr){
                                        if (xhr.readyState == xhr.DONE) {
                                            if (xhr.finalUrl != link) resolve(xhr.finalUrl);
                                            else reject(err);
                                        }
                                    }
                                });
                            });


                resolveURL(link)
                        .then(url => {
                            (new RPCStream(link, null, {desc: xid, tags: ['yt5s']}));
                        })
                        .catch(console.error);
            });
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





    });

})();