/**
 * gmfinders Module
 */

(function(root, factory){
    const deps = ["gmtools"]; //your dependencies there
    if (typeof define === 'function' && define.amd) define(deps, factory);
    else if (typeof exports === 'object') module.exports = factory(...deps.map(dep => require(dep)));
    else root.gmfind = factory(...deps.map(dep => root[dep]));
}(this, function(gmtools){


    const doc = document;

    /**
     * Tests whenever the given selector is valid
     * @param {string} selector
     * @returns {Boolean}
     */
    const isValidSelector = gmtools.isValidSelector = function(selector){

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
        isValidSelector: isValidSelector,
        NodeFinder: NodeFinder,
        ResizeSensor: ResizeSensor

    };
}));

