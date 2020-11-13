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

    const {int, n, f, s, u, b, html2element, doc, Events, gettype, ResizeSensor} = utils;

    let undef;

    const
            template = `<dialog class="gm-dialog">
                            <header class="gm-dialog-header">
                                <h1 class="gm-dialog-title">My big title to test my app</h1>
                                <span class="gm-btn" data-name="close">&times;</span>
                            </header>
                            <section class="gm-dialog-body">
                                <form method="dialog" class="gm-dialog-form">
                                    <fieldset>
                                        <legend>Body</legend>
                                        <label>Name</label><input type="text" name="name">
                                    </fieldset>
                                    <fieldset>
                                        <legend>Select Box</legend>
                                        <label>Servers</label>
                                        <select name="sel">
                                            <option value="1">four</option>
                                            <option value="2">My long string to test the select box</option>
                                        </select>
                                    </fieldset>

                                </form>
                            </section>
                            <footer class="gm-dialog-footer">
                                <span class="gm-btn error" data-name="dismiss">No</span>
                                <span class="gm-btn primary" data-name="confirm">Yes</span>
                            </footer>
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
    function setSize(target){

        if(!doc.body.contains(target.dialog)) return ;

        let dialog = target.dialog, root = target.elements, body = root.body;
        body.style["max-height"] = body.style.height = body.style["min-height"] = null; //reset style

        let
                //rect = dialog.getBoundingClientRect(),
                // top = Math.round(rect.top),
                max = innerHeight,
                dialogHeight = dialog.offsetHeight,
                headerHeight = root.header.offsetHeight < 64 ? 64 : root.header.offsetHeight,
                footerHeight = root.footer.offsetHeight < 64 ? 64 : root.footer.offsetHeight,
                minus = headerHeight + footerHeight,
                available = dialogHeight - minus,
                current = body.offsetHeight;

        console.debug({
            max, dialogHeight, headerHeight, footerHeight, minus, available, current
        });

        if (current > available) body.style["max-height"] = available + "px";
        if ((dialogHeight > available) || (max < 640) || (innerWidth < 950) || target.dialog.classList.contains('fullscreen')) {
            available--;
            body.style.height = available + "px";
            body.style["min-height"] = "0";
        }

    }






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


        get body(){
            return this.elements.body;
        }

        get form(){
            return this.options.form;
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
                    $this = this;

            ['header', 'body', 'footer'].forEach(cls => {
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
                dialog.classList.remove('fadeIn', 'fadeOut');
                try {
                    dialog.classList.add('fadeIn');
                    showModal.call(dialog, ...args);
                    dialog.setAttribute('modal', '');
                    dialog.dispatchEvent(new Event('show', {
                        bubbles: false,
                        cancelable: true
                    }));
                } catch (e) {
                    throw e;
                }


            };

            dialog.show = (...args) => {
                dialog.classList.remove('fadeIn', 'fadeOut');
                if (!dialog.open) {
                    dialog.classList.add('fadeIn');
                    show.call(dialog, ...args);
                    dialog.dispatchEvent(new Event('show', {
                        bubbles: false,
                        cancelable: true
                    }));
                    
                }
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
                            console.debug('all dialogs closed');
                        }
                    })
                    .on('show', e => {

                        if (e.target === dialog) {
                            if (this.open) {
                                doc.body.classList.add('no-scroll');
                                if (this.isModal) dialog.style.top = null;
                                addEventListener('resize', resize);
                                ResizeSensor(this.body, e => {
                                    setSize(this);
                                });
                                setSize(this);
                            }

                        }

                    })
                    .on('confirm dismiss', e => {
                        let arg;
                        if (e.type === 'dismiss') arg = false;
                        dialog.classList.remove('fadeIn', 'fadeOut');
                        dialog.classList.add('fadeOut');
                        setTimeout(() => {
                            this.close(arg);
                        }, 750);

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
                this.body.style["margin-right"] = `-${ 50 + scrollbarSize }px`; //adds the scrollbar size
                this.body.style["padding-right"] = "50px"; // do not add the scrollbar size to prevent layout gap
            }




            console.debug(this);

        }

    }
















    utils.loadcss(config.get('paths.styles') + 'reset.css');
    // utils.loadcss(config.get('paths.styles') + 'dialog.css');
    utils.loadcss(config.get('paths.styles') + 'main.css');

    return Dialog;
}));

