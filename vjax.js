(function($) {
    Plugin = function(options) {
        var defaultOptions = {
            url: null,
            method: 'get',
            data: null,
            csrf: null,
            container: null,
            replaceUrl: false,
            historyPush: false,
            reloadScript: function(){},
            complete: function(){},
            modal: '#modal'
        }

        var options = $.extend(true, defaultOptions, options || {})

        var virtualFormData = function(params) {
            var datas = new Array();

            if (Array.isArray(params) == false) {
                params = [params];
            }

            for (var i in params) {
                var param = params[i];

                if (param && typeof param == "string") {
                    // id, class, attribute
                    if ((/^\.|\[|#/).test(param)) {
                        var objects = $(document).find(param);

                        objects.each(function() {
                            var that = $(this);

                            if (that.prop('nodeName') == 'OPTION') {
                                that = that.parent();
                            }

                            var serial = that.serialize();

                            if (serial) {
                                datas.push(serial);
                            }
                        });
                    } else {
                        // serial
                        datas.push(param);
                    }
                }

                // object json or dom object
                if (param && typeof param == "object") {
                    if (param instanceof jQuery) {
                        serial = param.serialize()
                        datas.push(serial);
                    } else {
                        for (k in param) {
                            datas.push(k + "=" + param[k]);
                        }
                    }
                }
            }

            return datas.join('&');
        }

        var ajaxPushState = function(that) {
            var isModal = false;
            var formData = virtualFormData(options.data); // Form data serialize Accept(id, class, attribute)

            if (!isModal) {
                if (options.replaceUrl) {
                    // Replace State url
                    window.History.replaceState(null, null, options.url);
                }

                if (options.historyPush) {
                    // Push State history
                    window.History.pushState(null, null, options.url);
                }
            }

            var callbacks = new Array();

            if (that.attr('data-ajax-callback')) {
                callbacks = that.attr('data-ajax-callback').split(',');
            }

            // var xhrHttpRequest = new XMLHttpRequest();

            var requestURL = options.url || window.location.pathname;
            var requestPathname = parseUrl(requestURL).pathname;

            $.ajax({
                url: requestPathname,
                method: options.method,
                data: formData,
                /*xhr: function() {
                    return xhrHttpRequest;
                },*/
                beforeSend: function (xhr, settings) {
                    if (options.csrf && settings.type == 'POST') {
                        xhr.setRequestHeader("X-CSRF-Token", options.csrf);
                    }
                },
                success: function (response, status, xhr) {
                    /*
                    // Force request redirect if request url and response url are differents
                    var responseURL = xhrHttpRequest.responseURL;
                    var responsePathname = parseUrl(responseURL).pathname;

                    if (requestPathname != responsePathname) {
                        window.location.href = responsePathname;
                    } 

                    console.log(responsePathname);
                    console.log(requestPathname);
                    */

                    var container = null;
                    var containerAppend = false;

                    if (options.container) {
                        if (typeof options.container == "string" || options.container instanceof jQuery) {
                            container = $(options.container);
                        } else {
                            if (xhr.responseJSON) {
                                // Find code container
                                for (var i in options.container) {
                                    var optionContainer = options.container[i];

                                    if (optionContainer.code == response.code) {
                                        container = $(optionContainer.id);
                                        containerAppend = optionContainer.append;

                                        break;
                                    }
                                }
                            }
                        }
                    }

                    var view = null;

                    if (xhr.responseText) {
                        view = response;
                    }

                    if (xhr.responseJSON) {
                        // HTML response
                        if (response.type == 'html') {
                            view = response.content;
                        }

                        // REDIRECT response
                        if (response.type == 'redirect') {
                            window.location.href = response.content;
                        }

                        // ANY response
                        if (!response.type || (response.type != 'html' && response.type != 'redirect')) {
                            options.reloadScript(response, status, xhr);
                        }
                    }

                    if (container && view) {
                        // Container is modal
                        if (container.is($(options.modal))) {
                            var context = $(options.modal);

                            if (containerAppend == true) {
                                $(context).append(view);
                            } else {
                                $(context).html(view);
                            }

                            $(context).modal('show');

                            options.reloadScript(response, status, xhr);
                        }

                        // Container not modal
                        if (!container.is($(options.modal))) {
                            var context = $(document);

                            var scroll = $(context).scrollTop();

                            if (containerAppend == true) {
                                $(context).find(container).append(view);
                            } else {
                                $(context).find(container).html(view);
                            }

                            options.reloadScript(response, status, xhr);
                            
                            $(context).scrollTop(scroll);
                        }
                    }

                    // VJAX next
                    callbacks.forEach(function(callback) {
                        $(document).trigger('vjax:' + callback.replace(/\s/g, ''));
                    });

                    // complete callback
                    options.complete(response, status, xhr);
                },
                complete: function(response, status, xhr) {}
            });
        }

        var parseUrl = function( url ) {
            var a = document.createElement('a');
            a.href = url;
            return a;
        }

        this.init = function(that) {
            ajaxPushState(that);
        }
    };

    $.fn.vjax = function(options) {
        return this.each(function() {
            try {
                var that = $(this);

                var plugin = new Plugin(options);
                
                plugin.init(that);
            } catch(e) {
                console.log(e + ' at line ' + e.lineNumber);
            }
        });
    };
})(jQuery);