/*
┌────────────────────────────────────────────────────────────────────┐
│ Cross page load bar 0.1 by Nikos Vassiliou                         │
├────────────────────────────────────────────────────────────────────┤
│ https: https://github.com/nbasili/crosspageloadbar                 │
│ Licensed under the MIT license.                                    │
└────────────────────────────────────────────────────────────────────┘
*/

(function() {
  //initialize
  if (!window.CrossPageLoadBar) window.CrossPageLoadBar = {}
  function supported() {
    //detect browser
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isFirefox = typeof InstallTrigger !== 'undefined';
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    var isChrome = !!window.chrome && !isOpera;
    var isIE = /*@cc_on!@*/false || !!document.documentMode;
    //check browser version
    if (!isChrome && !isFirefox && !isOpera && !isIE) return false;
    //check session storage support
    if (!window.sessionStorage || !window.sessionStorage.setItem) return false;
    return true;
  }
  window.CrossPageLoadBar.init = function(options) {
    //append loading bar
    $('body').append(
      '<div id="crosspageloadbar-container"><div id="crosspageloadbar-percentage"></div></div>'
    );
    //cache selectors
    var timer = null;
    var el_window = $(window);
    var el_container = $('#crosspageloadbar-container');
    var el_percentage = $('#crosspageloadbar-percentage');
    //defaults
    var settings = {
      container_opacity: 1,
      fadeto_opacity: 0.1,
      enable_crossload: true,
      enable_ajax: false,
      enable_pjax: false,
      idle_msec: 1500,
      fadeout_msec: 1000,
      inc_msec: 6000
    };
    if (options) {
      for (key in options) {
        settings[key] = options[key];
      }
    }
    function __timeout(fcall) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fcall, settings.idle_msec);
    }
    window.CrossPageLoadBar._perc = function(offset) {
      return Math.max(0, Math.min(100,
        (offset || 0) + (el_percentage.width() * 100) / el_window.width()
      ));
    }
    window.CrossPageLoadBar.show = function(percentage) {
      el_container.stop(true, false).css({
        opacity: settings.container_opacity
      }).show();
      el_percentage.stop(true, false).css({
        width: percentage + '%'
      });
      return this;
    };
    window.CrossPageLoadBar.inc = function(perc) {
      el_percentage.stop(true, false).animate({
        width: Math.max(window.CrossPageLoadBar._perc(), perc) + '%'
      }, settings.inc_msec);
      return this;
    };
    window.CrossPageLoadBar.hide = function() {
      //reset any timers
      if (timer) {
        clearTimeout(timer);
        timer;
      }
      if (!el_container.is(':visible')) return;
      el_percentage.stop(true, false).animate({
        width: '100%'
      });
      el_container.fadeTo(settings.fadeout_msec, settings.fadeto_opacity, function() {
        el_container.hide();
      });
      return this;
    };

    //bind defaults
    if (supported()) {
      //bind cross load events
      if (settings.enable_crossload) {
        var oldbeforeunload = window.onbeforeunload;
        window.onbeforeunload = function() {
          if (oldbeforeunload) {
            var ret = oldbeforeunload();
            if (ret) return ret;
          }
          __timeout(function() {
            window.CrossPageLoadBar.show(0).inc(35);
          });
        }
        var oldunload = window.onunload;
        window.onunload = function() {
          if (oldunload) oldunload();
          el_percentage.stop(true, false);
          try {
            window.sessionStorage.setItem(
              'crosspageloadbar-state',
              window.CrossPageLoadBar._perc()
            );
          }
          catch(err) {}
        }
        //check for restoring previous state
        try {
          var previous_state = window.sessionStorage.getItem('crosspageloadbar-state') || 0;
          if (previous_state > 0) {
            window.sessionStorage.setItem('crosspageloadbar-state', 0);
            window.CrossPageLoadBar.show(previous_state).inc(60);
            var oldonload = window.onload;
            window.onload = function() {
              if (oldonload) oldonload();
              window.CrossPageLoadBar.hide();
            }
          }
        }
        catch(err) {}
      }
      //bind jquery ajax calls
      if (settings.enable_ajax) {
        $(document).ajaxStart(function() {
          __timeout(function() {
            window.CrossPageLoadBar.show(0).inc(50);
          });
        });
        $(document).ajaxComplete(function() {
          window.CrossPageLoadBar.hide();
        });
      }
      //bind pjax calls
      if (settings.enable_pjax) {
        $(document).on('pjax:start', function() {
          __timeout(function() {
            window.CrossPageLoadBar.show(0).inc(50);
          });
        });
        $(document).on('pjax:end', function() {
          window.CrossPageLoadBar.hide();
        });
      }
    }
    return this;
  }
})();

