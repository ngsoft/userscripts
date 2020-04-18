// ==UserScript==
// @name         KodiRPC 2.0
// @namespace    https://github.com/ngsoft/userscripts
// @version      2.0
// @description  Sends Video Streams to Kodi
// @author       ngsoft
//
// @require     https://cdn.jsdelivr.net/gh/mitchellmebane/GM_fetch@master/GM_fetch.js
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.3/dist/gmutils.min.js
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


    const gmSettings = new UserSettings({
        config: {
            legacy_mode: true,
            use_blacklist: true,
            display_servers: true,
            update_servers_online: true
        },
        servers: [
            {name: 'localhost', host: "127.0.0.1", uniqid: uniqid()}
        ],
        blacklist: []

    });

    //do not load script on blacklisted page
    if (((gmSettings.get('blacklist') || []).includes(location.hostname)) && (gmSettings.get('config').use_blacklist === true)) return;

    const cache = new LSCache("rpclient", 2 * minute, new gmStore());



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
                this._dirty = true;
            }
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
            if (valid === true) {
                this._params.host = h;
                this._dirty = true;
            }
        }
        
        
        set pathname(p){
            if (typeof p !== s) return;
            if (/^\/(?:[\w\-\.@]+[\/]?)+$/.test(p)) {
                this._params.pathname = p;
                this._dirty = true;
            }
        }
        
        set user(user){
            if (user === null) {
                this._params.username = this._params.auth = null;
                this._dirty = true;
                return;
            }
            if (typeof user !== s) return;
            this._params.username = user.length > 0 ? user : null;

        }
        set port(p){
            if (typeof p !== n) return;
            if ((p > 0) && (p < 65536)) {
                this._params.port = p;
                this._dirty = true;
            }
        }
        set auth(pass){
            if ((typeof pass === s ? pass.length > 0 : false) && (this.user !== null)) {
                this._params.auth = btoa(this.user + ':' + pass);
                this._dirty = true;
            } else if (pass === null) this.user = null;
        }
        
        
        get name(){
            return this._params.name;
        }
        get host(){
            return this._params.host;
        }
        
        get pathname(){
            return this._params.pathname;
        }
        
        get user(){
            return this._params.username;
        }
        get port(){
            return this._params.port;
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

        get uniqid(){
            return this._params.uniqid;
        }

        get online(){
            let item = cache.getItem(this.uniqid), val;
            if (!item.isHit()) return null;
            return typeof (val = item.get()) !== n ? isPlainObject(val) : false;
        }
        
        get dirty(){
            return this._dirty === true;
        }


        constructor(params){
            let defs = {
                name: 'localhost',
                host: "127.0.0.1",
                port: 8080,
                pathname: '/jsonrpc',
                username: null,
                auth: null,
                uniqid: uniqid() //ro
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
                this._dirty = true;
            }
            return this.has(url);
        }

        remove(url){
            let host = this._getHost(url);
            if ((typeof host === s) && (this.has(host))) {
                this.list.splice(this.list.indexOf(host), 1);
                this._dirty = true;
            }
            return !this.has(url);
        }

        constructor(data){
            if (Array.isArray(data)) this._list = data;
            else this._list = [];

        }
    }


    class KodiRPCServerList extends Array {



        push(server){

            if (server instanceof KodiRPCServer ? this.map(x => x.uniqid).includes(server.uniqid) === false : false) {
                super.push(server);
                Object.defineProperty(this, server.uniqid, {
                    configurable: true, enumerable: false,
                    value: server
                });
            }

            return this.length;
        }

        removeServer(server){
            if (server instanceof KodiRPCServer) return this.remove(server.uniqid);
        }

        remove(uniqid){
            if (typeof uniqid === s ? uniqid.length > 0 : false) {
                if (this[uniqid] instanceof KodiRPCServer) {
                    let
                            server = this[uniqid],
                            index = this.map(x => x.uniqid).indexOf(uniqid);
                    delete this[uniqid];
                    if (index > -1) this.splice(index, 1);

                }
            }

        }

        constructor(list){
            super();
            list = list || [];

            if (Array.isArray(list) ? list.every(x => x instanceof KodiRPCServer) : false) {

                const self = this;
                list.forEach(server => self.push(server));

            }
        }
    }

    class KodiRPCClient {

        get settings(){
            const self = this;
            if (typeof this._settings === u) {
                this._settings = gmSettings;
            }
            let update = false, retval = {
                servers: this._settings.get('servers').map(d => {
                    if (typeof d.uniqid !== s) update = true;
                    return new KodiRPCServer(d);

                }).sort(function(a, b){
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (a.name < b.name) {
                        return -1;
                    }
                    return 0;
                }),
                blacklist: new KodiRPCBlacklist(this._settings.get('blacklist')),
                config: this._settings.get('config') || {},
                last: this._settings.get('last') || []
            };



            if (update === true) this._settings.set('servers', retval.servers.map(x => x._params));
            return retval;
        }

        get servers(){
            return new KodiRPCServerList(this.settings.servers);
        }

        get blacklist(){
            return this.settings.blacklist;
        }

        get config(){
            return this.settings.config;
        }

        get last(){
            let
                    last = this.settings.last,
                    retval;
            const servers = this.servers;
            if (last.length > 0) {
                retval = servers.filter(x => last.includes(x.uniqid));
            } else retval = Array.from(servers);
            return new KodiRPCServerList(retval);
        }
        set last(list){
            if (Array.isArray(list) && list.every(s => s instanceof KodiRPCServer)) {
                let last = list.map(s => s.uniqid);
                this._settings.set('last', last);
            }
        }


        get cache(){
            return cache;
        }


        sendRPCRequest(server, method, params, success, error, complete){
            params = params || {};
            success = (typeof success === f) ? success : x => x;
            error = (typeof error === f) ? error : x => x;
            complete = (typeof complete === f) ? complete : x => x;
            if (!(server instanceof KodiRPCServer)) throw new Error("server not instance of KodiRPCServer");
            if (typeof method !== s) throw new Error("Invalid Method");
            if (!(params instanceof Object)) throw new Error("Invalid Params");
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
                            } catch (e) {
                                response = {error: {code: -32700}}; // ERR_JSON_PARSE
                            }
                            if (typeof response.result !== u) {
                                success.call(self, server, response);
                            } else error.call(self, server, response.error.code);

                        } else error.call(self, server, xhr.status);
                        
                        complete.call(self, server);
                    },
                    onerror(xhr){
                        error.call(self, server, xhr.status);
                        complete.call(self, server);
                    }
                });
            }
        }


        sendRequest(method, params, success, error, complete){
            const self = this;
            new KodiRPCServerSelector(servers => {
                servers.forEach(server => {
                    self.sendRPCRequest(server, method, params, success, error, complete);
                });
            });
        }


        send(link, success, error, complete){
            
            this.sendRequest("Player.Open", {
                item: {
                    file: link
                }
            }, success, error, complete);

        }

        /**
         * Check Server Connection
         * @param {KodiRPCServer}   server      Server to use
         * @param {function}        success     Called on success
         * @param {function}        error       Called on error
         * @param {function}        [complete]  Called when request is complete
         * @param {boolean}         [cache]     Use Cached value
         * @returns {undefined}
         */
        checkConnection(server, success, error){


            if (!(server instanceof KodiRPCServer) || typeof success !== f || typeof error !== f) throw new Error("Invalid Arguments.");

            const self = this;
            let cache = true, complete = x => x;
            if (arguments.length > 3) {
                for (let i = 3; i < arguments.length; i++) {
                    let val = arguments[i];
                    if (typeof val === f) complete = val;
                    if (typeof val === b) cache = val;
                }
            }
            
            let item = self.cache.getItem(server.uniqid);

            let callback = (server, response) => {
                item.set(response);
                self.cache.save(item);
                if (typeof response === n) error.call(self, server, response);
                else if (isPlainObject(response)) success.call(self, server, response);

            };

            if (item.isHit() ? cache === true : false) {
                callback(server, item.get());
                complete.call(self, server);
                return;
            }
            self.sendRPCRequest(server, "Playlist.GetPlaylists", {}, callback, callback, complete);

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
                    //legacy mode
                    settings(e){
                        let open, close;
                        if (typeof e.data !== u) {
                            open = (typeof e.data.open === f) ? e.data.open : x => x;
                            close = (typeof e.data.close === f) ? e.data.close : x => x;
                        }
                        new KodiRPCConfigurator(open, close);
                    },
                    send(e){
                        if ((typeof e.data !== u) && (typeof e.data.link === s)) {
                            self.client.send(e.data.link, e.data.success, e.data.error, e.data.complete);
                        }
                    },
                    //new features
                    queue(e){

                    }


                };
            }
            return this._listeners;
        }

        checkServersConnection(){

            if (doc.hidden === true) return;

            const self = this, servers = self.client.servers;

            servers.forEach(server => {
                self.client.checkConnection(server,x=>x,x=>x,s=>{
                    self.trigger(self.prefix + 'update', {server: s});
                });
            });
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
                prefix: 'kodirpc.',
                cache: cache

            });
            new Events(doc.body, this);
            const events = this.events;
            Object.keys(events).forEach(evt => {
                let type = self.prefix + evt;
                self.on(type, events[evt]);
            });

            //check rpc server connection
            setInterval(() => {
                self.checkServersConnection.call(self);
            }, (self.cache.ttl + 2000));
            self.checkServersConnection();

            self.one(self.prefix + 'ready', e => {
                self.ready = true;
                console.debug(this.title, 'version', this.version, 'started.');
            });

            self.trigger(self.prefix + 'ready', {
                client: self.clients
            });
        }
    }





    class KodiRPCConfigurator {

        static loadStyles(){
            if (this.styles === true) return;
            this.styles = true;
            let styles = `
                
                .kodirpc-configurator{padding:0 24px 24px;}
                .kodirpc-configurator .gm-list{padding:0;border-radius:0;margin-top:0;}

                .kodirpc-configurator .flash-message-box{overflow:hidden;height:64px;margin:8px 0; padding:0;}
                .kodirpc-configurator .flash-message-box .gm-flash{margin:0;height:64px;max-height:64px;display: flex;align-items: center;justify-content: center;}
                .kodirpc-configurator .flash-message-box .gm-flash:not(.error):not(.warning):not(.info):not(.success){font-size: 24px;}
                .kodirpc-configurator .flash-message-box .gm-flash + .gm-flash{display:none;}

                .kodirpc-configurator input + .flash-message-box{margin: 12px 0 0;}

                .kodirpc-about li{text-align:right;position:relative;font-weight: normal;}
                .kodirpc-about li strong{width:112px;display:inline-block;padding: 0 12px 0 0;float:left;text-align:left;}
                .kodirpc-about li:last-child, .kodirpc-about li:last-child strong{text-align:center;float:none;}
                .kodirpc-about li:last-child strong{}
                .kodirpc-basics li, .kodirpc-server-selection li{cursor: pointer;}
                .kodirpc-basics li input[type="checkbox"]{z-index:-1;}
                .kodirpc-server-selection [name="server_remove"]{float:left; margin: -8px 0 0 -8px !important;}
                .kodirpc-server-selection .gm-list .gm-btn{width: 96px;}
                .kodirpc-server-selection .gm-list .active .gm-btn{color: gray;}
                .kodirpc-server-selection .gm-list .active, .kodirpc-server-selection .gm-list .active .gm-btn{pointer-events:none;}
                .kodirpc-servers .gm-tabs{margin: 16px 0 8px;}
                .kodirpc-servers .gm-tabs:before{bottom: -16px;}
                .kodirpc-servers legend:before{bottom:0;}

                
            `;
            addstyle(styles);
        }
        set cansave(flag){
            if (typeof flag === b) this.elements.buttons.save.disabled = flag === true ? null : true;
        }

        get cansave(){
            return this.elements.buttons.save.disabled !== true;
        }

        get tab(){
            let retval;
            const self = this;
            Object.keys(self.elements.tabs).forEach(tab => {
                if (self.elements.tabs[tab].classList.contains('active')) retval = tab;
            });

            return retval;
        }

        set tab(name){
            const self = this;
            if (typeof name === s ? name.length > 0 : false) {
                let el = self.elements.tabs[name];
                if (el instanceof Element ? el.matches(':not(.active)') : false) Events(el).trigger('click');
            }
        }

        addServer(server){
            if (server instanceof KodiRPCServer) {
                const self = this;
                let li = this._createServerListItem(server);
                self.elements.forms.servers.querySelectorAll('.kodirpc-server-selection .gm-list').forEach(ul => {
                    ul.appendChild(li);
                });
            }

        }

        addBlacklistHost(host){
            if (typeof host === s ? host.length > 0 : false) {
                const self = this;
                let li = this._createBlacklistItem(host);
                self.elements.forms.blacklist.querySelectorAll('.gm-list').forEach(ul => {
                    ul.appendChild(li);
                });
            }
        }
        _createServerListItem(server){
            if (!(server instanceof KodiRPCServer)) throw new Error('Invalid Argument');
            let
                    li = doc.createElement('li'),
                    button = html2element(`<button class="gm-btn gm-btn-yes" name="server_select">Edit</button>`),
                    rm = html2element(`<button class="gm-btn gm-btn-no" name="server_remove">Remove</button>`),
                    span = doc.createElement('span');
            li.data({
                uniqid: server.uniqid
            });
            span.innerHTML = server.name;
            li.appendChild(span);
            li.appendChild(button);
            li.appendChild(rm);
            return li;
        }

        _createBlacklistItem(host){
            let li = doc.createElement('li'),
                    btn = html2element(`<button title="Remove Hostname" name="rm_url" class="gm-btn gm-btn-no">-</button>`);

            li.data('host', host);
            li.innerHTML = host;
            li.appendChild(btn);
            return li;
        }


        constructor(open, close){
            const client = new KodiRPCClient();

            let template = `<div class="kodirpc-configurator">
                                <div class="flash-message-box"></div>
                                <ul class="gm-tabs">
                                    <li class="gm-tab" data-tab=".kodirpc-basics" data-flash="Manage Features">Basics</li>
                                    <li class="gm-tab" data-tab=".kodirpc-servers" data-flash="Manage Servers">Servers</li>
                                    <li class="gm-tab" data-tab=".kodirpc-blacklist-manager" data-flash="Manage Blacklist">Blacklist</li>
                                    <li class="gm-tab" data-tab=".kodirpc-about" data-flash="About ${GMinfo.script.name}">About</li>
                                </ul>
                                
                                <form class="kodirpc-basics" name="basics" autocomplete="off">
                                    <h1>Basic Configuration</h1>
                                    <ul class="gm-list">
                                        <li>
                                            <span class="switch-round-sm" style="position:absolute; top:50%;left:-4px;transform: translateY(-50%);">
                                                <input type="checkbox" name="display_servers">
                                                <span class="slider"></span>
                                            </span>
                                            Display Server List
                                        </li>
                                        <li>
                                            <span class="switch-round-sm" style="position:absolute; top:50%;left:-4px;transform: translateY(-50%);">
                                                <input type="checkbox" name="update_servers_online">
                                                <span class="slider"></span>
                                            </span>
                                            Check Servers Online
                                        </li>
                                        <li>
                                            <span class="switch-round-sm" style="position:absolute; top:50%;left:-4px;transform: translateY(-50%);">
                                                <input type="checkbox" name="use_blacklist">
                                                <span class="slider"></span>
                                            </span>
                                            Use Blacklist
                                        </li>
                                        <li>
                                            <span class="switch-round-sm" style="position:absolute; top:50%;left:-4px;transform: translateY(-50%);">
                                                <input type="checkbox" name="legacy_mode">
                                                <span class="slider"></span>
                                            </span>
                                            Use Legacy Mode (Direct Play)
                                        </li>
                                    </ul>
                                </form>
                                <form class="kodirpc-blacklist-manager" name="blacklist" autocomplete="off">
                                    <fieldset class="kodirpc-bm-add" style="padding: 8px 0;">
                                        <legend>Blacklist Manager</legend>
                                        <input type="text" placeholder="Type an URL" name="url" value="" style="width:calc(100% - 72px);">
                                        <button type="submit" title="Add URL" name="add_url" class="gm-btn gm-btn-sm gm-btn-yes" style="float:right;min-width:auto; padding:6px 16px !important;margin:4px 0 0;">Add</button>
                                        <button class="gm-btn" name="add_current" style="position: absolute;top: 8px;right: 0;">Add Current Site</button>
                                    </fieldset>
                                    <h2>Hostnames</h2>
                                    <ul class="gm-list"></ul>
                                    <div class="gm-flash">Blacklist is empty.</div>
                                </form>
                                <form class="kodirpc-servers" autocomplete="off" name="servers">
                                    <ul class="gm-tabs">
                                        <li class="gm-tab" data-tab=".kodirpc-server-add">Add Server</li>
                                        <li class="gm-tab active" data-tab=".kodirpc-server-selection">Select Server</li>
                                        <li class="gm-tab" data-tab=".kodirpc-server-edit">Server Edit</li>
                                        <li class="gm-tab" data-tab=".kodirpc-server-auth">Credentials</li>
                                    </ul>
                                    <fieldset class="kodirpc-server-add" name="server_add">
                                        <legend>Add a Server</legend>
                                        <label>Name:</label>
                                        <input 
                                            type="text"
                                            name="add_name"
                                            value=""
                                            placeholder="Name"
                                            data-exists="Server name %s already exists."
                                            data-error="Server name %s is invalid."
                                        >
                                        <label>Hostname:</label>
                                        <input 
                                            type="text"
                                            name="add_host"
                                            value=""
                                            placeholder="Hostname"
                                            data-exists="Server hostname %s already exists."
                                            data-error="Server hostname %s is invalid."
                                        >
                                        
                                        <div style="text-align: right;margin:16px -8px -16px;padding: 0;">
                                            <button class="gm-btn gm-btn-yes" name="add_confirm">Confirm</button>
                                        </div>
                                    </fieldset>
                                    <fieldset class="kodirpc-server-selection" name="server_select">
                                        <legend>Select Server</legend>
                                        <input name="uniqid" type="hidden" value="">
                                        <ul class="gm-list"></ul>
                                        <div class="gm-flash">
                                            Server list is empty.
                                        </div>
                                    </fieldset>
                                    <fieldset class="kodirpc-server-edit" name="server_edit">
                                        <legend>Edit Server</legend>
                                        <label>Name:</label>
                                        <input 
                                            type="text"
                                            name="name"
                                            value=""
                                            placeholder="Name"
                                            data-error="Name %s is invalid."
                                            required>
                                        <label>Hostname:</label>
                                        <input 
                                            type="text"
                                            name="host"
                                            value=""
                                            placeholder="Hostname"
                                            data-error="Hostname %s is invalid."
                                            required>
                                        <label>Port:</label>
                                        <input 
                                            type="number"
                                            name="port"
                                            value=""
                                            placeholder="Port"
                                            min="1"
                                            max="65535"
                                            data-error="Port %s is invalid."
                                            required>
                                    </fieldset>
                                    <fieldset class="kodirpc-server-auth" name="server_auth">
                                        <legend>Credentials</legend>
                                        <label>Username:</label>
                                        <input type="text" name="user" value="" placeholder="Username">
                                        <label>Password:</label>
                                        <input type="password" name="pass" value="" placeholder="Password">
                                        <div class="flash-message-box"></div>
                                        <div style="text-align: right;margin:16px -8px -16px;padding: 0;">
                                            <button class="gm-btn gm-btn-no" name="rm_pass">Remove password</button>
                                            <button class="gm-btn" name="check">Check Connection</button>
                                        </div>
                                    </fieldset>
                                    
                                </form>
                                <div class="kodirpc-about">
                                    <h1 style="text-align:right;">${GMinfo.script.name}</h1>
                                    <ul class="gm-list">
                                        <li><strong>Description:</strong> ${GMinfo.script.description}</li>
                                        <li><strong>Version:</strong> ${GMinfo.script.version}</li>
                                        <li><strong>Author:</strong> ${GMinfo.script.author}</li>
                                        <li><strong>UUID:</strong> ${GMinfo.script.uuid}</li>
                                        <li style="text-align: center;">Copyright &copy; 2020 <a href="${GMinfo.script.namespace}" target="_blank">NGSOFT</a></li>
                                    </ul>
                                </div>

                                
                            </div>`;
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
                            self.trigger('init');
                        }
                    },
                    position: {
                        top: "2%"
                    }
                }),
                client: new KodiRPCClient(),
                data: {},
                events: {
                    init(e){
                        self.cansave = false;
                        //loads data
                        const data = self.data = {};
                        data.config = self.client.config;
                        data.servers = self.client.servers;
                        data.blacklist = self.client.blacklist;
                        Object.defineProperty(data, 'map', {
                            get(){
                                let  map = {};
                                this.servers.forEach((server, i) => map[server.uniqid] = i);
                                return map;
                            },
                            set(val){}
                        });
                        Object.defineProperty(data, 'uniqids', {
                            get(){
                                return this.servers.map(server => server.uniqid);
                            },
                            set(val){}
                        });
                        Object.defineProperty(data, 'current', {
                            get(){
                                let uniqid = self.elements.inputs.uniqid.value || "";
                                if (uniqid.length > 0) {
                                    let index = this.map[uniqid];
                                    if (typeof index === n) return this.servers[index] || null;
                                }
                                return null;
                            },
                            set(val){
                                if (val instanceof KodiRPCServer) val = val.uniqid;
                                if (typeof val === s ? val.length > 0 : false) {
                                    if (this.uniqids.includes(val)) {
                                        self.elements.inputs.uniqid.value = val;
                                        Events(self.elements.inputs.uniqid).trigger("change");
                                    }
                                }
                            }
                        });

                        //init forms
                        Object.keys(self.elements.forms).forEach(name => {
                            Events(self.elements.forms[name]).trigger("form.init");
                        });

                    },
                    change(e){
                        e.stopPropagation();
                        let target, name;
                        if ((target = e.target.closest('input[name], select[name], textarea[name]')) !== null) {
                            e.preventDefault();
                            name = target.getAttribute('name');
                            if (typeof self.actions.change[name] === f) self.actions.change[name].call(target, e);
                            let form = target.form, formName = form.getAttribute('name');
                            if (typeof formName === s ? formName.length > 0 : false) {
                                if (typeof self.actions.form_change[formName] === f) self.actions.form_change[formName].call(target, e);
                            }
                            let fieldset = target.closest('fieldset[name]');
                            if (fieldset !== null) {
                                let fieldsetName = fieldset.getAttribute('name') || "";
                                if (fieldsetName.length > 0 ? typeof self.actions.fieldset_change[fieldsetName] === f : false) {
                                    self.actions.fieldset_change[fieldsetName].call(target, e);
                                }
                            }

                        }
                    },

                    click(e){
                        e.stopPropagation();
                        let target, name, prevent = false;

                        if ((target = e.target.closest('button[name]:not([type="submit"])')) !== null) {
                            prevent = true;
                            name = target.getAttribute('name');
                            if (typeof self.actions.click[name] === f) self.actions.click[name].call(target, e);

                        } else if ((target = e.target.closest('.kodirpc-basics li')) !== null) {
                            prevent = true;

                            let input = target.querySelector('input[type="checkbox"][name]');
                            if (input instanceof Element) {
                                input.checked = input.checked !== true;
                                Events(input).trigger('change');
                            }

                        } else if ((target = e.target.closest('.kodirpc-server-selection li')) !== null) {
                            prevent = true;
                            target.querySelector('button[name="server_select"]').click();
                        }


                        if (prevent === true) e.preventDefault();
                    },
                    submit(e){
                        e.stopPropagation();
                        e.preventDefault();
                        let form = e.target.closest('form');
                        if (form !== null) {
                            let name = form.getAttribute('name');
                            if (name !== null) {
                                if (typeof self.actions.form_submit[name] === f) self.actions.form_submit[name].call(form, e);
                            }
                        }
                    },
                    keydown(e){
                        let target = e.target.closest('input');
                        const inputs = self.elements.inputs;
                        if (e.keyCode === 13) {
                            if(target !== null){
                                if (target === inputs.url) return;
                                e.preventDefault();
                                Events(target).trigger('change');
                                //rotate inputs
                                let next, list = Array.from(target.parentElement.children).filter(el => el.tagName === "INPUT");
                                list.forEach((el, i) => {
                                    if (el === target) next = i + 1;
                                });
                                if (typeof list[next] === u) next = 0;
                                list[next].focus();
                            }
                            

                        }
                    },
                    "gmtab.select": function(e){
                        let flash = e.target.data('flash');
                        if (typeof flash === s ? s.length > 0 : false) {
                            self.flashbox.root.innerHTML = "";
                            self.flashbox.message(flash, false, 0);
                        }
                    },
                    "gmtab.open": function(e){
                        const t = e.target, tag = t.tagName.toLowerCase();
                        if (["form", "fieldset"].includes(tag)) {
                            let name = t.getAttribute('name');
                            if ((typeof name === s) && (name.length > 0)) {
                                let act = tag + "_show";
                                if (typeof self.actions[act][name] === f) self.actions[act][name].call(t, e);
                            }
                        }
                    },
                    "form.init": function(e){
                        let form = e.target.closest('form');
                        if (form !== null) {
                            let name= form.getAttribute('name');
                            if (typeof name === s ? name.length > 0 : false) {
                                if (typeof self.actions.form_init[name] === f) self.actions.form_init[name].call(form, e);
                            }
                        }
                    }
                },
                actions: {
                    form_init: {
                        basics(e){
                            const form = e.target.closest('form');
                            for (let i = 0; i < form.length; i++) {
                                let input = form[i], name = input.getAttribute('name');
                                if (typeof name === s) {
                                    input.checked = self.data.config[name] === true;
                                }
                            }
                        },
                        blacklist(e){
                            const form = e.target.closest('form'),  inputs = self.elements.inputs;
                            inputs.url.value = null;
                            inputs.url.classList.remove('error');
                            form.querySelectorAll('.gm-list li').forEach(li => li.remove());
                            self.data.blacklist.list.forEach(host => self.addBlacklistHost(host));
                        },
                        servers(e){
                            const form = e.target.closest('form'), inputs = self.elements.inputs, servers = self.data.servers;
                            if (servers.length === 0) servers.push(new KodiRPCServer());

                            //map tabs add, auth, edit, selection
                            self.elements.tabs = {};
                            form.querySelectorAll('.gm-tabs .gm-tab').forEach(tab => {
                                let name = tab.data('tab').split('-').pop();
                                self.elements.tabs [name] = tab;
                            });

                            self.elements.tabs.edit.classList.add('disabled');
                            self.elements.tabs.auth.classList.add('disabled');

                            //reset fields
                            for (let i = 0; i < form.length; i++) {
                                let input = form[i];
                                if (input.tagName === "INPUT") input.value = null;
                            }
                            form.querySelectorAll('.gm-list li').forEach(li => li.remove());
                            servers.forEach(server => self.addServer(server));

                        }

                    },
                    form_submit: {
                        blacklist(e){
                            const input = self.elements.inputs.url;
                            input.classList.remove('error');
                            let host = input.value;
                            if(host.length > 0) {
                                if (self.data.blacklist.has(host)) input.classList.add('error');
                                else if (self.data.blacklist.add(host)) {
                                    self.cansave = true;
                                    input.value = null;
                                    self.addBlacklistHost(host);
                                    self.flashbox.success(host + ' added to blacklist');
                                }
                                else input.classList.add('error');
                            }
                        }
                    },
                    
                    fieldset_change: {
                        server_add(e){
                            const
                                    input = this,
                                    server = self.data.add,
                                    servers = self.data.servers,
                                    button = self.elements.buttons.add_confirm;
                            let
                                    name = input.getAttribute('name'),
                                    value = input.value,
                                    old = input.data('value') || "",
                                    key = name.split('_').pop(),
                                    invalid = input.data('error'),
                                    exists = input.data('exists'),
                                    error = false,
                                    dirty = old !== value;

                            input.data('value', value);
                            //validation
                            if (dirty === true) {
                                if (servers.map(x => x[key]).includes(value)) {
                                    self.flashbox.error(exists.replace('%s', value));
                                    error = true;
                                }
                                server[key] = value;
                                if (server[key] !== value) {
                                    self.flashbox.error(invalid.replace('%s', value));
                                    error = true;
                                }
                                input.classList[error === true ? "add" : "remove"]('error');

                            } else if (input.matches('.error')) error = true;
                            
                            button.disabled = error === true ? true : input.siblings('input.error').length > 0 || null;
                            

                        },
                        server_edit(){
                            const
                                    input = this,
                                    server = self.data.current;
                            let
                                    name = input.getAttribute('name'),
                                    value = input.value,
                                    old = input.data('value') || "",
                                    invalid = input.data('error') || "",
                                    dirty, parsed,
                                    error = false;

                            try {
                                parsed = JSON.parse(value);
                            } catch (x) {
                                parsed = value;
                            }
                            value = parsed;
                            dirty = value !== old;
                            input.data('value', value);
                            //validation
                            if (input.matches(':invalid')) error = true;
                            else if (dirty === true) {
                                server[name] = value;
                                if (server[name] !== value) error = true;
                                input.classList[error === true ? "add" : "remove"]('error');
                            } else if (input.matches('.error')) error = true;

                            if (error === true) self.flashbox.error(invalid.replace('%s', value));
                            if ((input.siblings('input.error,input:invalid').length > 0) || error === true) self.cansave = self.data.cansave = false;
                            else if (server.dirty === true) self.cansave = self.data.cansave = true;
                        },
                        server_auth(){
                            const
                                    input = this,
                                    server = self.data.current,
                                    inputs = self.elements.inputs;
                            let
                                    name = input.getAttribute('name'),
                                    value = input.value,
                                    old = input.data('value') || "",
                                    dirty = value !== old,
                                    error = false;
                            //there
                            
                            if (name === "user") {
                                input.data("value", value);
                                if (dirty === true) {
                                    server.user = value.length > 0 ? value : null;
                                    inputs.pass.value = null;
                                }
                            } else if (name === "pass") {
                                if (value.length > 0) {
                                    if (inputs.user.value.length === 0) {
                                        self.authflashbox.error('Username is empty.');
                                        return;
                                    }
                                    server.user = inputs.user.value;
                                    server.auth = value;
                                    if (typeof server.auth === s) {
                                        self.authflashbox.info('A password has been set.');
                                        if (self.data.cansave !== false) self.cansave = true;
                                    }

                                }
                            }
                            

                        }
                    },
                    fieldset_show: {
                        server_add(){
                            const inputs = self.elements.inputs;
                            const server = self.data.add = new KodiRPCServer();
                            self.elements.buttons.add_confirm.disabled = null;
                            inputs.add_host.value = server.host;
                            inputs.add_name.value = server.name = "New Server " + (self.data.servers.length + 1); //dirty flag
                            [inputs.add_name, inputs.add_host].forEach(i => {
                                i.classList.remove('error');
                                i.data('value', i.value);
                            });
                        },
                        server_select(){
                            const servers = self.data.servers;

                            this.querySelectorAll('.gm-list li').forEach(li => {
                                let
                                        span = li.querySelector('span'),
                                        uniqid = li.data('uniqid'),
                                        index = self.data.map[uniqid],
                                        server = self.data.servers[index];

                                span.innerHTML = server.name;
                            });

                        },
                        server_auth(){
                            self.authflashbox = self.authflashbox || gmFlash.prependTo(self.elements.inputs.pass.nextElementSibling, {
                                timeout: 3000,
                                removeOnClick: false,
                                animateEndDuration: 500,
                                animateStartDuration: 500,
                                animate: true,
                                classes: "gm-header"
                            });
                            this.querySelector('legend').innerHTML = `Credentials (${self.data.current.name})`;
                            self.elements.inputs.pass.value = null;
                            if (self.data.current.auth !== null) self.authflashbox.info("A password is currently set.");
                        }

                    },
                    form_show: {},
                    form_change: {
                        basics(e){
                            if (e.target.matches('[type="checkbox"][name]')) {
                                let name = e.target.getAttribute('name');
                                self.data.config[name] = e.target.checked === true;
                                self.cansave = true;
                            }
                        }
                    },
                    change: {
                        display_servers(e){
                            if (this.checked === false) {
                                self.elements.inputs.update_servers_online.checked = false;
                                Events(self.elements.inputs.update_servers_online).trigger('change');
                            }
                        },
                        update_servers_online(){
                            if (this.checked === true) {
                                self.elements.inputs.display_servers.checked = true;
                                Events(self.elements.inputs.display_servers).trigger('change');
                            }
                        },
                        //loads server configuration
                        uniqid(e){
                            const tabs = self.elements.tabs,
                                    inputs = self.elements.inputs,
                                    list = ["name", "host", "port", "user"],
                                    tablist = ["edit", "auth"],
                                    data = self.data;
                            let uniqid = this.value || null,
                                    valid = false;

                            //reset form
                            inputs.pass.value = null;
                            inputs.pass.classList.remove('error');
                            list.forEach(name => {
                                let input = inputs[name];
                                input.classList.remove('error');
                                input.value = null;
                                input.data('value', null);
                            });

                            //loads data
                            let server = data.current;
                            if (server !== null) {
                                valid = true;
                                list.forEach(name => {
                                    inputs[name].value = server[name];
                                    inputs[name].data('value', server[name]);
                                });
                                this.form.querySelectorAll('.kodirpc-server-selection .gm-list li').forEach(li => {
                                    let uid = li.data('uniqid');
                                    li.classList[uid === uniqid ? "add" : "remove"]('active');
                                });
                                delete data.cansave;
                            }
                            tablist.forEach(name => tabs[name].classList[valid === true ? "remove" : "add"]('disabled'));
                            if (valid === false) {
                                this.value = uniqid = null;
                                self.tab = "selection";
                                return;
                            }
                            self.tab = "edit";
                            self.flashbox.info("Editing " + server.name);


                        }


                    },
                    click: {

                        rm_pass(){
                            const
                                    inputs = self.elements.inputs,
                                    server = self.data.current;
                            server.user = inputs.user.value = inputs.pass.value = null;
                            inputs.user.data('value', null);
                            self.authflashbox.info('Credentials have been removed.');
                            if (self.data.cansave !== false) self.cansave = true;
                        },
                        check(){
                            self.authflashbox.info(self.data.current.name + ' connection check.');
                            self.client.checkConnection(self.data.current, server => {
                                self.authflashbox.success(server.name + ' connection success.');
                            }, (server, code) => {
                                if (code === 401) self.authflashbox.error(server.name + ' connection error(' + code + '), invalid credentials.');
                                else self.authflashbox.error(server.name + ' connection error(' + code + ').');
                            }, false);

                        },
                        rm_url(){
                            let li = this.parentElement;
                            if (li !== null) {
                                let host = li.data('host') || "";
                                if (host.length > 0) {
                                    if (self.data.blacklist.remove(host)) {
                                        self.flashbox.success(host + ' removed from blacklist');
                                        self.cansave = true;
                                        li.remove();
                                    }
                                }
                            }
                        },
                        add_current(){
                            self.elements.inputs.url.value = location.hostname;
                        },


                        add_confirm(){
                            const
                                    inputs = [
                                        self.elements.inputs.add_name,
                                        self.elements.inputs.add_host
                                    ],
                                    server = self.data.add,
                                    servers = self.data.servers;

                            let cansave = true;


                            inputs.forEach(input => {
                                //validation
                                input.data('value', null); console.debug(input);
                                self.actions.fieldset_change.server_add.call(input);
                                if (input.classList.contains('error')) cansave = false;
                            });

                            if (cansave === true) {
                                servers.push(server);
                                self.tab = "selection";
                                self.addServer(server);
                                self.cansave = true;
                                self.flashbox.success(server.name + " added to server list.", x => self.data.current = server);
                            }

                        },


                        server_select(e){
                            let li = this.parentElement;
                            if (li !== null) {
                                let uniqid = li.data('uniqid');
                                if (typeof uniqid === s ? uniqid.length > 0 : false) self.data.current = uniqid;
                            }

                        },
                        server_remove(){
                            if (self.data.servers.length < 2) return;
                            let li = this.parentElement;
                            if (li !== null) {
                                let uniqid = li.data('uniqid');
                                if (typeof uniqid === s ? uniqid.length > 0 : false) {
                                    let index = self.data.map[uniqid];
                                    if (typeof index === n) {
                                        let server = self.data.servers[index];
                                        if (server instanceof KodiRPCServer) {
                                            ask("Do you want to remove " + server.name + "?", () => {
                                                li.remove();
                                                self.data.servers.splice(index, 1);
                                                self.cansave = true;
                                                self.flashbox.success(server.name + " removed from server list.");

                                            }, null, {
                                                title: "Remove RPC Server"
                                            });
                                        }
                                    }
                                }

                            }
                        }
                    }
                    
                }

            });
            self.elements = {
                selection: self.root.querySelector('.kodirpc-server-selection'),
                vinfo: html2element(`<small class="kodirpc-server-version" style="position: absolute;bottom:16px;left:16px;" />`),
                forms: {},
                fieldsets: {},
                inputs: {},
                buttons: {
                    save: self.dialog.elements.buttons.yes,
                    close: self.dialog.elements.buttons.no
                }

            };

            self.root.querySelectorAll('input[name], select[name], textarea[name], form[name], fieldset[name], button[name]').forEach(el => {
                let name = el.getAttribute("name"), tag = el.tagName.toLowerCase();
                switch (tag) {
                    case "form":
                    case "button":
                    case "fieldset":
                        tag += "s";
                        self.elements[tag][name] = el;
                        break;
                    default :
                        self.elements.inputs[name] = el;
                }
            });

            self.flashbox = new gmFlash(self.root.querySelector('.flash-message-box'), {
                appendChild: false
            });

            new Events(self.root, self);

            Object.keys(self.events).forEach(evt => self.on(evt, self.events[evt]));

            self.dialog.title = self.title;
            self.dialog.body = self.root;
            self.dialog.elements.footer.appendChild(self.elements.vinfo);
            self.elements.vinfo.innerHTML = GMinfo.script.version;

            //save settings
            self.dialog.on('confirm', e => {

                const
                        gmstore = self.client._settings,
                        data = self.data,
                        tosave = {
                            config: data.config,
                            blacklist: data.blacklist.list,
                            servers: data.servers.map(s => s._params)
                        };

                Object.keys(tosave).forEach(key => gmstore.set(key, tosave[key]));


            });

            if (typeof open === f) self.dialog.on('open', open);
            if (typeof close === f) self.dialog.on('close', close);
            new gmTabs(self.root);

            KodiRPCConfigurator.loadStyles();
            self.dialog.open();

        }
    }

    class KodiRPCServerSelector {

        static loadStyles(){
            if (this.styles === true) return;
            this.styles = true;

            let styles = `
                .kodirpc-server-selector, 
                .kodirpc-server-selector fieldset legend
                {padding-top:0;padding-bottom:0;}
                .kodirpc-server-selector fieldset legend{margin-bottom:0;}
                .kodirpc-server-selector fieldset legend:before{display: none;}
                .kodirpc-server-selector .gm-list{border-radius: 0; padding:0;margin: 0;cursor: pointer;}
                .kodirpc-server-selector .gm-list [class*="gm-switch"] input{z-index:-1;visibility:hidden;}
            `;
            addstyle(styles);
        }

        get template(){
            return `<form class="kodirpc-server-selector">
                        <fieldset>
                            <legend>Server Selector</legend>
                            <ul class="gm-list"></ul>
                        </fieldset>
                    </form>`;
        }


        mkSwitch(server){

            if (server instanceof KodiRPCServer) {
                let
                        li = doc.createElement('li'),
                        label = doc.createElement('span'),
                        container = doc.createElement('span'),
                        slider = doc.createElement('span'),
                        checkbox = doc.createElement('input');
                container.classList.add('gm-switch-round-sm');
                slider.classList.add('slider');
                label.classList.add('gm-label');
                Object.assign(checkbox, {
                    type: "checkbox",
                    name: server.uniqid
                });
                label.innerHTML = server.name;
                container.appendChild(checkbox);
                container.appendChild(slider);

                li.appendChild(container);
                li.appendChild(label);
                
                let obj = {
                    uniqid: server.uniqid,
                    root: li,
                    input: checkbox,
                    label: label,
                    server: server
                };
                Object.defineProperties(obj, {
                    form: {
                        set(v){},
                        get(){
                            return this.input.form;
                        }
                    }
                });
                Object.defineProperties(checkbox, {
                    infos: {
                        set(v){}, get(){
                            return obj;
                        }
                    }
                });
                Object.defineProperties(li, {
                    checked: {
                        set(v){
                            checkbox.checked = v === true;
                        },
                        get(){
                            return checkbox.checked === true;
                        }
                    }
                });

                new Events(checkbox, obj);

                li.addEventListener('click', function(e){
                    e.preventDefault();
                    this.checked = this.checked !== true;
                    obj.trigger('change');
                });

                return li;
            }

        }


        constructor(callback){

            if (typeof callback !== f) throw new Error('KodiRPCServerSelector invalid argument');

            const
                    self = this,
                    client = new KodiRPCClient();

            Object.assign(this, {
                root: html2element(self.template),
                servers: client.servers,
                last: client.last,
                dialog: new gmDialog(doc.body, {
                    title: GMinfo.script.name,
                    width: "50%",
                    buttons: {
                        yes: "Send",
                        no: "Cancel"
                    },
                    events: {
                        open(){
                            const
                                    servers = self.servers,
                                    last = self.last;
                            let ul = self.root.querySelector('.gm-list');
                            servers.forEach(server => {
                                let li = self.mkSwitch(server);
                                if (typeof last[server.uniqid] !== u) li.checked = true;
                                ul.appendChild(li);
                            });




                        },
                        change(e){
                            console.debug(e);
                            console.debug(this);
                        }
                    }
                })
            });
            self.dialog.body = self.root;
            //self.dialog.elements.body.classList.add('gm-flex-center');
            new Events(self.root, self);

            KodiRPCServerSelector.loadStyles();

            self.dialog.open();
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
                .KodiRPCUI{position: absolute; top: 64px;right:32px;z-index: 2147483646;}
                .KodiRPCUI img{width:64px;height:64px;}
                .KodiRPCUI button{cursor:pointer;}
                .KodiRPCUI-expand {}
                .KodiRPCUI-toolbar, .KodiRPCUI-servers, .KodiRPCUI-servers-title {display: block;background-color: rgba(255, 255, 255, 0.45);display:block;}
                .KodiRPCUI-toolbar button, .KodiRPCUI-toolbar button:hover, .KodiRPCUI-toolbar button:active{
                    padding: 16px 24px;border-radius:0;width:150px;
                }
                .KodiRPCUI-toolbar button:hover, .KodiRPCUI-toolbar button:active, .KodiRPCUI-servers li:hover , .KodiRPCUI-servers-title:hover{
                    background-color: rgba(0,0,0,.125);
                }
                .KodiRPCUI-servers {list-style-type: none;}
                .KodiRPCUI-servers li, .KodiRPCUI-servers-title{
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
                .KodiRPCUI-notify{z-index: 2147483646;cursor:pointer;position: fixed; bottom:128px; right: 32px;width:400px;text-align: center;}
                .KodiRPCUI-servers, .KodiRPCUI-servers-title{display: none;}
                .KodiRPCUI:hover [class*="KodiRPCUI-servers"]{display: block;}
                .KodiRPCUI [hidden], .KodiRPCUI[hidden]{display: none !important; opacity:0!important; z-index: -1 !important;}
            `;
            addstyle(styles);
        }

        get visible(){
            let retval = true;
            if (this.root.hidden === true) retval = false;
            else if (this.elements.toolbar.hidden === true) retval = false;
            else if (this.root.parentElement === null) retval = false;
            return retval;
        }

        expand(hidden = true){
            const self = this;
            hidden = hidden === true ? true : null;
            self.elements.slist.hidden = self.elements.toolbar.hidden = hidden === true ? null : true;
            self.elements.expand.hidden = hidden;
        }


        start(){
            const self = this;
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


        constructor(video){

            if (!(video instanceof Element)) return;
            const self = this;
            const icon = `data:image/png;base64,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`;


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
                cache: cache,
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
                        target = e.target.closest('li[data-uniqid]');
                        if (target !== null) self.actions.check.call(target, e);

                    },
                    init(e){
                        e.preventDefault();
                        e.stopPropagation();
                        self.elements.slist.querySelectorAll('li').forEach(li => li.remove());
                        let servers = self.client.servers;
                        servers.forEach((server, i) => {
                            let li = html2element(`<li>${server.name}</li>`);
                            li.data({
                                uniqid: server.uniqid
                            });
                            self.elements.slist.appendChild(li);
                            li.data('online', server.online);

                        
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

                    check(e){
                        const target = this;
                        if (!self.visible) return;
                        let servers = self.client.servers, id = target.data('uniqid'), server;
                        servers.forEach(x => {
                            if (x.uniqid === id) server = x;
                        });

                        if (server instanceof KodiRPCServer) {
                            target.data('online', null);
                            let item = self.cache.getItem(id);
                            if (typeof e !== u) self.flash.message = "Checking connection to " + server.name;
                            self.client.sendRPCRequest(server, "Playlist.GetPlaylists", {}, () => {
                                item.set(true);
                            }, () => {
                                item.set(false);
                            },()=>{
                                target.data('online', item.get() === true);
                                self.cache.save(item);
                            });
                        }
                    },

                    expand(){
                        self.trigger('init toggle');

                    },
                    settings(){
                        self.trigger('kodirpc.settings', {
                            close(){
                                self.trigger('init');
                            }
                        });
                    },
                    send(){
                        let url = null, possible = [], match = false;

                        possible.push(self.video.src || "");
                        possible.push(self.video.data("src") || "");
                        self.video.querySelectorAll('source[src^="http"]').forEach(source => {
                            possible.push(source.getAttribute('src'));
                        });

                        possible.forEach(src => {
                            if (match === true) return;
                            if (/^http/i.test(src)) {
                                match = true;
                                url = src;
                            }
                        });

                        if (url !== null) {
                            self.trigger('kodirpc.send', {
                                link: url,
                                success(json, server){
                                    self.flash.success = "Stream sent to " + server.name;
                                },
                                error(code, server){
                                    self.flash.error = "Cannot send stream to " + server.name + " (" + code + ")";
                                },
                                complete(s){

                                    self.expand(false);
                                }
                            });

                            self.flash.info = "Sending stream to Kodi.";

                        }


                    }
                }
            });

            self.elements = {
                toolbar: self.root.querySelector('.KodiRPCUI-toolbar'),
                slist: self.root.querySelector('.KodiRPCUI-servers'),
                expand: self.root.querySelector('.KodiRPCUI-expand'),
                buttons: {}
            };

            self.root.querySelectorAll('button[name]').forEach(btn => {
                let name = btn.getAttribute('name');
                self.elements.buttons[name] = btn;
            });

            self.flash = new gmFlash(self.notifications);
            new Events(self.root, self);

            Object.keys(self.events).forEach(type => self.on(type, self.events[type]));

            KodiRPCUI.loadStyles();
            

            Events(self.video).on('play pause', e => {
                self.root.hidden = e.type === "play" ? true : null;
            });

            Events(doc.body).on('click', e => {
                if (e.target.closest('.KodiRPCUI, [class*="gm-"]') === null) self.expand(false);
            });

            setTimeout(() => {
                self.root.hidden = self.video.paused === true ? null : true;
            }, 1000);

            let module = doc.documentElement.KodiRPCModule;
            if ((module instanceof KodiRPCModule) && (module.ready === true)) return self.start();

            Events(doc.body)
                    .on('kodirpc.ready', e => self.start())
                    .on('kodirpc.update', e => {
                        let server = e.data.server;
                        self.elements.slist.querySelectorAll('li[data-uniqid]').forEach(li => {
                            if (li.data('uniqid') === server.uniqid) li.data('online', server.online);
                        });
                    });
            new KodiRPCModule();
        }

    }


    new KodiRPCServerSelector(x => x);


    (() => {
        const elements = [];
        find({
            selector: `video[src^="http"], video source[src^="http"], video[data-src^="http"]`,
            timeout: 0,
            interval: 1000,
            onload(el){
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