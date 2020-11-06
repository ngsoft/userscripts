(function(root, factory){
    /* globals define, require, module, self, EventTarget */
    const
            name = "utils",
            dependencies = ['module', 'sprintf'];
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
}(typeof self !== 'undefined' ? self : this, function(module, sprintf, undef){


    const {s, f, n} = module.config();
    const doc = document;

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

    /**
     * Loads an external script
     * @param {string} src
     * @param {boolean} defer
     * @returns {Promise}
     */
    function loadjs(src, defer){
        return new Promise((resolve, reject) => {
            if (!isValidUrl(src)) {
                reject(new Error("Invalid argument src."));
                return;
            }
            let script = doc.createElement('script');
            Object.assign(script, {
                type: 'text/javascript',
                onload: e => resolve(e.target),
                onerror: () => reject(new Error('Cannot load' + src)),
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
            if (!isValidUrl(src)) {
                reject(new Error('Invalid argument src'));
                return;
            }
            let style = doc.createElement('link');
            Object.assign(style, {
                rel: "stylesheet",
                type: "text/css",
                href: src,
                onload: e => resolve(e.target),
                onerror: () => reject(new Error('Cannot load' + src))
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


    return Object.assign( {
        uniqid, html2element, html2doc, copyToClipboard, Text2File, doc, ON, isValidSelector,
        addstyle, loadjs, addscript, loadcss, isValidUrl, getURL, sanitizeFileName, ResizeSensor, NodeFinder
    }, module.config(), sprintf);

}));

