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
            template = `<dialog class="gm-dialog fadeIn">
                            <header class="gm-dialog-header">
                                <h1 class="gm-dialog-title">Title</h1>
                                <span class="gm-btn" data-name="close">&times;</span>
                            </header>
                            <form method="dialog" class="gm-dialog-body">
                                <fieldset>
                                    <legend>Body</legend>
                                    <label>Name</label><input type="text" name="name">
                                </fieldset>

                            </form>
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

        const body = target.body;

        body.style["max-height"] = body.style.height = null; //reset style
        let
                max = target.overlay.offsetHeight,
                dialogHeight = target.dialog.offsetHeight,
                minus = target.header.offsetHeight + target.footer.offsetHeight + 16,
                available = max - minus - 1,
                current = body.offsetHeight;

        if (current > available) body.style["max-height"] = available + "px";
        if ((dialogHeight > max) || (max < 640) || (innerWidth < 950) || target.dialog.classList.contains('fullscreen')) {
            body.style.height = available + "px";
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
        

        get returnValue(){
            return this.dialog.returnValue;
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
                dialog.setAttribute('modal', '');
                showModal.call(dialog, ...args);
                dialog.dispatchEvent(new Event('showmodal', {
                    bubbles: false,
                    cancelable: true
                }));
            };

            dialog.show = (...args) => {
                show.call(dialog, ...args);

                dialog.dispatchEvent(new Event('show', {
                    bubbles: false,
                    cancelable: true
                }));

            };

            dialog.dispatchEvent = function(...args){
                console.debug(...args);

                return EventTarget.prototype.dispatchEvent.call(dialog, ...args);
            };
            
            


            this.root.appendChild(this.dialog);
            Events(dialog, this)
                    .on('close cancel', () => {
                        dialog.removeAttribute('modal');
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
                                    this.close(false);
                                } else if (name === 'dismiss') {
                                    this.close(false);
                                } else if (name === 'confirm') {
                                    Events(this.body).trigger('submit');
                                    //this.body.submit();
                                }
                                
                            }
                        }
                        /* target = e.target.closest('dialog');
                        if (target !== dialog) {

                            console.debug('overlay click close');

                        }*/

                    })
                    .on('focus blur', e => {
                        console.debug(e);
                    });

            Events(this.body).on('submit', e => {
                //e.preventDefault();
                let form = e.target.closest('form');
                this.dialog.returnValue = new FormData(form);

                //console.debug(Object.fromEntries(data.entries()));
                
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

