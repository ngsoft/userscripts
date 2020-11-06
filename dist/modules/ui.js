(function(root, factory){
    /* globals define, require, module, self, innerWidth */
    const
            name = "ui",
            dependencies = ['utils', 'events', 'data'];
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
}(typeof self !== 'undefined' ? self : this, function(utils, events){


    const {doc, f, s, n, u, b, uniqid, html2element, isPlainObject, isValidSelector, ResizeSensor, loadcss} = utils;
    const {Events, trigger} = events;
    let undef;




    /**
     * Userscripts Dialog Box
     */
    class gmDialog {

        set title(title){
            if ((typeof title === s)) this.elements.title.innerHTML = title;
            else if (title instanceof Element) {
                this.elements.title.innerHTML = "";
                this.elements.title.appendChild(title);
            }
        }

        set body(body){
            if (typeof body === s) this.elements.body.innerHTML = body;
            else if (body instanceof Element) {
                this.elements.body.innerHTML = "";
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
         *
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
            if (conf.position instanceof Object) {
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

            }).on('hide', e => {
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

            gmStyles();
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
            gmStyles();
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

            gmStyles();
        }
    }


    function gmStyles(){
        return new Promise(resolve => {

            if ((gmStyles.element instanceof Element) && gmStyles.element.parentElement !== null) {
                resolve(gmStyles.element);
                return;
            }
            if (gmStyles.loading === false) {

                gmStyles.loading = true;



            }




        });
    }
    Object.assign(gmStyles, {
        element: null,
        loading: false
    });



    return {
        gmDialog, gmStyles, gmTabs, gmFlash
    };


}));



