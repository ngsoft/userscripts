// ==UserScript==
// @name         KodiRPC 2.0
// @namespace    https://github.com/ngsoft/userscripts
// @version      2.0
// @description  Sends Video Streams to Kodi
// @author       ngsoft
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.3/dist/gmutils.min.js
// 
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
//
// @grant       GM_xmlhttpRequest
//
// @grant       GM_registerMenuCommand
// @grant       GM_unregisterMenuCommand
//
// @compatible  firefox+tampermonkey
// @compatible  chrome+tampermonkey
//
// @icon         https://kodi.tv/favicon.ico
// @include      *
// ==/UserScript==

((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */













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



    const gmDialogNG = (function(){

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
                `<div class="gm-reset gm-overlay">
                    <dialog class="gm-dialog">
                        <header><h1></h1><span class="gm-button gm-rounded" data-name="close">&times;</span></header>
                        <section></section>
                        <footer>
                            <span class="gm-button error reverse" data-name="dismiss">Cancel</span>
                            <span class="gm-button info reverse" data-name="confirm">OK</span>
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

                            title: doc.title,
                            body: null,

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
                            title: $this.overlay.querySelector('h1'),
                            footer: $this.overlay.querySelector('footer'),
                            body: $this.overlay.querySelector('section'),
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
                        open = eventPrefix + 'open',
                        close = eventPrefix + 'close',
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

                                dialog.classList.remove('gm-fullscreen');
                                if (conf.fullscreen === true) dialog.classList.add('gm-fullscreen');

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
                                    dialog.classList.remove('gm-screencenter');
                                    if (conf.position.center === true ? flag === false : false) dialog.classList.add('gm-screencenter');
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
                                $this.container.classList.add('gm-noscroll');
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
                                if (allclosed === true) $this.container.classList.remove('gm-noscroll');
                                if ($this.status === 1) $this.trigger(confirm);
                                else $this.trigger(dismiss);


                            },
                            confirm(e){
                                //$this.trigger(hide);
                            },
                            dismiss(e){
                                // $this.trigger(hide);
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
                            callback.call(this, this);
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
                this.elements.body.classList.remove('gm-flex-center');
                if (this.elements.body.children.length === 0) this.elements.body.classList.add('gm-flex-center');
            }

        }


        return gmDialog;

    })();


    let gm = new gmDialogNG(doc.body, {

        removeOnClose: false,
        overlayClickClose: true,
        fullscreen: false,
        confirmButton: 'OK',
        dismissButton: 'Cancel',
        closeButton: true,
        body: "This is the body"
    });

    console.debug(gm.open().catch(d => {
        d.body = "Why did you cancel?";
        d.config.dismissButton = null;
        d.on('gmdialog.dismiss', e => {
            d.config.closeButton = false;
            d.body = "You cannot cancel now !";
            d.config.overlayClickClose = false;

            d.open().then(d => {
                d.body = "You cannot even confirm now !";
                d.config.confirmButton = null;
                d.open();
            });
        });
        d.open();

        let s = 10;
        new Timer(e => {

            d.title = "This dialog will close in " + s + "s";
            s--;

        }, 1000, s * 1000);

        setTimeout(e => {
            d.close();
        }, (s * 1000) + 500)

    }), gm);

    console.debug(gm);



    /*  NodeFinder.find('video, video source, video track', video => {
     console.debug(video);
     });*/


})(document);