
function oabutton(options) {
    var about = {
        version: 0.1,
        author: "Mark MacGillivray",
        created: "01102014",
        description: "A javascript client that operates against the Open Access Button 2.0 API"
    }
    var defaults = {
        api: 'http://oabutton.cottagelabs.com',
        api_key: ''
    }
    this.options = $.extend(defaults, options);
    this.response = {};
}

oabutton.prototype = {
    send: function(action,o) {
        this.options.api_key && !o.data.api_key ? o.data.api_key = this.options.api_key : false;
        var vars = {
            type: 'POST',
            url: this.options.api + '/' + action,
            contentType: 'application/json',
            dataType: 'JSON',
            processData: false,
            //crossDomain: true,
            cache: false,
            context: this,
            data: JSON.stringify(o.data)
        }
        vars.success = function(res) {
            this.response = res;
            if ( !this.options.api_key && res.api_key ) {
                this.options.api_key = res.api_key;
            }
            if ( !this.options.username && res.username ) {
                this.options.username = res.username;
            }
            typeof o.success == 'function' ? o.success(res) : false;
        }
        typeof o.error == 'function' ? vars.error = o.error : false;
        $.ajax(vars);
    },
    register: function(o) {
        // o should be an object containing a data object with email, profession, username
        // and also a success function and error function if required
        this.send('register',o);
    },
    status: function(o) {
        //this.send('status',o);
        // TODO: annoying behaviour of CORS on POST means this is being fugded as a JSONP GET for now
        this.options.api_key && !o.data.api_key ? o.data.api_key = this.options.api_key : false;
        var vars = {
            type: 'GET',
            url: this.options.api + '/status',
            cache: false,
            context: this,
            dataType: 'JSONP',
            data: o.data,
            success: function(res) {
                this.response = res;
                typeof o.success == 'function' ? o.success(res) : false;
            }
        }
        typeof o.error == 'function' ? vars.error = o.error : false;
        $.ajax(vars);
    },
    blocked: function(o,rid) {
        var t = 'blocked';
        if ( rid ) {
            t += '/' + rid;
        }
        this.send(t,o);
    },
    wishlist: function(o) {
        this.send('wishlist',o);
    }
    // TODO: add the processor API route
}


