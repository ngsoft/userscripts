// ==UserScript==
// @name         KodiRPC 2.0
// @namespace    https://github.com/ngsoft/userscripts
// @version      2.0
// @description  Sends Video Streams to Kodi
// @author       ngsoft
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.1.9/dist/gmutils.min.js
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_xmlhttpRequest
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

    class KodiRPCBlacklist {

        get list(){
            return this._list;
        }

        get dirty(){
            return this._dirty;
        }
        set dirty(flag){
            this._dirty = flag === true;
        }
        _getHost(url){
            let host;
            if (typeof url === s) {
                if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(url)) { //ipv4
                    let valid = true;
                    url.split('.').forEach((str) => {
                        let n = parseInt(str);
                        if (n > 254) valid = false;
                    });
                    if (valid === true) host = url;
                } else if (/^[a-z](?:[\w\.]+\w)$/.test(url)) host = url;
                else if (url = getURL(url)) {
                    let o = new URL(url);
                    host = o.host;
                }
            }

            return host;
        }


        has(url){
            let host = this._getHost(url);
            return (typeof host === s) ? this.list.includes(host) : false;
        }

        add(url){

            let host = this._getHost(url);
            if ((typeof host === s) && !(this.has(host))) {
                this.list.push(host);
                this.dirty = true;
            }
            return this.has(url);
        }

        remove(url){
            let host = this._getHost(url);
            if ((typeof host === s) && (this.has(host))) {
                this.list.splice(this.list.indexOf(host), 1);
                this.dirty = true;
            }
            return !this.has(url);
        }

        constructor(data){
            if (Array.isArray(data)) this._list = data;
            else this._list = [];

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
                    blacklist: []

                });
            }
            return  {
                servers: this._settings.get('servers').map(d => new KodiRPCServer(d)),
                blacklist: new KodiRPCBlacklist(this._settings.get('blacklist'))
            };
        }

        get servers(){
            return this.settings.servers;
        }

        get blacklist(){
            return this.settings.blacklist;
        }


        sendRPCRequest(server, method, params, success, error){

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


        sendRequest(method, params, ...args){

            const self = this, defs = {
                servers: [],
                success: null,
                error: x => x
            };

            args.forEach(arg => {
                if (Array.isArray(arg)) {
                    if (arg.every(x => (x instanceof KodiRPCServer))) defs.servers = arg;
                } else if (isPlainObject(arg)) Object.assign(defs, arg);
                else if (typeof arg === f) {
                    if (typeof defs.success === f) defs.error = arg;
                    else defs.success = arg;
                }
            });

            let servers = defs.servers, success = defs.success, error = defs.error;

            if (servers.length === 0) servers = this.servers;

            if (servers.length < 1) return;
            if (typeof method === s) {
                if ((typeof request === s) && (typeof success === f)) {
                    servers.forEach(server => self.sendRPCRequest(server, method, params, success, error));
                }
            }
        }


        send(link, success, error){
            console.debug(link);
        }


        addBlacklist(link, success, error){
            if(typeof link === s){
                let blacklist = this.blacklist;
                success = (typeof success === f) ? success : x => x;
                error = (typeof error === f) ? error : x => x;
                
                if(blacklist.add(link)){
                    if(blacklist.dirty === true){
                        this._settings.set('blacklist', blacklist.list);
                    }
                    success(link);
                    return;
                }
            }
            error(link);
        }


        constructor(){









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


        constructor(open, close){

            const client = new KodiRPCClient();

            let template = `<form class="kodirpc-config">
                                <fieldset class="kodirpc-server-toolbar" style="text-align:center;margin: -8px 0 0 0">
                                    <button class="gm-btn" name="select">Select Server</button>
                                    <button class="gm-btn gm-btn-yes" name="add">Add Server</button>
                                    <button class="gm-btn gm-btn-no" name="rm">Remove Server</button>
                                    <br>
                                    <button class="gm-btn" name="check">Test Connection</button>
                                    <button class="gm-btn" name="blacklist">Manage Blacklist</button>
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
                title: GMinfo.script.name + " Settings",
                root: html2element(template),
                dialog: new gmDialog(doc.body, {
                    buttons: {
                        yes: "Save",
                        no: "Close"
                    },
                    events: {
                        show(){
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
                vinfo: html2element(`<small class="kodirpc-server-version" style="position: absolute;bottom:16px;left:16px;" />`),
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
                    self.elements.buttons.save.disabled = null;
                    self.trigger('init');
                },
                rm(){
                    self.servers.splice(self.current, 1);
                    self.elements.buttons.save.disabled = null;
                    events.select();
                    self.trigger('init');
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

                    self.client.sendRPCRequest(server, "Playlist.GetPlaylists", {}, json => {
                        flash.success = "Server " + server.name + " available.";
                    }, errcode => {
                        flash.error = "Cannot connect to " + server.name + " (" + errcode + ")";
                    });
                    
                },

                blacklist(){
                    self.dialog.one('hide', e => {
                        new KodiRPCBlacklistManager();
                        console.debug("manager");
                    });
                    self.dialog.trigger('close');
                }
            };

            new Events(self.root, self);

            Object.keys(self.events).forEach(evt => self.on(evt, self.events[evt]));

            self.dialog.title = self.title;
            self.dialog.body = self.root;
            self.dialog.root.appendChild(self.elements.flash);
            self.dialog.elements.footer.appendChild(self.elements.vinfo);
            self.elements.vinfo.innerHTML = GMinfo.script.version;

            //keyboard shortcuts
            self.on('keyup keydown', e => {
                let target = e.target.closest('input[name]');
                if (([13, 9].includes(e.keyCode)) && (target !== null)) {
                    e.preventDefault();
                    if ((e.type === "keyup")) {
                        let index = -1, list = target.parentElement.querySelectorAll('input[name]'), next;
                        list.forEach((input, i) => {
                            if (input === target) next = i + 1;
                        });
                        if (typeof list[next] === u) next = 0;
                        list[next].focus();
                    }
                }

            });


            //save settings
            self.dialog.on('confirm', e => {
                let settings = self.servers.map(x => x._params);
                self.client._settings.set('servers', settings);
            });

            if (typeof open === f) self.dialog.on('open', open);
            if (typeof close === f) self.dialog.on('close', close);

            self.dialog.open();

        }
    }

    class KodiRPCBlacklistManager {


        constructor(open, close){

            let template = `<form class="kodirpc-blacklist-manager">
                                <fieldset class="kodirpc-bm-add" style="padding: 0;">
                                    <label>Address:</label>
                                    <input type="text" placeholder="Type an URL" name="url" value="" style="width:calc(100% - 56px);">
                                    <button type="submit" title="Add URL" name="add" class="gm-btn gm-btn-sm gm-btn-yes" style="float:right;min-width:auto; padding:6px 16px;margin:0 0 0 0px;">+</button>
                                </fieldset>
                                <ul class="kodirpc-bm-list gm-list" style="border-radius: 0;border-left: 0;border-right: 0;border-bottom: 0;">
                                </ul>
                            </form>`;



            const self = this, client = new KodiRPCClient();
            Object.assign(this, {
                title: GMinfo.script.name + " Blacklist Manager",
                root: html2element(template),
                dialog: new gmDialog(doc.body, {
                    buttons: {
                        yes: "Save",
                        no: "Close"
                    },
                    events: {
                        show(){
                            self.trigger('init');

                        }
                    }
                }),
                client: client,
                blacklist: client.blacklist
            });

            self.elements = {
                formadd: self.root.querySelector('.kodirpc-bm-add'),
                list: self.root.querySelector('.kodirpc-bm-list'),
                flash: html2element(`<div class="kodirpc-server-flash" style="cursor:pointer;overflow:hidden;position: absolute; bottom:12px; right: 12px;width:400px;text-align: center;"></div>`),
                vinfo: html2element(`<small class="kodirpc-server-version" style="position: absolute;bottom:16px;left:16px;" />`),
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

            self.events = {
                submit(e){
                    e.preventDefault();
                    console.debug(e);

                    if (self.elements.inputs.url.value.length > 0) {
                        console.debug(self.blacklist.add(self.elements.inputs.url.value), self.blacklist);
                        if (self.blacklist.add(self.elements.inputs.url.value)) {
                            flash.info = "URL added to blacklist.";
                            self.trigger('init');
                        } else flash.error = "Invalid URL";

                    }
                },

                init(){
                    self.elements.inputs.url.value = null;
                    self.elements.buttons.save.disabled = true;
                    if (self.blacklist.dirty === true) self.elements.buttons.save.disabled = null;
                    //mk list
                    const ul = self.elements.list;
                    ul.querySelectorAll('li').forEach(li => li.remove());
                    console.debug(self.blacklist);
                    self.blacklist.list.forEach(host => {
                        ul.appendChild(html2element(`<li data-host="${host}" style="position:relative;text-align:center;">
                            ${host} <button class="gm-btn gm-btn-no" name="rm" title="Remove"
                                    style="min-width:auto; padding:7px 16px;margin:0 0 0 0px;position:absolute; top:50%;right:-4px;transform: translateY(-50%);">-</button>
                        </li>`));

                    });
                },
                click(e){
                    e.stopPropagation();
                    let target = e.target.closest('button[name="rm"]');
                    if (target !== null) {
                        e.preventDefault();
                        let li = target.parentElement, host = li.data('host');
                        if (self.blacklist.remove(host)) {
                            flash.info = "Removed host: " + host;
                            self.elements.buttons.save.disabled = null;
                            li.remove();
                        } else flash.error = "Cannot remove host" + host;
                    }
                }


            };


            const flash = new gmFlash(self.elements.flash);

            new Events(self.root, self);

            Object.keys(self.events).forEach(evt => self.on(evt, self.events[evt]));

            self.dialog.title = self.title;
            self.dialog.body = self.root;
            self.dialog.root.appendChild(self.elements.flash);
            self.dialog.elements.footer.appendChild(self.elements.vinfo);
            self.elements.vinfo.innerHTML = GMinfo.script.version;

            //save
            self.dialog.on('confirm', e => {
                if (self.blacklist.dirty === true) self.client._settings.set('blacklist', self.blacklist.list);
            });

            if (typeof open === f) self.dialog.on('open', open);
            if (typeof close === f) self.dialog.on('close', close);
            self.dialog.open();

        }
    }


    /**
     * KodiRPC Module
     * Attach events to the current page (compatibility with other userscripts)
     */

    class KodiRPCModule {

        get client(){
            if (typeof this._client === u) this._client = new KodiRPCClient();
            return this._client;
        }

        get events(){
            if (typeof this._listeners === u) {
                const self = this;
                this._listeners = {
                    ready(){
                        console.debug(this.title, 'version', this.version, 'started.');
                    },
                    //legacy mode
                    settings(e){
                        let open, close;
                        if (typeof e.data !== u) {
                            open = (typeof e.data.open === f) ? e.data.open : x => x;
                            close = (typeof e.data.close === f) ? e.data.close : x => x;
                        }
                        self.openSettings(open, close);
                    },
                    send(e){

                        if ((typeof e.data !== u) && (typeof e.data.link === s)) {
                            self.client.send(e.data.link, e.data.success, e.data.error);
                        }
                    },

                    //new features
                    blacklist(e){
                        if ((typeof e.data !== u) && (typeof e.data.link === s)) {
                            self.client.addBlacklist(e.data.link, e.data.success, e.data.error);
                        }
                    }


                };
            }
            return this._listeners;
        }


        openSettings(...args){
            new KodiRPCConfig(...args);

        }

        constructor(){
            const el = doc.documentElement, self = this;
            if (el.KodiRPCModule instanceof KodiRPCModule) return;
            Object.defineProperty(el, 'KodiRPCModule', {
                value: this, configurable: true
            });
            Object.assign(this, {
                title: 'KodiRPC Module',
                version: GMinfo.script.version,
                prefix: 'kodirpc'
            });
            let blacklist = this.client.blacklist;
            if (blacklist.has(location.host)) return;
            new Events(doc.body, this);
            const events = this.events;
            Object.keys(events).forEach(evt => {
                let type = self.prefix + '.' + evt;
                self.on(type, events[evt]);
            });
        }
    }



    /**
     * Standalone User Interface
     */
    class KodiRPCUI {

        static loadStyles(){
            if (this.styles === true) return;
            this.styles = true;
            let styles = `
                .KodiRPCUI, .KodiRPCUI button, .KodiRPCUI button:hover, .KodiRPCUI button:active, .KodiRPCUI *, .KodiRPCUI-notify{
                    margin:0; padding:0; border: none;background-color: transparent;display: inline-block;box-sizing: border-box;
                    font-family: Arial,Helvetica,sans-serif;line-height: 1.5;font-weight: 700;color:#000;font-size: 16px;border: 0;border-radius:0;
                }
                .KodiRPCUI{position: absolute; top: 128px;right:64px;z-index: 2147483646;}
                .KodiRPCUI img{width:64px;height:64px;}
                .KodiRPCUI button{cursor:pointer;}
                .KodiRPCUI-expand {}
                .KodiRPCUI-toolbar, .KodiRPCUI-servers {display: block;background-color: rgba(255, 255, 255, 0.45);display:block;}
                .KodiRPCUI-toolbar button, .KodiRPCUI-toolbar button:hover, .KodiRPCUI-toolbar button:active{
                    padding: 16px 24px;border-radius:0;width:150px;
                }
                .KodiRPCUI-toolbar button:hover, .KodiRPCUI-toolbar button:active, .KodiRPCUI-servers li:hover{
                    background-color: rgba(0,0,0,.125);
                }
                .KodiRPCUI-servers{list-style-type: none;}
                .KodiRPCUI-servers li{
                        width:100%;display: block;position: relative;text-align: center;padding: 16px 24px;
                        cursor: pointer; border-top: 1px solid rgba(0,0,0,.125);
                }
                .KodiRPCUI-servers li:before{
                    content: "";display: block;border-radius: 50%;box-sizing: border-box;pointer-events: none;white-space: nowrap;
                    position: absolute;line-height: 0;left: 0;top: 50%;width: 24px;height: 24px;transform: translate(16px, -50%);
                    border: 1px solid rgba(0,0,0,.45); background-color: rgba(240, 173, 78, .75);
                }
                .KodiRPCUI-servers li[data-online]:before{background-color: rgba(220, 53, 69, .75);}
                .KodiRPCUI-servers li[data-online="true"]:before{background-color: rgba(40, 167, 69, .75);}
                .KodiRPCUI-notify{z-index: 2147483646;cursor:pointer;position: fixed; bottom:64px; right: 12px;width:400px;text-align: center;}
                .KodiRPCUI [hidden], .KodiRPCUI[hidden]{display: none !important; opacity:0!important; z-index: -1 !important;}
            `;
            addstyle(styles);
        }



        expand(hidden = true){
            const self = this;
            hidden = hidden === true ? true : null;
            self.elements.slist.hidden = self.elements.toolbar.hidden = hidden === true ? null : true;
            self.elements.expand.hidden = hidden;
        }


        constructor(video){

            if (!(video instanceof Element)) return;
            const self = this;
            const icon = `data:image/png;base64,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`;
            const settingsico = `<svg class="square" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="currentColor" d="M29.181 19.070c-1.679-2.908-0.669-6.634 2.255-8.328l-3.145-5.447c-0.898 0.527-1.943 0.829-3.058 0.829-3.361 0-6.085-2.742-6.085-6.125h-6.289c0.008 1.044-0.252 2.103-0.811 3.070-1.679 2.908-5.411 3.897-8.339 2.211l-3.144 5.447c0.905 0.515 1.689 1.268 2.246 2.234 1.676 2.903 0.672 6.623-2.241 8.319l3.145 5.447c0.895-0.522 1.935-0.82 3.044-0.82 3.35 0 6.067 2.725 6.084 6.092h6.289c-0.003-1.034 0.259-2.080 0.811-3.038 1.676-2.903 5.399-3.894 8.325-2.219l3.145-5.447c-0.899-0.515-1.678-1.266-2.232-2.226zM16 22.479c-3.578 0-6.479-2.901-6.479-6.479s2.901-6.479 6.479-6.479c3.578 0 6.479 2.901 6.479 6.479s-2.901 6.479-6.479 6.479z"></path></svg>`;

            const template = `<div class="KodiRPCUI">
                                    <div class="KodiRPCUI-expand">
                                        <button name="expand">
                                            <img src="${icon}">
                                        </button>
                                    </div>
                                    <div class="KodiRPCUI-toolbar" hidden>
                                        <button name="send">Send to Kodi</button>
                                        <button name="settings">Settings</button>
                                    </div>
                                    <ul class="KodiRPCUI-servers" hidden>
                                    </ul>

                                </div>`;
            const notify = `<div class="KodiRPCUI-notify">
                            </div>`;


            Object.assign(this, {
                root: html2element(template),
                notifications: html2element(notify),
                video: video,
                client: new KodiRPCClient(),
                cache: new LSCache("rpclient", 5 * 60000, new gmStore()),
                events: {
                    click(e){
                        e.preventDefault();
                        e.stopPropagation();
                        let target = e.target.closest('[name]');
                        if (target !== null) {
                            let name = target.getAttribute('name');
                            if (typeof self.actions[name] === f) self.actions[name].call(self, e);
                            return;
                        }
                        //ck server online
                        target = e.target.closest('li[data-id]');
                        if (target !== null) {
                            let servers = self.client.servers, id = target.data('id'), server = servers[id];
                            if (server instanceof KodiRPCServer) {
                                target.data('online', false);
                                //check cache
                                let key = server.name + id, item = self.cache.getItem(key);
                                //item.expiresAfter(self.cache.ttl * 1000);
                                self.client.sendRPCRequest(server, "Playlist.GetPlaylists", {}, json => {
                                    self.flash.success = "Server " + server.name + " is online.";
                                    target.data('online', true);
                                    item.set(true);
                                    self.cache.save(item);
                                }, errcode => {
                                    self.flash.error = "Server " + server.name + " is offline.";
                                    item.set(false);
                                    self.cache.save(item);
                                });
                            }

                        }

                    },
                    init(e){
                        e.preventDefault();
                        e.stopPropagation();
                        self.elements.slist.querySelectorAll('li').forEach(li => li.remove());
                        let servers = self.client.servers;
                        servers.forEach((server, i) => {
                            let li = html2element(`<li title="Check if server is online">${server.name}</li>`);
                            li.data({
                                id: i, name: server.name
                            });
                            self.elements.slist.appendChild(li);

                            //check cache
                            let key = server.name + i, item = self.cache.getItem(key);
                            if (item.isHit()) li.data('online', item.get() === true);

                        
                        });
                    },
                    toggle(e){
                        e.preventDefault();
                        e.stopPropagation();
                        self.expand(self.elements.expand.hidden !== true);
                    },
                    submit(e){
                        e.preventDefault();
                        e.stopPropagation();
                    }

                },
                actions: {
                    expand(){
                        self.trigger('init toggle');

                    },
                    settings(){
                        self.trigger('kodirpc.settings', {
                            close(){
                                self.trigger('init');
                            }
                        });
                    }
                }
            });

            self.elements = {
                toolbar: self.root.querySelector('.KodiRPCUI-toolbar'),
                slist: self.root.querySelector('.KodiRPCUI-servers'),
                expand: self.root.querySelector('.KodiRPCUI-expand'),
                buttons: {}
            }

            self.root.querySelectorAll('button[name]').forEach(btn => {
                let name = btn.getAttribute('name');
                self.elements.buttons[name] = btn;
            });

            self.flash = new gmFlash(self.notifications);
            new Events(self.root, self);

            Object.keys(self.events).forEach(type => self.on(type, self.events[type]));

            KodiRPCUI.loadStyles();
            doc.body.appendChild(self.notifications);
            self.video.parentElement.insertBefore(self.root, self.video);
            new Timer(timer => {
                if (self.root.parentElement === null) {
                    timer.stop();
                    self.root.remove();
                    self.notifications.remove();
                }
            }, 1000);

        }

    }



    new KodiRPCUI();


    on.load(() => {
        new KodiRPCModule();
    });

    (() => {
        const elements = [];
        find({
            selector: `video[src^="http"], video source[src^="http"]`,
            timeout: 0,
            interval: 1000,
            onload(el){
                //Run only as Module
                if (typeof doc.body.KodiRPCModule !== u) {
                    //new KodiRPCModule(doc.body);
                    //return;
                }
                let video = el.closest('video');
                if(elements.includes(video)) return;
                if (video.parentElement !== null) {
                    elements.push(video);
                    new KodiRPCUI(video);
                }
                    
                
                
            }

        });


    })();




})(document);