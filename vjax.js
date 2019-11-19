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

    var virtualFormData = function(selector, context) {
      var objects = $(context).find(selector);
      var datas = new Array();

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

      return datas.join('&');
    }

    var ajaxPushState = function(that) {
      var isModal = false;
      var context = $(document);
      var formData = options.data;

      // If modal already opened, get modal context
      if (that.closest(options.modal).attr('id')) {
        context = $(options.modal);
      }

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

      // Form data serialize Accept(id, class, attribute)
      if ((/^\.|\[|#/).test(formData)) {
        formData = virtualFormData(formData, context);
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
              context = $(options.modal);

              $(context).html(view);
              $(context).modal('show');

              options.reloadScript();
            }

            // Container not modal
            if (container != options.modal) {
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

  $.vjax = function(options) {
    return this.each(function() {
      try {
        var that = $(this);

        var plugin = new Plugin(options);
        that.data(that, plugin);

        plugin.init(that);
      } catch(e) {
        alert(e + ' at line ' + e.lineNumber);
      }
    });
  };
})(jQuery);
