// ==UserScript==
// @name         KodiRPC 2.0
// @namespace    https://github.com/ngsoft/userscripts
// @version      2.0
// @description  Sends Video Streams to Kodi
// @author       ngsoft
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.1.4/dist/gmutils.min.js
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
                    blacklist: []

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

                    self.client.RPCsend(server, "Playlist.GetPlaylists", {}, json => {
                        flash.success = "Server " + server.name + " available.";
                    }, errcode => {
                        flash.error = "Cannot connect to " + server.name + " (" + errcode + ")";
                    });
                    
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

            self.dialog.open();



        }
    }





    class KodiRPCModule {

        constructor(){
            const self = this;

            Object.assign(this, {

            });


        }
    }

















    const kodi = new KodiRPCClient();


})(document);