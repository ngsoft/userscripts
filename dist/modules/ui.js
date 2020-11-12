(function(root, factory){
    /* globals define, require, module, self, innerWidth */
    const
            name = "ui",
            dependencies = ['require', 'utils', 'config', 'GM'];
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
}(typeof self !== 'undefined' ? self : this, function(require){

    let undef;


    const utils = require('utils'),
            config = require('config'),
            GM = require('GM');

    const {
        doc, f, s, n, u, b, int, gettype,
        uniqid, html2element, isPlainObject, isValidSelector,
        ResizeSensor, loadcss, NodeFinder,
        Events, trigger, extend, assert
    } = utils;

    const {GMinfo} = GM;


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

        get title(){
            return this.elements.title.innerText;
        }

        get body(){
            return this.elements.body;
        }

        get isClosed(){
            return this.root.parentElement === null;
        }

        get parent(){
            return this.config.parent;
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
                    parent: parent,
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
                    title: GMinfo.script.name,
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


    const
            template = `<dialog class="gm-dialog">
                            <div class="gm-dialog-header">
                                <h1 class="gm-dialog-title"></h1>
                                <span class="gm-btn gm-btn-close" data-name="close">&times;</span>
                            </div>
                            <div class="gm-dialog-body"></div>
                            <div class="gm-dialog-footer">
                                <span class="gm-btn gm-btn-yes" data-name="confirm">Yes</span>
                                <span class="gm-btn gm-btn-no" data-name="dismiss">No</span>
                            </div>
                    </dialog>`,
            overlay = '<div class="gm-dialog-overlay"/>',
            dialogSettings = {
                title: GMinfo.script.name,
                body: "You are using " + GMinfo.scriptHandler + " version " + GMinfo.version,
                container: null,
                
                settings: {
                    overlayclickclose: true,
                    fullscreen: false,
                    removeOnClose: true,

                    width: null,
                    height: null,
                    position: {
                        top: null,
                        right: null,
                        bottom: null,
                        left: null,
                        center: true
                    }
                },
                buttons: {
                    confirm: "Yes",
                    dismiss: "No"
                },
                events: {},
                prefix: 'gmdialog',
                animate:{
                    enabled: true,
                    start:{
                        classes:"fadeIn",
                        duration: 750,
                        enabled: true
                    },
                    end:{
                        classes:"fadeOut",
                        duration: 750,
                        enabled: true
                    }
                }
                
                
            },
            dialogEvents = {

            };


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



    /**
     * auto resize dialog
     */
    function setSize(target){

        const body = target.body;

        body.style["max-height"] = body.style.height = null; //reset style
        let
                max = target.overlay.offsetHeight,
                dialogHeight = target.dialog.offsetHeight,
                minus = target.header.offsetHeight + target.footer.offsetHeight + 16,
                available = max - minus - 1,
                current = body.offsetHeight;

        if (current > available) body.style["max-height"] = available + "px";
        if ((dialogHeight > max) || (max < 640) || (innerWidth < 950) || target.dialog.classList.contains('gm-fullscreen')) {
            body.style.height = available + "px";
        }

    }



   function setListeners(target, obj, prefix = ''){
       
       assert(!(target instanceof EventTarget),'Invalid Argument target.' );
        assert(!isPlainObject(obj), 'Invalid Argument obj.');
        assert(!!gettype(prefix, s), 'Invalid Argument prefix.');

        let type;
        Object.keys(obj).forEach(key => {
            type = prefix + key;

            if (gettype(obj[key], f)) {
                Events(target).on(type, obj[key]);
            } else if (isPlainObject(obj[key])) {
                setListeners(target, obj[key], type + '.');
            }
        });
    };








    class Dialog {
        get dialog(){
            return this.elements.dialog;
        }

        constructor(options){

            Object.defineProperties(this, {
                elements: {
                    enumerable: false, configurable: true, writable: true,
                    value: {
                        dialog: html2element(template),
                        buttons: {}
                    }
                },
                options: {
                    enumerable: false, configurable: true, writable: true,
                    value: null
                },

                isReady: {
                    enumerable: true, configurable: true, writable: true,
                    value: false
                }
            });



            ['header', 'body', 'footer'].forEach(cls => {
                let
                        className = 'gm-dialog-' + cls,
                        elem = this.dialog.querySelector('.' + className);
                this.elements[cls] = elem;
            });

            this.dialog.querySelectorAll('[data-name].gm-btn').forEach(elem => {
                let name = elem.getAttribute('data-name');
                if (name.length > 0) this.elements.buttons[name] === elem;
            });


            let params = Object.assign({}, dialogSettings);

            if (isPlainObject(options)) params = extend(params, options);
            this.options = params;

            const dialog = this.dialog;

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





























        }



    }



















    loadcss(config.get('paths.styles') + 'gmstyles.css');

    return {
        gmDialog, confirm: ask, alert
    };


}));



