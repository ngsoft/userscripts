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
                else return;
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
                                new gmButtons(dialog);
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



