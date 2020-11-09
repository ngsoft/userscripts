/**
 * Utilities for tampermonkey userscripts
 * @link https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/tools.min.js
 * https://cdn.jsdelivr.net/gh/requirejs/requirejs@latest/require.js
 * https://github.com/requirejs/requirejs/blob/latest/require.js
 * @link https://github.com/ngsoft/userscripts/blob/master/dist/tools.js
 */
(function(global){

    /* globals define, require, module, self, requirejs, unsafeWindow, GM_info, GM */

    if (!GM_info) throw new Error('Not loaded in userscript.');
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
            GMinfo = (typeof GM_info !== 'undefined' ? GM_info : (typeof GM === 'object' && GM !== null && typeof GM.info === 'object' ? GM.info : null)),
            scriptname = GMinfo ? `${GMinfo.script.name} @${GMinfo.script.version}` : "",
            UUID = GMinfo ? GMinfo.script.uuid : "";

    let
            matches,
            root = 'https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist',
            gmexports = {GMinfo, scriptname, UUID},
            headers = gmexports.headers = {},
            inline = [
                'name', 'namespace', 'version', 'author', 'description',
                'homepage', 'homepageURL', 'website', 'source',
                'icon', 'iconURL', 'defaulticon',
                'icon64', 'icon64URL',
                'updateURL', 'downloadURL', 'supportURL',
                'run-at', 'noframes',
                //custom
                'dev', 'usecache'
            ];

    GMinfo.script.header.split(/\n+/).forEach(line => {
        if ((matches = /@([\w\-]+)(.*)?/.exec(line)) !== null) {
            let key = matches[1],
                    value = matches[2] || "", real;
            value = value.trim();
            if (!headers[key]) headers[key] = [];
            
            value = value.length > 0 ? value : "true";
            try {
                real = JSON.parse(value);
            } catch (e) {
                real = value;
            }
            if (inline.includes(key)) headers[key] = real;
            else headers[key].push(real);
        }
    });


    headers.require.forEach(src => {
        if (/^http.+\/tools(\.min)?\.js$/.test(src)) root = src.substr(0, src.lastIndexOf('/'));
    });

    let dev = headers.dev === true;
    let usecache = headers.usecache === true;
    //dev mode local file with FF60ESR @dev    
    if (dev === true) root = "http://127.0.0.1:8092/dist";
    root += '/modules/';



    // Pass sandboxed functions into the modules(they are loaded into the global scope (window))
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
    ].forEach(v => gmexports[v] = self[v]);


    /**
     * Adds script to the bottom of the head
     * @param {string} src
     * @returns {undefined}
     */
    function addscript(src){
        if (typeof src === s && src.length > 0) {
            let s = global.document.createElement("script");
            s.setAttribute("type", "text/javascript");
            s.appendChild(global.document.createTextNode(src));
            global.document.head.appendChild(s);
        }
    }


    class Configuration {

        constructor(){
            Object.defineProperties(this, {
                config: {value: {}, enmerable: false, configurable: true, writable: false}
            });
        }

        addPath(name, path, version, extra){
            if (typeof name !== s) throw new Error('Invalid Argument name.');
            else if (typeof path !== s || !(/^http/.test(path))) throw new Error('Invalid Argument path.');
            let obj = {name, path};
            if (typeof version === s) {
                obj.version = version;
                path = path.replace('%s', version);
            }
            if (extra instanceof Object && Object.getPrototypeOf(extra) === Object.prototype) Object.assign(obj, extra);
            this.config[name] = obj;
            let config = {paths: {}};
            config.paths[name] = path;
            requirejs.config(config);
            return this;
        }

        get(key){
            if (typeof key === u) return Object.assign({}, this.config);
            else if (typeof key === s) return this.config[key];
        }

        set(key, value){
            if (key instanceof Object && Object.getPrototypeOf(key) === Object.prototype) {
                Object.assign(this.config, key);
            } else if (typeof key === s) {
                this.config[key] = value;
            }
        }

        has(key){
            return typeof key === s && typeof this.config[key] !== u;
        }
    }



    /* Storage size
     var _lsTotal = 0,
     _xLen, _x;
     for (_x in localStorage) {
     if (!localStorage.hasOwnProperty(_x)) {
     continue;
     }
     _xLen = ((localStorage[_x].length + _x.length) * 2);
     _lsTotal += _xLen;
     console.log(_x.substr(0, 50) + " = " + (_xLen / 1024).toFixed(2) + " KB")
     };
     console.log("Total = " + (_lsTotal / 1024).toFixed(2) + " KB");*/

    class Cache {

        get entries(){
            let entries = localStorage.getItem(this.prefix + 'CacheEntries');
            if (typeof entries === s) entries = JSON.parse(entries);
            else entries = {};
            return entries;
        }
        set entries(entries){
            if (this.enabled) localStorage.setItem(this.prefix + 'CacheEntries', JSON.stringify(entries));
            else localStorage.removeItem(this.prefix + 'CacheEntries');
        }

        get now(){
            return  +new Date();
        }
        get enabled(){
            return (config.get('cache').enabled === true) && this.supported;
        }
        get supported(){
            return ("localStorage" in global) && ("getItem" in global.localStorage);
        }

        get prefix(){
            return config.get('cache').prefix;
        }
        get ttl(){
            return config.get('cache').ttl;
        }

        saveItem(module, code){
            if (!this.enabled) return false;
            let
                    key = this.prefix + module,
                    entries = this.entries;
            entries[key] = this.now + this.ttl;
            try {
                localStorage.setItem(key, code);
                this.entries = entries;
                return true;
            } catch (e) {
                console.warn('Cannot save cache item', module);
            }
            return false;
        }

        loadItem(module){
            if (!this.enabled) return null;
            let
                    key = this.prefix + module,
                    expire = this.entries[key] || 0;
            if (this.now > expire) {
                localStorage.removeItem(key);
                return null;
            }
            return localStorage.getItem(key);
        }

        clear(){

            if (this.supported && this.prefix.length > 0) {
                let keys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    let key = localStorage.key(i);
                    if (key.indexOf(this.prefix) === 0) keys.push(key);
                }
                keys.forEach(k => localStorage.removeItem(k));
            }

        }

        exec(code){
            try {
                /*jslint evil: true */
                eval(code);
                return true;
            } catch (e) {
                console.error(e.message);
            }
            return false;
        }

        constructor(){
            if (this.supported) {

                //clear cache on new session
                if (sessionStorage.getItem(GM_info.script.uuid) === null) {
                    this.clear();
                    sessionStorage.setItem(GM_info.script.uuid, this.now);
                    sessionStorage.setItem('newsession', true);
                    return;
                }

                let entries = this.entries;
                //detects expired entries
                Object.keys(entries).forEach(key => {
                    if (this.now > entries[key]) {
                        localStorage.removeItem(key);
                        delete entries[key];
                    }

                });
                this.entries = entries;
            }
        }
    }



    class Request {

        /**
         * Executes callback on success
         * @param {function} callback
         * @returns {Request}
         */
        success(callback){
            Array.from(arguments).forEach(arg => {
                if (typeof arg === f) {
                    if (this.status === 'success') {
                        arg(this.response);
                    } else this.config.success.push(arg);
                }
            });
            return this._send();
        }
        /**
         * Executes callback when complete
         * @param {function} callback
         * @returns {Request}
         */
        complete(callback){

            Array.from(arguments).forEach(arg => {
                if (typeof arg === f) {
                    if (this.status !== null) arg(this.response);
                    else this.config.complete.push(arg);
                }
            });
            return this._send();
        }
        /**
         * Executes callback on error
         * @param {function} callback
         * @returns {Request}
         */
        error(callback){
            Array.from(arguments).forEach(arg => {
                if (typeof arg === f) {
                    if (this.status === 'error') arg(this.response);
                    else this.config.error.push(arg);
                }
            });
            return this._send();
        }

        _send(){

            if (!this.sent) {
                this.sent = true;
                setTimeout(() => {
                    if (this.xhr.readyState < 4) this.xhr.abort();
                }, 15 * second);
                try {
                     this.xhr.send();
                } catch (e) {
                    this.response = {
                        status: 0,
                        text: "",
                        statusText: e.message,
                        url: this.url,
                        error: e
                    };
                    let ev = new Event('error');
                    ev.response = this.response;
                    this.status = 'error';
                    this.listener.dispatchEvent(ev);
                }
            }
            return this;
        }

        /**
         * Executes the request
         * @returns {Promise}
         */
        fetch(){
            return new Promise((resolve, reject) => {
                this
                        .success(e => resolve(e))
                        .error(e => reject(e));
            });
        }

        /**
         *
         * @param {string} url
         * @param {Object} [headers]
         * @param {boolean} [cookies]
         * @param {boolean} [async]
         */
        constructor(url, headers, cookies, async){

            if (typeof url !== s) throw new Error('Invalid Argument url');

            async = typeof async === b ? async : true;
            cookies = typeof cookies === b ? cookies : false;

            if (typeof headers === b) {
                async = cookies;
                cookies = headers;
                headers = {};
            } else if (!(headers instanceof Object && Object.getPrototypeOf(headers) === Object.prototype)) headers = {};


            Object.defineProperties(this, {
                config: {
                    enmerable: false, configurable: true, writable: false,
                    value: {
                        success: [],
                        error: [],
                        complete: [],
                        cookies: cookies === true,
                        async: async === true,
                        headers: headers
                    }
                },
                url: {
                    enmerable: false, configurable: true, writable: true,
                    value: url
                },
                listener: {
                    enmerable: false, configurable: true, writable: false,
                    value: global.document.createElement('div')
                },
                xhr: {
                    enmerable: false, configurable: true, writable: true,
                    value: null
                },
                response: {
                    enmerable: false, configurable: true, writable: true,
                    value: null
                },
                status: {
                    enmerable: false, configurable: true, writable: true,
                    value: null
                },
                sent: {
                    enmerable: false, configurable: true, writable: true,
                    value: false
                }
            });

            let
                    xhr = this.xhr = new XMLHttpRequest(),
                    listener = this.listener;

            listener.addEventListener('success', e => {
                this.config.success.forEach(c => c(e.response));
                let ev = new Event('complete');
                ev.response = e.response;
                this.listener.dispatchEvent(ev);
            });

            listener.addEventListener('error', e => {
                this.config.error.forEach(c => c(e.response));
                let ev = new Event('complete');
                this.listener.dispatchEvent(ev);

            });

            listener.addEventListener('complete', e => {
                this.config.complete.forEach(c => c(e.response));
            });

            xhr.open('GET', url, async === true);
            xhr.withCredentials = cookies === true;
            Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]));

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status !== 0) {

                    let
                            type = 'success',
                            response = this.response = {
                        status: xhr.status,
                        text: xhr.responseText,
                        statusText: xhr.statusText,
                        url: xhr.responseURL
                    };
                    if (response.status < 200 || response.status > 300) {
                        response.error = new Error('Invalid Status Code');
                        type = 'error';
                    }
                    let evt = new Event(type);
                    evt.response = response;
                    this.status = type;
                    this.listener.dispatchEvent(evt);
                }
            };
            xhr.onerror = xhr.onabort = e => {
                let
                        xhr = this.xhr, error,
                        response = this.response = {
                            status: xhr.status,
                            text: xhr.responseText,
                            statusText: xhr.statusText,
                            url: xhr.responseURL
                        };
                if (e.type === 'abort') error = new Error('Operation timeout.');
                else error = new Error('Network Error.');
                response.error = error;
                let evt = new Event('error');
                evt.response = response;
                this.status = 'error';
                this.listener.dispatchEvent(evt);
            };

        }
    }


    const config = new Configuration();
    config.set({
        root, dev,
        cache: {
            enabled: usecache,
            ttl: 30 * minute,
            prefix: 'GMCache:'
        }
    });

    const cache = new Cache();
    if (sessionStorage.getItem('newsession') !== null) {
        config.set('newsession', true);
        sessionStorage.removeItem('newsession');
    }

    /**
     * requirejs Loader
     */

    // async=false to get the variable available inside the script
    let
            reqjs = {
                src: 'https://cdn.jsdelivr.net/gh/requirejs/requirejs@latest/require.min.js',
                key: 'require.min.js'
            },
            req = new Request(reqjs.src, false, false),
            get = true;


    if (cache.supported) {
        let code = localStorage.getItem(reqjs.key);
        if (typeof code === s) {
            addscript(code);
            get = false;
        }
    }
    if (get === true) {

        req
                .success(response => {
                    let code = response.text;
                    addscript(code);
                    try {
                        localStorage.setItem(reqjs.key, code);
                    } catch (e) {
                        console.warn('Cannot save cache', reqjs.key);
                    }
                })
                .error(response => {
                    throw new Error('Cannot fetch ' + reqjs.key + ' ' + response.error.message);
                });

    }



    if (typeof requirejs !== f) throw new Error('Cannot execute ' + reqjs.key);

    requirejs.config({
        baseUrl: root,
        waitSeconds: 15,
        packages: [
            {
                // https://github.com/brix/crypto-js/tree/4.0.0
                name: 'crypto-js',
                location: 'https://cdn.jsdelivr.net/npm/crypto-js@4.0.0',
                main: 'index'

            }
        ]
    });

    // adding some deps
    config
            .addPath('Plyr', 'https://cdn.jsdelivr.net/npm/plyr@%s/dist/plyr', '3.6.2')
            .addPath('Subtitle', 'https://cdn.jsdelivr.net/npm/subtitle@%s/dist/subtitle.bundle.min', '2.0.5')
            .addPath('Hls', 'https://cdn.jsdelivr.net/npm/hls.js@%s/dist/hls.min', '0.14.16', {
                config: {
                    enableWebVTT: false,
                    enableCEA708Captions: false
                }
            })
            .addPath('dashjs', 'https://cdn.dashjs.org/latest/dash.all.min');


    let define = global.define;

    //exporting this script contents
    define('GM', gmexports);
    define('config', config);
    define('Request', Request);

    const load = requirejs.load;

    //Code fast load using localStorage Cache set @usecache in userscript header
    requirejs.load = function(context, moduleName, url){
        let  hit = false;
        url = new URL(url);
        if (cache.enabled) {
            url.searchParams.set('tt', +new Date()); // get a fresh version
            let contents = cache.loadItem(moduleName);
            if (contents !== null && cache.exec(contents)) {
                context.completeLoad(moduleName);
                hit = true;
            }
        }
        if (hit === false) {

            (new Request(url.href)).fetch()
                    .then(response => {
                        if (cache.exec(response.text)) {
                            if (cache.enabled) cache.saveItem(moduleName, response.text);
                            context.completeLoad(moduleName);
                        } else {
                            console.warn('Cannot execute', moduleName, 'module using xhr, fallback to regular method.');
                            load(context, moduleName, url.href);
                        }
                    })
                    .catch(response => {
                        let message = ['Cannot fetch', moduleName, 'module using xhr, fallback to regular method.'];

                        if (response instanceof Error) message.push(response.message);
                        console.warn(...message);
                        load(context, moduleName, url.href);
                    });
        }
    };

}((typeof unsafeWindow !== 'undefined' ? unsafeWindow : window)));






