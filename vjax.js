(function($) {
    Plugin = function(options) {
        var defaultOptions = {
            url: null,
            method: 'get',
            data: null,
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

            $.ajax({
                url: options.url || window.location.pathname,
                method: options.method,
                dataType: 'json',
                data: formData,
                beforeSend: function () {},
                success: function (response, status, xhr) {
                    var container = null;
                    var containerAppend = false;

                    if (options.container) {
                        if (typeof options.container == "string" || options.container instanceof jQuery) {
                            container = $(options.container);
                        } else {
                            // Find container
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

                    // HTML response
                    if (response.type == 'html' && response.content && container) {
                        var view = response.content;

                        // Container is modal
                        if (container.is($(options.modal))) {
                            var context = $(options.modal);

                            if (containerAppend == true) {
                                $(context).append(view);
                            } else {
                                $(context).html(view);
                            }

                            $(context).modal('show');

                            options.reloadScript();
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

                            options.reloadScript();
                            $(context).scrollTop(scroll);
                        }
                    }

                    // REDIRECT response
                    if (response.type == 'redirect') {
                        window.location.href = response.content;
                    }

                    // ANY response
                    if (!response.type || (response.type != 'html' && response.type != 'redirect')) {
                        options.reloadScript(response, status, xhr);
                    }

                    // complete callback
                    options.complete(response, status, xhr);
                },
                complete: function() {}
            });
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
                alert(e + ' at line ' + e.lineNumber);
            }
        });
    };
})(jQuery);
