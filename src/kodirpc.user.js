// ==UserScript==
// @name         KodiRPC 2.0
// @namespace    https://github.com/ngsoft/userscripts
// @version      2.0
// @description  Sends Video Streams to Kodi
// @author       ngsoft
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.1/dist/gmutils.min.js
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_xmlhttpRequest
// @compatible  firefox+greasemonkey(3.17)
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




    JSON.RPCRequest = function(method, params, id){
        params = params || {};
        if ((typeof method === s) && (params instanceof Object)) {
            let request = {
                    jsonrpc: '2.0',
                    method: method,
                    params: params
                };
                
                if(typeof id === n) request.id = id;
                
            return this.stringify(request);
        }
        return undef;

    };



    class KodiRPCServer {


        set name(name){
            if (typeof name === s) {
                this._params.name = name;
            }
        }

        get name(){
            return this._params.name;
        }


        set host(h){
            if (typeof h !== s) return;
            let valid = true;
            if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(h)) { //ipv4

                h.split('.').forEach((str)=>{ 
                    let n = parseInt(str);
                    if(n > 254) valid = false;
                });
            } else if (!(/^[a-z](?:[\w\.]+\w)$/.test(h))) valid = false;
            if (valid === true) this._params.host = h;
        }

        get host(){
            return this._params.host;
        }

        set pathname(p){
            if (typeof p !== s) return;
            if (/^\/(?:[\w\-\.@]+[\/]?)+$/.test(p)) this._params.pathname = p;
        }

        get pathname(){
            return this._params.pathname;
        }

        set user(user){
            if (user === null) {
                this._params.username = this._params.auth = null;
                return;
            }
            if (typeof user !== s) return;
            if (/^\w+$/.test(user)) {
                this._params.username = user;
            }


        }
        get user(){
            return this._params.username;
        }

        set port(p){
            if (typeof p !== n) return;
            if ((p > 0) && (p < 65536)) this._params.port = p;
        }

        get port(){
            return this._params.port;
        }


        set auth(pass){
            if ((typeof pass === s) && (this.user !== null)) {
                this._params.auth = btoa(this.user + ':' + pass);
            } else if (pass === null) {
                this._params.auth = null;
            }

        }

        get auth(){
            return this._params.auth;
        }



        get address(){
            return  new URL('http://' + this.host + ':' + this.port + this.pathname);
        }

        get headers(){
            const headers = {
                "Content-Type": "application/json"
            };
            if (typeof this._params.auth === s) headers["Authorization"] = 'Basic ' + this._params.auth;
            return headers;

        }


        constructor(params){

            let defs = {
                name: 'localhost',
                host: "127.0.0.1",
                port: 8080,
                pathname: '/jsonrpc',
                username: null,
                auth: null
            };

            if (isPlainObject(params)) Object.assign(defs, params);
            this._params = defs;
        }

    }


    class KodiRPCClient {

        get settings(){
            const self = this;
            if (typeof this._settings === u) {
                this._settings = new UserSettings({
                    servers: [
                        {name: 'localhost', host: "127.0.0.1"}
                    ],
                    blacklist: [],
                    selector: `video[src^="http"], video source[src^="http"]`

                });
            }
            return  {
                servers: this._settings.get('servers').map(d => new KodiRPCServer(d)),
                blacklist: this._settings.get('blacklist'),
                selector: this._settings.get('selector')
            };
        }

        get servers(){
            if (typeof this._servers === u) this._servers = this.settings.servers;
            return this._servers;
        }

        get blacklist(){
            if (typeof this._blacklist === u) this._blacklist = this.settings.blacklist;
            return this._blacklist;
        }


        RPCsend(server, method, params, success, error){

            params = params || {};
            error = (typeof error === f) ? error : x => x;
            if (!(server instanceof KodiRPCServer)) {
                throw new Error("server not instance of KodiRPCServer");
            }
            if (typeof method !== s) throw new Error("Invalid Method");
            if (!(params instanceof Object)) throw new Error("Invalid Params");
            if (typeof success !== f) throw new Error("No Callback on RPC Success");
            let request = JSON.RPCRequest(method, params, Math.floor(Math.random() * (99 - 1) + 1));
            if (typeof request === s) {

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: server.address,
                    data: request,
                    headers: server.headers,
                    onload(xhr){
                        let response;
                        if (xhr.status === 200) {
                            try {
                                response = JSON.parse(xhr.response);
                                if (typeof response.error !== u) return error.call(self, response.error.code, server);
                                else return success.call(self, response, server);

                            } catch (e) {
                            }
                        }
                        error.call(self, xhr.status, server);

                    },
                    onerror(xhr){
                        error.call(self, xhr.status, server);
                    }
                });


            }



        }


        send(method, params, ...args){

            const self = this, defs = {
                client: null,
                success: null,
                error: x => x
            };

            args.forEach(arg => {
                switch (typeof arg) {
                    case o:
                        if (isPlainObject(arg)) Object.assign(defs, arg);
                        break;
                    case n:
                        defs.client = arg;
                        break;
                    case f:
                        if (typeof defs.success === f) defs.error = arg;
                        else defs.success = arg;
                        break;
                }
            });

            let client = defs.client, success = defs.success, error = defs.error, clients = [];

            const servers = this.servers;
            if (typeof client === n) {
               if(typeof servers[client] !== u) clients.push(servers[client]);
            } else clients = servers;

            if (clients.length < 1) return;

            if (typeof method === s) {
                if ((typeof request === s) && (typeof success === f)) {
                    clients.forEach(server => self.sendRPC(server, method, params, success, error));
                }
            }
        }

        constructor(){


            if (this.blacklist.indexOf(location.host) !== -1) {
                return;
            }






        }

    }


    /**
     * gmdialog.js
     */
    class gmDialog {

        static applyStyles(){
            if (this.styles === true) return;
            this.styles = true;
            addstyle(`
                [class*="gm-"]{font-family: Arial,Helvetica,sans-serif;font-size: 16px; font-weight: normal;line-height: 1.5;box-sizing: border-box;padding:0;margin:0;}
                .gm-dialog-overlay{position: fixed; top:0;left:0; right:0; bottom:0; z-index: 2147483647; background-color: rgba(0, 0, 0, 0.45);}
                .gm-dialog{
                    position: absolute; top:5%; left: 50%; transform: translate(-50%,0);
                    background-color: #FFF; border-radius: 6px;border: none; min-width: 256px; width: 60%;
                }
                .gm-btn{
                    padding: 8px 24px;border-radius: 4px; border: 1px solid rgba(0,0,0,0);cursor: pointer;
                    background-color: rgba(0,0,0,.125);border: 1px solid rgba(255,255,255,.25);color: rgb(28, 29, 30);
                    font-size: 16px;font-weight: 700;min-width: 96px;margin: 8px 4px;
                }
                .gm-btn:hover, .gm-btn:active{  background-color: rgb(28, 29, 30);color: rgb(255, 255, 255); }
                .gm-btn + .gm-btn{margin-left: 16px;}
                .gm-dialog-header .gm-btn-close{padding: 3px 16px;position: absolute;top: 10px;right: 12px;}
                .gm-btn-no{ color: rgb(219, 40, 40); }
                .gm-btn-no:hover, .gm-btn-no:active{ background-color: rgb(219, 40, 40); color: rgb(255, 255, 255); }
                .gm-btn-yes{ color: rgb(30, 130, 205); }
                .gm-btn-yes:hover, .gm-btn-yes:active{ background-color: rgb(30, 130, 205);color: rgb(255, 255, 255); }
                .gm-btn-close{min-width: auto;}
                .gm-dialog-header, .gm-dialog-footer{min-height: 56px;padding: 8px 24px 12px 24px;background-color: rgba(0,0,0,.03);position: relative;}
                .gm-dialog-header, .gm-dialog-body {border-bottom:1px solid rgba(0,0,0,.125);}
                .gm-dialog-header{background-color: rgba(0,0,0,.03);}
                .gm-dialog-body{min-height: 96px;text-align: center; font-size: 24px; font-weight: normal;line-height: 1.5;padding: 24px;color: #333;position:relative;}
                .gm-dialog-body > *{margin: -24px; padding: 8px 24px;text-align: left;font-size: 20px;}
                .gm-dialog-footer{ text-align: right;}
                .gm-dialog-title{position: absolute;top:12px;left:24px;font-size: 20px; font-weight: normal;line-height: 1.5; color: #333; text-decoration: none;}
                .gm-dialog input, .gm-dialog textarea, .gm-dialog select{font-family: Arial,Helvetica,sans-serif;line-height: 1.5;font-weight: 700;color:#333;font-size: 16px;}
                .gm-dialog .placeholder, .gm-dialog input::placeholder{color: gray;}
                .gm-dialog fieldset{text-align: left; padding: 8px 16px;margin: 16px 0;border: none;font-size:16px;font-weight: 700;}
                .gm-dialog fieldset + fieldset{border-top: 1px solid rgba(0,0,0,.125);margin-top:0;}
                .gm-dialog fieldset label{display: block;margin: 0;}
                .gm-dialog input, .gm-dialog select, .gm-dialog textarea{
                    width: 100%;padding: 6px 10px;margin: 4px 0;box-sizing: border-box;
                    border-radius: 4px; background-color: rgba(0,0,0,.03);border: 1px solid rgba(0,0,0,.125);
                    -moz-appearance: textfield;-webkit-appearance: none;-o-appearance: none;text-align: center;
                }
                .gm-dialog fieldset label + input{margin-top:0;}
                .gm-dialog input:focus, .gm-dialog select:focus, .gm-dialog textarea:focus{border: 1px solid rgb(0, 153, 204);}
                .gm-dialog select {
                    background-image:linear-gradient(45deg, transparent 50%, gray 50%),linear-gradient(135deg, gray 50%, transparent 50%), linear-gradient(to right, #ccc, #ccc);
                    background-position: calc(100% - 20px) 14px,calc(100% - 15px) 14px,calc(100% - 40px) 4px;
                    background-size: 5px 5px, 5px 5px, 1px calc(100% - 8px);
                    background-repeat: no-repeat;
                }
                        
                .gm-dialog .flash-message {
                    padding: 12px 20px; margin: 8px 0;border: 1px solid transparent;border-radius: 4px;
                    color: #1b1e21;background-color: #d6d8d9;border-color: #c6c8ca;
                }
                .gm-dialog .flash-message.success{color: #155724;background-color: #d4edda;border-color: #c3e6cb;}
                .gm-dialog .flash-message.error{color: #721c24;background-color: #f8d7da;border-color: #f5c6cb;}

                .gm-dialog *:not(input):not(textarea){-webkit-touch-callout: none;-webkit-user-select: none;-moz-user-select: none;user-select: none;}
                .gm-dialog [disabled], .gm-dialog .disabled{pointer-events: none;color: gray;}
                .gm-dialog [hidden], .gm-dialog .hidden{display:none;}
                @keyframes fadeIn {from {opacity: 0;}to {opacity: 1;}}
                @keyframes fadeOut {from {opacity: 1;}to {opacity: 0;}}
                .fadeIn {animation-name: fadeIn;animation-duration: .75s;animation-fill-mode: both;}
                .fadeOut {animation-name: fadeOut;animation-duration: .75s;animation-fill-mode: both;}

            `);


        }


        set title(t){
            if ((typeof t === s)) this.elements.title.innerHTML = t;
        }

        set body(body){
            if (typeof body === s) this.elements.body.innerHTML = body;
            else if (body instanceof Element) {
                this.elements.body.innerHTML = "";
                this.elements.body.appendChild(body);
            }
        }


        open(callback){
            if (typeof callback === f) this.one('confirm', callback);
            this.trigger('open');
        }

        close(){
            this.trigger('close');
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
                    buttons:{
                        yes: html2element(`<button class="gm-btn gm-btn-yes" name="yes" />`),
                        no: html2element(`<button class="gm-btn gm-btn-no" name="no" />`),
                        close: html2element('<button class="gm-btn gm-btn-close" name="close">&times;</button>')
                    }
                },
                config: Object.assign({
                    overlayclickclose: true,
                    buttons:{
                        yes: "Yes",
                        no: "No"
                    },
                    events: {},
                    title: doc.title,
                    body: ""
                }, settings),
                events:{
                    btn_yes(){
                        this.trigger("confirm close");
                    },
                    btn_no(){
                        this.trigger('close');
                    },
                    btn_close(){
                        this.trigger('close');
                    }

                }
            });
            const self = this;

            self.root.appendChild(self.elements.dialog);
            self.elements.dialog.appendChild(self.elements.header);
            self.elements.dialog.appendChild(self.elements.body);
            self.elements.dialog.appendChild(self.elements.footer);
            self.elements.header.appendChild(self.elements.title);
            self.elements.header.appendChild(self.elements.buttons.close);
            self.elements.footer.appendChild(self.elements.buttons.no);
            self.elements.footer.appendChild(self.elements.buttons.yes);

            Object.keys(self.config.buttons).forEach(btn => {
                if (self.elements.buttons[btn] instanceof Element) self.elements.buttons[btn].innerHTML = self.config.buttons[btn];
            });

            new Events(self.root, self);


            self.title = self.config.title;
            self.body = self.config.body;

            Object.keys(self.config.events).forEach(evt => self.events[evt] = self.config.events[evt]);
            Object.keys(self.events).forEach(evt => self.on(evt, self.events[evt]));

            self.on('open close', e => {
                self.elements.dialog.classList.remove('fadeOut', 'fadeIn');
                if (e.type === "open") {

                    self.elements.dialog.classList.add('fadeIn');
                    self.parent.appendChild(self.root);
                    setTimeout(x => self.trigger('show'), 750);
                }
                else {
                    self.elements.dialog.classList.add('fadeOut');
                    setTimeout(() => {
                        self.parent.removeChild(self.root);
                        self.trigger('hide');
                    }, 750);
                }

            }).on('click', e => {
                if ((e.target.closest('.gm-dialog') === null) && (self.config.overlayclickclose === true)) self.close();
                let btn = e.target.closest('button[name]');
                if(btn !== null){
                    let name = btn.getAttribute('name'), type = "btn_" + name;
                    self.trigger(type);
                }

            });


            gmDialog.applyStyles();
        }
    }

    class gmFlash {


        static applyStyles(){
            if (this.styles === true) return;
            this.styles = true;
            addstyle(`
                .gm-flash{font-family: Arial,Helvetica,sans-serif;font-size: 16px; font-weight: normal;line-height: 1.5;box-sizing: border-box;padding:0;margin:0;}
                .gm-flash {padding: 12px 20px; margin: 8px 0;border: 1px solid transparent;border-radius: 4px;}
                .gm-flash {color: #383d41; background-color: #e2e3e5; border-color: #d6d8db;}
                .gm-flash.success{color: #155724;background-color: #d4edda;border-color: #c3e6cb;}
                .gm-flash.error{color: #721c24;background-color: #f8d7da;border-color: #f5c6cb;}
                .gm-flash.warning {color: #856404;background-color: #fff3cd;border-color: #ffeeba;}
                .gm-flash.info {color: #0c5460;background-color: #d1ecf1;border-color: #bee5eb;}
                @keyframes fadeInFlash {from {opacity: 0;}to {opacity: 1;}}
                @keyframes fadeOutFlash {from {opacity: 1;}to {opacity: 0;}}
                .fadeInFlash {animation-name: fadeIn;animation-duration: .75s;animation-fill-mode: both;}
                .fadeOutFlash {animation-name: fadeOut;animation-duration: .75s;animation-fill-mode: both;}
            `);
        }
        _create(message, classname, onshow, onhide){
            classname = classname || "";
            if (typeof message === s) {
                const self = this;
                let el = doc.createElement('div');
                el.classList.add('gm-flash');
                if (classname.length > 0) el.classList.add(...classname.split(' '));
                el.innerHTML = message;
                const evts = Events(el);
                if (typeof onshow === f) evts.one('show', onshow);
                if (typeof onhide === f) evts.one('hide', onhide);
                evts.on('open close', e => {
                    e.stopPropagation();
                    if (e.type === "open") {
                        if (self.config.fade === true) {
                            el.classList.add('fadeInFlash');
                            setTimeout(x => evts.trigger('show'), 750);
                        } else evts.trigger('show');
                    } else if (self.config.fade === true) {
                        el.classList.remove('fadeInFlash');
                        el.classList.add('fadeOutFlash');
                        setTimeout(x => evts.trigger('hide'), 750);
                    } else evts.trigger('hide');
                });

                let parent = self.root, before = null;
                if (self.config.after === true) {
                    parent = self.root.parentElement;
                    before = self.root.nextElementSibling;
                }
                evts.on('show hide', e => {
                    e.stopPropagation();
                    if (e.type === 'show') {
                        if (self.config.timeout > 0) setTimeout(x => evts.trigger('close'), self.config.timeout);
                        if (typeof self.config.onshow === f) self.config.onshow.call(el, e);
                    } else {
                        if (typeof self.config.onhide === f) self.config.onhide.call(el, e);
                        el.remove();
                    }
                });
                evts.on('click', (e) => {
                    e.stopPropagation();
                    evts.trigger('hide');
                });
                parent.insertBefore(el, before);
                evts.trigger('open');
            }
        }


        set message(message){
            this._create(message);
        }
        set info(message){
            this._create(message, 'info');
        }

        set warning(message){
            this._create(message, 'warning');
        }
        set success(message){
            this._create(message, 'success');
        }
        set error(message){
            this._create(message, 'error');
        }


        constructor(container, params){
            params = params || {};
            const self = this;
            Object.assign(this, {
                root: container,
                config: Object.assign({
                    timeout: 2000,
                    fade: true,
                    after: false,
                    onshow: null,
                    onhide: null
                }, params),

            });



            gmFlash.applyStyles();
        }


    }



    class KodiRPCConfig {

        _configure(val){
            const self = this;
            let server = self.servers[val];
            self.elements.selection.classList.add('hidden');
            self.elements.config.classList.remove('hidden');
            ["name", "host", "port", "pathname", "user"].forEach(i => {
                let input = self.elements.inputs[i], val = server[i];
                input.setAttribute("value", "");
                input.value = "";
                if (val !== null) {
                    input.setAttribute("value", val);
                    input.value = val;
                }
            });
            self.elements.inputs.pass.value = "";
            self.elements.buttons.check.disabled = null;

        }



        constructor(client){


            let template = `<form class="kodirpc-config">
                                <fieldset class="kodirpc-server-toolbar" style="text-align:center;">
                                    <button class="gm-btn" name="select">Select Server</button>
                                    <button class="gm-btn gm-btn-yes" name="add">Add Server</button>
                                    <button class="gm-btn gm-btn-no" name="rm">Remove Server</button>
                                    <button class="gm-btn" name="check">Test Connection</button>
                                </fieldset>
                                <fieldset class="kodirpc-server-selection">
                                    <label>Servers:</label>
                                    <select name="serverid" placeholder="Select Server"></select>
                                </fieldset>
                                <fieldset class="kodirpc-server-config hidden">
                                    
                                    <label>Name:</label>
                                    <input type="text" name="name" value="" placeholder="Name" required />
                                
                                    <label>Hostname:</label>
                                    <input type="text" name="host" value="" placeholder="Host" required />
                                    <label>Port:</label>
                                    <input type="number" name="port" value="" placeholder="Port" min="1" max="65535" required />
                                    <label>Endpoint:</label>
                                    <input type="text" name="pathname" value="" placeholder="Endpoint" required />
                                
                                    <label>Authentification:</label>
                                    <input type="text" name="user" value="" placeholder="Username" />
                                    <input type="password" name="pass" value="" placeholder="Password" />
                                </fieldset>
                                
                            </form>`;
            const self = this;
            Object.assign(this, {
                title: "KodiRPC Settings",
                root: html2element(template),
                dialog: new gmDialog(doc.body, {
                    buttons: {
                        yes: "Save",
                        no: "Close"
                    },
                    events: {
                        show(){
                            console.debug(self, "show");
                            self.trigger('reset');
                        }
                    }
                }),
                client: client,
                servers: [],
                current: -1,
                events: {
                    reset(){
                        const buttons = self.elements.buttons, inputs = self.elements.inputs;
                        Object.keys(self.elements).forEach(name => {
                            let el = self.elements[name];
                            if (el instanceof Element) el.classList.remove('hidden');
                        });
                        Object.keys(buttons).forEach(name => {
                            let btn = buttons[name];
                            btn.disabled = null;
                        });
                        Object.keys(inputs).forEach(name => {
                            let input = inputs[name];
                            if (input.tagName === "INPUT") input.setAttribute('value', "");
                            else input.classList.remove('placeholder');
                        });
                        self.elements.config.classList.add('hidden');
                        buttons.save.disabled = buttons.select.disabled = buttons.check.disabled = true;
                        self.servers = self.client.settings.servers;
                        self.trigger("init");
                    },
                    init(e){
                        //initialize server list
                        const select = self.elements.inputs.serverid;
                        select.querySelectorAll('option').forEach(opt => select.removeChild(opt));
                        let placeholder = select.getAttribute('placeholder'), el = html2element(`<option data-role="placeholder" value="" disabled hidden selected/>`);
                        el.innerHTML = placeholder;
                        select.appendChild(el);
                        select.selectedIndex = 0;
                        select.classList.add('placeholder');
                        self.servers.forEach((item, index) => {
                            let opt = doc.createElement('option');
                            Object.assign(opt, {
                                value: index
                            });
                            opt.innerHTML = item.name;
                            select.appendChild(opt);
                        });
                        self.elements.buttons.rm.disabled = null;
                        //only one server
                        if (self.servers.length === 1) {
                            self.elements.buttons.rm.disabled = true;
                            select.querySelectorAll('option').forEach(opt => opt.removeAttribute('selected'));
                            Events(select).trigger("change");
                        }
                    },
                    change(e){
                        let target = e.target.closest('[name]');

                        if (target !== null) {
                            let name = target.getAttribute("name");
                            if (typeof events[name] === f) events[name].call(target, e);
                        }
                    },
                    click(e){
                        if (e.target.closest('[name]') !== null) e.preventDefault();
                        let btn = e.target.closest('button[name]');
                        if (btn !== null) {
                            let name = btn.getAttribute('name');
                            if (typeof events[name] === f) events[name].call(btn, e);
                        }


                    }
                }
            });
            self.elements = {
                selection: self.root.querySelector('.kodirpc-server-selection'),
                config: self.root.querySelector('.kodirpc-server-config'),
                toolbar: self.root.querySelector('.kodirpc-server-toolbar'),
                flash: html2element(`<div class="kodirpc-server-flash" style="cursor:pointer;overflow:hidden;position: absolute; bottom:12px; right: 12px;width:400px;text-align: center;"></div>`),
                inputs: {},
                buttons: {
                    save: self.dialog.elements.buttons.yes,
                    close: self.dialog.elements.buttons.no
                }
            };

            self.root.querySelectorAll('input[name], select[name]').forEach(el => {
                let name = el.getAttribute("name");
                self.elements.inputs[name] = el;
            });
            self.root.querySelectorAll('button[name]').forEach(el => {
                let name = el.getAttribute("name");
                self.elements.buttons[name] = el;
            });




            const events = {
                serverid(){
                    if (this.value.length > 0) {
                        let val = JSON.parse(this.value);
                        this.querySelectorAll('[data-role="placeholder"]').forEach(el => this.removeChild(el));
                        this.classList.remove('placeholder');
                        self.current = -1;
                        self.elements.buttons.select.disabled = self.elements.buttons.rm.disabled = true;
                        if (typeof self.servers[val] !== u) {
                            self.current = val;
                            self._configure(val);
                            if (self.servers.length > 1) {
                                self.elements.buttons.select.disabled = self.elements.buttons.rm.disabled = null;
                            }
                        }
                    }
                },
                name(){
                    let val = this.value, server = self.servers[self.current];
                    server.name = val;
                    if (val === server.name) {
                        self.elements.buttons.save.disabled = null;
                    }
                    this.value = server.name;

                },
                host(){
                    let val = this.value, server = self.servers[self.current];
                    server.host = val;
                    if (val === server.host) {
                        self.elements.buttons.save.disabled = null;
                    }
                    this.value = server.host;


                },
                pathname(){
                    let val = this.value, server = self.servers[self.current];
                    server.pathname = val;
                    if (val === server.pathname) {
                        self.elements.buttons.save.disabled = null;
                    }
                    this.value = server.pathname;


                },
                port(){

                    let val, server = self.servers[self.current];

                    try {
                        val = JSON.parse(this.value);
                        server.port = val;
                        if (val === server.port) {
                            self.elements.buttons.save.disabled = null;
                        }
                    } catch (e) {
                        this.value = server.port;
                    }

                    console.debug(server.port);

                },
                user(){
                    let val = this.value, server = self.servers[self.current];
                    if (val.length === 0) val = null;
                    server.user = val;
                    if (val === server.user) {
                        self.elements.buttons.save.disabled = null;
                    }
                    this.value = server.user === null ? "" : server.user;
                },
                pass(){
                    let val = this.value, server = self.servers[self.current];
                    if (val.length === 0) val = null;
                    server.auth = val;
                    if (server.auth !== null) {
                        self.elements.buttons.save.disabled = null;
                    } else this.value = "";
                },


                add(){
                    self.servers.push(new KodiRPCServer({name: "New Server " + self.servers.length}));
                    self.current = self.servers.length - 1;
                    self._configure(self.current);
                    self.elements.buttons.select.disabled = null;
                    self.trigger('init');
                },
                rm(){
                    self.servers.splice(self.current, 1);
                    self.trigger('init');
                    events.select();
                },
                select(){
                    self.current = -1;
                    self.elements.config.classList.add('hidden');
                    self.elements.selection.classList.remove('hidden');
                    self.elements.buttons.rm.disabled = self.elements.buttons.select.disabled = self.elements.buttons.check.disabled = true;
                },
                check(){

                    let server = self.servers[self.current], flash = new gmFlash(self.elements.flash);
                    flash.info = 'Connecting to ' + server.name + ' ...';


                    self.client.RPCsend(server, "Playlist.GetPlaylists", {}, json => {
                        console.debug(json);
                        flash.success = "Server " + server.name + " available.";
                    }, errcode => {
                        console.error(errcode);
                        flash.error = "Cannot connect to " + server.name + " (" + errcode + ")";
                    });




                }
            };

            new Events(self.root, self);

            Object.keys(self.events).forEach(evt => self.on(evt, self.events[evt]));

            self.dialog.title = self.title;
            self.dialog.body = self.root;
            self.dialog.root.appendChild(self.elements.flash);
            self.dialog.open();



        }
    }







    /* let d = new gmDialog(doc.body, {
        body: `<form>
                                
                                    <fieldset>
                                        <label>Server</label>
                                        <select><option value="0" name="server">localhost</option><option value="1">chromebox</option></select>
                                    </fieldset>
                                    <fieldset>
                                        <label>Text</label>
                                        <textarea name="text"></textarea>
                                    </fieldset>
                                    <fieldset>
                                        <label>Hostname</label>
                                        <input type="text" name="host" value="" placeholder="Host" required />
                                    </fieldset>
                                    <fieldset>
                                        <label>Port</label>
                                        <input type="number" name="port" value="8080" placeholder="Port" min="1" max="65535" required />
                                    </fieldset>
                           
                            </form>`
    });
    d.open();*/

    const kodi = new KodiRPCClient();


    new KodiRPCConfig(kodi);

})(document);