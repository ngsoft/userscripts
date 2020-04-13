// ==UserScript==
// @name         KodiRPC 2.0
// @namespace    https://github.com/ngsoft/userscripts
// @version      2.0
// @description  Sends Video Streams to Kodi
// @author       ngsoft
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.1.6/dist/gmutils.min.js
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
                this.list.splice(this.list.indexOf(host), 1)
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
                prefix: 'kodirpc',
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

    on.load(() => {
        new KodiRPCModule();
    });
    new KodiRPCConfig();






})(document);