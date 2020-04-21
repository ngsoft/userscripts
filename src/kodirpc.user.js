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
     * Userscripts Dialog Box
     */
    class gmDialogNGOld {

        set title(t){
            if ((typeof t === s)) this.elements.title.innerHTML = t;
            else if (body instanceof Element) {
                this.elements.body.innerHTML = null;
                this.elements.body.appendChild(body);
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

            new gmStyles();
            //register current instance
            if (typeof doc.documentElement.gmDialog === u) {
                Object.defineProperty(doc.documentElement, 'gmDialog', {
                    value: [], configurable: true
                });
            }
            doc.documentElement.gmDialog.push(self);
        }
    }

    // alert('test');


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
                    Object.defineProperty('disabled', {
                        configurable: true, enumerable: false,
                        get(){

                            return this.getAttribute('disabled') !== null;
                        },
                        set(flag){
                            this.setAttribute('disabled', '');
                            if (flag === null) this.removeAttribute('disabled');
                        }
                    });

                }
                if (button.name === undef) {
                    Object.defineProperty('name', {
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



    const gmDialog = (function(){


        /**
         * Older firefox scroll hack
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


        function animate(elem, classes, duration, eventEnd = null){

            if (elem instanceof Element === false) throw new Error('animate invalid argument elem');
            if (typeof classes !== s) throw new Error('animate invalid argument classes');
            if (typeof duration !== n) throw new Error('animate invalid argument duration');
            if (typeof eventEnd !== s ? true : eventEnd !== null) throw new Error('animate invalid argument eventEnd');

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

        const styles = `
            /** Reset styles **/
            [class*="gm-"]{}

            
            /** Buttons **/
            .gm-button{}



            /** Colors **/
            [class*="gm-"] .gm-button {}
            [class*="gm-"] .info{}
            [class*="gm-"] .success{}
            [class^="gm-"] .error{}
            [class*="gm-"] .warning{}
            [class*="gm-"] .reverse{}
            [class*="gm-"] .info.reverse{}
            [class*="gm-"] .success.reverse{}
            [class*="gm-"] .error.reverse{}
            [class*="gm-"] .warning.reverse{}
            [class*="gm-"] .text-info{}
            [class*="gm-"] .text-success{}
            [class*="gm-"] .text-error{}
            [class*="gm-"] .text-warning{}


            /** Overlay **/
            .gm-overlay{}

            /** gmDialog **/
            dialog.gm-dialog{}
            .gm-dialog > header, .gm-dialog > footer{}
            .gm-dialog > header{}
            .gm-dialog > footer{}
            .gm-dialog > header > h1{}
            .gm-dialog > header > [data-name="close"].gm-button{}
            .gm-dialog > section{}

            /** utilities **/
            [class*="gm-"][hidden], [class*="gm-"].hidden, [class*="gm-"] dialog:not([open]),
            [class*="gm-"] [hidden], [class*="gm-"] .hidden
            {display: none !important;}
        `;

        addstyle(styles);


        const template =
                `<div class="gm-overlay">
                    <dialog class="gm-dialog">
                        <header><h1></h1><span class="gm-btn gm-rounded" data-name="close">&times;</span></header>
                        <section></section>
                        <footer>
                            <span class="gm-button gm-rounded" data-name="cancel">Cancel</span>
                            <span class="gm-button gm-rounded" data-name="confirm">OK</span>
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
                            cancelButton: 'Cancel',
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
                    root: {configurable: true, writable: false, enumerable: false, value: $this.overlay.querySelector('dialog')}
                });
                //element mapping
                this.dialog.querySelectorAll('[data-name].gm-button').forEach(el => $this.elements.buttons[el.data('name')] = el);

                const
                        dialog = this.dialog,
                        conf = this.config,
                        buttons = this.elements.buttons,
                        eventPrefix = conf.eventPrefix,
                        overlayClickClose = conf.overlayClickClose === true,
                        removeOnClose = conf.removeOnClose === true,
                        fullscreen = conf.fullscreen === true,
                        animate = conf.animate === true,
                        animateStart = conf.animateStart === true,
                        animateEnd = conf.animateEnd === true,
                        animateStartClasses = conf.animateStartClasses,
                        animateEndClasses = conf.animateEndClasses,
                        animateStartDuration = conf.animateStartDuration,
                        animateEndDuration = conf.animateEndDuration;

                //set body and title
                ["body", "title"].forEach(key => $this[key] = conf[key]);
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
                    if (conf.position.center === true ? flag === false : false) dialog.classList.add('gm-screencenter');
                }

                if (conf.fullscreen === true) dialog.classList.add('gm-fullscreen');

                //dimensions
                ["width", "height"].forEach(key => {
                    let val = conf[key];
                    if (typeof val === n) val += "px";
                    if (typeof val === s) dialog.style[key] = val;
                });
                //close btn
                if (conf.closeButton !== true) buttons.close.hidden = buttons.close.disabled = true;
                //events
                new Events(this.dialog, this);
                const
                        events = {

                        },
                        actions = {
                            buttons: {}
                        };

                Object.keys(events).forEach(type => {
                    if (typeof events[type] === f) $this.on(eventPrefix + type, events[type]);
                });
                if (isPlainObject(conf.events)) {
                    Object.keys(conf.events).forEach(type => {
                        if (typeof conf.events[type] === f) $this.on(eventPrefix + type, conf.events[type]);
                    });

                }

            }

            /** Getters **/

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


    let gm = new gmDialog();

    console.debug(gm);



    /*  NodeFinder.find('video, video source, video track', video => {
        console.debug(video);
    });*/


})(document);