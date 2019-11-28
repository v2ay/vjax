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

            for (var i in params) {
                var param = params[i];
                
                // Form data serialize Accept(id, class, attribute)
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
                }

                if (typeof param == "object") {
                    for (k in param) {
                        datas.push(k + "=" + param[k]);
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

                    if (options.container) {
                        if (typeof options.container == "string") {
                            container = options.container;
                        } else {
                        // Find container
                        for (var i in options.container) {
                                var optionContainer = options.container[i];
                                
                                if (optionContainer.code == response.code) {
                                container = optionContainer.id;

                                break;
                                }
                            }
                        }
                    }

                    // html response
                    if (response.type == 'html' && response.content && container) {
                        var view = response.content;

                        // Container is modal
                        if (container == options.modal) {
                            var context = $(options.modal);

                            $(context).html(view);
                            $(context).modal('show');

                            options.reloadScript();
                        }

                        // Container not modal
                        if (container != options.modal) {
                            var context = $(document);

                            var scroll = $(context).scrollTop();

                            $(context).find(container).html(view);
                            options.reloadScript();
                            $(context).scrollTop(scroll);
                        }

                        // complete callback
                        options.complete();
                    }

                    if (response.type == 'redirect') {
                        window.location.href = response.content;
                    }
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