/**
 * Module dialog
 */
(function(root, factory){
    /* globals define, require, module, self */
    const
            name = 'dialog',
            dependencies = ['require', 'config', 'dialogpolyfill', 'utils'];
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
        root["dialog"] = factory(...dependencies.map(dep => require(dep)));/*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function k4y2mjucdmt478ju6k5k(require){

    const
            config = require('config'),
            polyfill = require('dialogpolyfill'),
            utils = require('utils');

    const {int, n, f, s, u, b, html2element, doc, Events, gettype, ResizeSensor, sprintf, addstyle, assert, loadcss} = utils;

    let undef, scrollBarStyles = false, zindex = 300000, isReady = false, listener = new Events();

    const
            template = `<dialog class="gm-dialog">
                            <div class="gm-modal" style="z-index: -1;">
                                <div class="gm-dialog-header">
                                    <h1 class="gm-dialog-title">My big title to test my app</h1>
                                    <span class="gm-btn" data-name="close">&times;</span>
                                </div>
                                <div class="gm-dialog-body">
                                    <form method="dialog" class="gm-dialog-form">
                                        <fieldset>
                                            <legend>Body</legend>
                                            <label>Name</label><input type="search" name="name">
                                        </fieldset>
                                        <fieldset>
                                            <legend>Select Box</legend>
                                            <label>Servers</label>
                                            <select name="sel">
                                                <option value="1">four</option>
                                                <option value="2">My long string to test the select box</option>
                                            </select>

                                                <div class="checkbox block">
                                                  <input type="radio" name="server-enabled">
                                                  <label>Make my profile visible</label>
                                                </div>

                                                <div class="checkbox block">
                                                  <input type="radio" name="server-enabled">
                                                  <label>Radio choice</label>
                                                </div>
                                                <div class="toggle checkbox block">
                                                  <input type="radio" name="server-enabled">
                                                  <label>Subscribe to weekly newsletter</label>
                                                </div>
                                                <div class="switch checkbox">
                                                    <input title="Enabled" type="checkbox" name="server-enabled">
                                                    <label>Subscribe to monthly newsletter</label>
                                                </div>
                                                <div class="switch round checkbox">
                                                    <input title="Enabled" type="radio" name="server-enabled">
                                                    <label>Subscribe to monthly newsletter</label>
                                                </div>
                                                <div class="toggle checkbox">
                                                    <input title="Enabled" type="radio" name="server-enabled">
                                                    <label>Subscribe to monthly newsletter</label>
                                                </div>
                                                <div class="toggle round checkbox">
                                                    <input title="Enabled" type="radio" name="server-enabled">
                                                    <label>Subscribe to monthly newsletter</label>
                                                </div>
                                                <div class="message blue">This is a message box</div>

                                        </fieldset>
                                        <h1>Test h1 title</h1>
                                        <p>
                                            here is a paragraph
                                        </p>
                                        <h2>Test h2 title</h2>
                                        <p>
                                            here is a paragraph
                                        </p>
                                    </form>
                                </div>
                                <div class="gm-dialog-footer">
                                    <span class="gm-btn alert" data-name="dismiss">No</span>
                                    <span class="gm-btn primary" data-name="confirm">Yes</span>
                                </div>
                            </div>
                        </dialog>`;



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
    function setSize(target, init = false){

        if (!doc.body.contains(target.dialog)) return;


        let dialog = target.modal, root = target.elements, body = root.body;
        body.style["max-height"] = body.style.height = body.style["min-height"] = dialog.style["top"] = dialog.style["bottom"] = dialog.style["transform"] = null; //reset style

        let
                rect = dialog.getBoundingClientRect(),
                top = Math.round(rect.top),
                max = innerHeight,
                dialogHeight = dialog.offsetHeight,
                headerHeight = root.header.offsetHeight < 64 ? 64 : root.header.offsetHeight,
                footerHeight = root.footer.offsetHeight < 64 ? 64 : root.footer.offsetHeight,
                minus = headerHeight + footerHeight + 2,
                // available = dialogHeight - minus,
                // current = body.offsetHeight,
                free = Math.floor(max - (dialogHeight + top));

        /* console.debug({
            max, top, dialogHeight, headerHeight, footerHeight, minus, available, current, free, rect, calc: Math.floor((free / 2) + available)
        });*/

        if ((max > 640) && (innerWidth > 767)) {
            if (free < 16) {
                dialog.style["bottom"] = (top > 16 ? top : 16) + "px";
                dialog.style["top"] = (top > 16 ? top : 16) + "px";
                if (target.dialog.classList.contains('center')) {
                    dialog.style["transform"] = "unset";
                }

            }
        }

    }

    /**
     * show / hide events
     * using animated
     */
    const animate = (function(){

        const
                def = 'fadeIn',
                cssUrl = 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.compat.min.css',
                listener = doc.createElement('div');
                ignoreRequire = ['fadeIn', 'fadeOut'],
                classList = ['bounce',
                    'flash',
                    'pulse',
                    'rubberBand',
                    'shake',
                    'headShake',
                    'swing',
                    'tada',
                    'wobble',
                    'jello',
                    'bounceIn',
                    'bounceInDown',
                    'bounceInLeft',
                    'bounceInRight',
                    'bounceInUp',
                    'bounceOut',
                    'bounceOutDown',
                    'bounceOutLeft',
                    'bounceOutRight',
                    'bounceOutUp',
                    'fadeIn',
                    'fadeInDown',
                    'fadeInDownBig',
                    'fadeInLeft',
                    'fadeInLeftBig',
                    'fadeInRight',
                    'fadeInRightBig',
                    'fadeInUp',
                    'fadeInUpBig',
                    'fadeOut',
                    'fadeOutDown',
                    'fadeOutDownBig',
                    'fadeOutLeft',
                    'fadeOutLeftBig',
                    'fadeOutRight',
                    'fadeOutRightBig',
                    'fadeOutUp',
                    'fadeOutUpBig',
                    'flipInX',
                    'flipInY',
                    'flipOutX',
                    'flipOutY',
                    'lightSpeedIn',
                    'lightSpeedOut',
                    'rotateIn',
                    'rotateInDownLeft',
                    'rotateInDownRight',
                    'rotateInUpLeft',
                    'rotateInUpRight',
                    'rotateOut',
                    'rotateOutDownLeft',
                    'rotateOutDownRight',
                    'rotateOutUpLeft',
                    'rotateOutUpRight',
                    'hinge',
                    'jackInTheBox',
                    'rollIn',
                    'rollOut',
                    'zoomIn',
                    'zoomInDown',
                    'zoomInLeft',
                    'zoomInRight',
                    'zoomInUp',
                    'zoomOut',
                    'zoomOutDown',
                    'zoomOutLeft',
                    'zoomOutRight',
                    'zoomOutUp',
                    'slideInDown',
                    'slideInLeft',
                    'slideInRight',
                    'slideInUp',
                    'slideOutDown',
                    'slideOutLeft',
                    'slideOutRight',
                    'slideOutUp',
                    'animated'
                ],
                type = (function(el){
                    var animations = {
                        animation: 'animationend',
                        OAnimation: 'oAnimationEnd',
                        MozAnimation: 'mozAnimationEnd',
                        WebkitAnimation: 'webkitAnimationEnd'
                    };
                    for (var t in animations) {
                        if (el.style[t] !== undefined) {
                            return animations[t];
                        }
                    }
                })(document.createElement('div'));
        let
                loaded = false,
                loading = false;

        function ready(load = false){
            return new Promise(resolve => {
                if (loaded === true || load === false) resolve();
                else if (loading === false) {
                    console.debug('loading', cssUrl);
                    loading = true;
                    loadcss(cssUrl).then(() => {
                        loaded = true;
                        listener.dispatchEvent(new Event('ready'));
                        resolve();
                    });

                } else {
                    listener.addEventListener('ready', () => {
                        resolve();
                    });
                }
            });
        }


        function load(elem, animation, callback){

            return new Promise(resolve => {
                if (!(elem instanceof  Element)) throw new Error('Invalid Argument element.');

                if (typeof animation === "function") {
                    callback = animation;
                    animation = undef;
                }
                animation = animation || def;

                if (typeof animation === 'string') {
                    let needLoadingCSS = !animation.split(/\s+/).every(x => ignoreRequire.includes(x));
                    ready(needLoadingCSS).then(()=>{
                        elem.classList.remove(...classList);
                        if (typeof callback === "function") {
                            elem.addEventListener(type, callback, {
                                once: true,
                                capture: false
                            });
                        }
                        elem.addEventListener(type, e => {
                            elem.classList.remove(...classList);
                            resolve(e);
                        }, {once: true, capture: false});

                        if (elem.hidden === true) elem.hidden = false;
                        else if (elem.classList.contains('hidden')) {
                            elem.classList.remove('hidden');
                        }
                        elem.classList.add('animated', ...animation.split(/\s+/));
                    });
                } else throw new Error('Invalid Argument animation.');
            });
        }


        return load;

    })();






    class Dialog {

        get container(){
            return this.options.container || doc.body;
        }
        get root(){
            return this.elements.root;
        }

        get dialog(){
            if (!this.container.contains(this.root)) this.container.appendChild(this.root);
            return this.elements.dialog;
        }

        get modal(){
            return this.elements.modal;
        }


        get body(){
            return this.elements.body;
        }

        get form(){
            return this.elements.form;
        }
        

        get returnValue(){
            return this.dialog.returnValue;
        }

        get open(){
            return this.dialog.open;
        }

        get isModal(){
            return this.dialog.matches('[modal]');
        }

        get ready(){
            return new Promise(resolve => {

                if (isReady) resolve(this);
                else listener.one('css.ready', () => {
                        resolve(this);
                    });

            });
        }

        show(container){
            if (!this.dialog.open) {
            if (container instanceof Element) this.options.container = container;
                this.dialog.show();
            }

        }
        showModal(container){
            if (!this.dialog.open) {
                if (container instanceof Element) this.options.container = container;
                this.dialog.showModal();
            }

        }

        close(returnValue){
            if (this.dialog.open === true) {
                this.dialog.close(returnValue);
            }

        }

        constructor(options){



            Object.defineProperties(this, {
                elements: {
                    enumerable: false, configurable: true, writable: true,
                    value: {
                        root: html2element('<div class="pure"/>'),
                        dialog: html2element(template),
                        modal: null,
                        buttons: {}
                    }
                },
                options: {
                    enumerable: false, configurable: true, writable: true,
                    value: {
                        events: {
                            buttons: {}
                        }
                    }
                },

                isReady: {
                    enumerable: true, configurable: true, writable: true,
                    value: false
                }
            });


            const
                    dialog = this.dialog,
                    $this = this,
                    modal = this.elements.modal = dialog.querySelector('.gm-modal');



            ['header', 'body', 'footer', 'form'].forEach(cls => {
                let
                        className = 'gm-dialog-' + cls,
                        elem = dialog.querySelector('.' + className);
                this.elements[cls] = elem;
            });

            dialog.querySelectorAll('[data-name].gm-btn').forEach(elem => {
                let name = elem.getAttribute('data-name');
                if (name.length > 0) this.elements.buttons[name] = elem;
            });



            polyfill.registerDialog(dialog);

            const
                    showModal = dialog.showModal,
                    show = dialog.show;



            
            dialog.showModal = (...args) => {
                this.ready.then(()=>{
                    try {
                        showModal.call(dialog, ...args);
                        dialog.setAttribute('modal', '');
                        dialog.dispatchEvent(new Event('show', {
                            bubbles: false,
                            cancelable: true
                        }));
                    } catch (e) {
                        throw e;
                    }
                });

            };

            dialog.show = (...args) => {
                this.ready.then(()=>{
                    if (!dialog.open) {
                        show.call(dialog, ...args);
                        dialog.dispatchEvent(new Event('show', {
                            bubbles: false,
                            cancelable: true
                        }));

                    }
                });

            };
            
            const resize = e => {
                setSize(this);
            };


            this.root.appendChild(this.dialog);
            Events(dialog, this)
                    .on('close cancel', e => {
                        dialog.removeAttribute('modal');
                        removeEventListener('resize', resize);
                        if (doc.querySelector('dialog.gm-dialog[open]') === null) {
                            doc.body.classList.remove('no-scroll');
                        }
                    })
                    .on('show', e => {
                        if (this.open) {

                            doc.body.classList.add('no-scroll');

                            modal.style['z-index'] = zindex++;
                            animate(modal, 'fadeIn').then(e => {
                                console.debug(e);
                                addEventListener('resize', resize);
                                ResizeSensor(this.body, e => {
                                    setSize(this);
                                });
                                setSize(this);
                            });

                        }


                    })
                    .on('confirm dismiss', e => {
                        let arg;
                        if (e.type === 'dismiss') arg = false;
                        animate(modal, 'fadeOut').then(e => {
                            console.debug(e);
                            this.close(arg);
                        });
                    })
                    .on('click', e => {
                        let target = e.target.closest('[data-name].gm-btn, [name].gm-btn');
                        if (target !== null) {
                            let name = target.dataset.name || target.name;
                            if(name.length > 0) {
                                if (target.type && !['submit', 'reset'].includes(target.type)) {
                                    e.preventDefault();
                                }
                                let callback = this.options.events.buttons[name];
                                if (gettype(callback, f)) callback.call(target, e);
                                else if (name === 'close') {
                                    this.trigger('dismiss');
                                } else if (name === 'dismiss') {
                                    this.trigger('dismiss');
                                } else if (name === 'confirm') {
                                    Events(this.form).trigger('submit');
                                }
                                
                            }
                        } else if (e.target.closest('.gm-modal') === null) {
                            console.debug('overlay click close');
                        }

                    });

            Events(this.form).on('submit', e => {
                let form = e.target.closest('form');
                this.dialog.returnValue = new FormData(form);
                e.preventDefault();
                this.trigger('confirm');
            });
            
            let scrollbarSize = getScrollbarWidth();
            if (scrollbarSize > 0) {
                if(!scrollBarStyles){
                    let
                            margin = 50 + scrollbarSize,
                            style = sprintf('.gm-scrollbar{padding-right: 50px; margin-right: -%dpx; }', margin);
                    addstyle(style);
                    scrollBarStyles = true;

                }
                this.body.classList.add('gm-scrollbar');

            }




            console.debug(this);

        }

    }
















    utils.loadcss(
            config.get('paths.styles') + 'all.css'
            )
            .then(() => {
                isReady = true;
                listener.trigger('css.ready');
            });

    return Dialog;
}));

