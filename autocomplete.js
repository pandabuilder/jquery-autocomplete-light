function Autocomplete(el) {
    this.el = el;
    this.el.attr('autocomplete', 'off');
    this.value = '';
    this.xhr = false;
    this.url = false;
    this.timeout = 100;
    this.id = false;
    this.minCharacters = 2;
    this.defaultValue = 'type your search here';
    this.activeClass = 'active';
    this.iterablesSelector = 'li:has(a)';
    this.queryVariable = 'q';
    this.blurTimeout = 500;
    this.appendTo = $('body');
    this.outerContainerClasses = '';
    this.data = {};

    this.initialize = function() {
        var autocomplete = this;

        this.el.val(this.defaultValue);
        this.el.live('focus', function() {
            if ($(this).val() == autocomplete.defaultValue) {
                $(this).val('');
            }
        });
        this.el.live('blur', function() {
            if ($(this).val() == '') {
                $(this).val(autocomplete.defaultValue);
            }
        });

        $('.yourlabs_autocomplete.inner_container.id_'+this.id+' ' + this.iterablesSelector).live({
            mouseenter: function(e) {
                $('.yourlabs_autocomplete.inner_container.id_'+autocomplete.id+' ' + autocomplete.iterablesSelector + '.' + autocomplete.activeClass).each(function() {
                    autocomplete.el.trigger('deactivateOption', [autocomplete, $(this)]);
                });
                autocomplete.el.trigger('activateOption', [autocomplete, $(this)]);
            },
            mouseleave: function(e) {
                autocomplete.el.trigger('deactivateOption', [autocomplete, $(this)]);
            },
            click: function(e) {
                e.preventDefault();
                e.stopPropagation();
                autocomplete.el.trigger('selectOption', [$(this)]);
            },
        });

        this.el.keyup(function(e) { autocomplete.refresh(); });

        $('<div id="id_'+this.id+'" class="'+this.outerContainerClasses+' yourlabs_autocomplete outer_container id_'+this.id+'" style="position:absolute;z-index:'+this.zindex+';"><div class="yourlabs_autocomplete id_'+this.id+'"><div class="yourlabs_autocomplete inner_container  id_'+this.id+'" style="display:none;"></div></div></div>').appendTo(this.appendTo);
        this.innerContainer = $('.yourlabs_autocomplete.inner_container.id_'+this.id);
        this.outerContainer = $('.yourlabs_autocomplete.outer_container.id_'+this.id);

        if (window.opera) {
            this.el.keypress(function(e) { autocomplete.onKeyPress(e); });
        } else {
            this.el.keydown(function(e) { autocomplete.onKeyPress(e); });
        }
        this.el.blur(function(e) { 
            window.setTimeout(function() {
                autocomplete.hide(); 
            }, autocomplete.blurTimeout);
        });
        //this.el.dblclick(function(e) { autocomplete.show(); });
        this.el.focus(function(e) { autocomplete.show(); });
    }
    
    this.onKeyPress = function(e) {
        var option;

        switch (e.keyCode) {
            case 27: //KEY_ESC:
                this.el.val();
                this.hide();
                break;
            case 9: //KEY_TAB:
                break;
            case 13: //KEY_RETURN:
                option = this.innerContainer.find(this.iterablesSelector + '.' + this.activeClass);
                if (option) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.el.trigger('selectOption', [option]);
                }
                if(e.keyCode === 9){ return; }
                break;
            case 38: //KEY_UP:
                this.move('up');
                break;
            case 40: //KEY_DOWN:
                this.move('down');
                break;
            default:
                return;
        }
        e.stopImmediatePropagation();
        e.preventDefault();
    }
    
    this.show = function(html) {
        if ($.trim(this.innerContainer.html()).length == 0 && !this.xhr) {
            this.fetchAutocomplete();
            return;
        }
        
        if (html) {
            this.innerContainer.html(html);
        }
        if (!this.innerContainer.is(':visible')) {
            this.outerContainer.show();
            this.innerContainer.show();
        }
    }
    
    this.hide = function() {
        this.outerContainer.hide();
        this.innerContainer.hide();
    }
    
    this.move = function(way) {
        var current, target, first, last;
        current = this.innerContainer.find(this.iterablesSelector + '.' + this.activeClass);
        first = this.innerContainer.find(this.iterablesSelector + ':first');
        last = this.innerContainer.find(this.iterablesSelector + ':last');

        this.show();

        if (current.length) {
            if (way == 'up') {
                target = current.prevAll(this.iterablesSelector + ':first');
                if (!target.length) {
                    target = last;
                }
            } else {
                target = current.nextAll(this.iterablesSelector + ':first');
                if (!target.length) {
                    target = first;
                }
            }
            this.el.trigger('deactivateOption', [this, current]);
        } else {
            if (way == 'up') {
                target = last;
            } else {
                target = first;
            }
        }
        this.el.trigger('activateOption', [this, target]);
    }
    
    this.fixPosition = function() {
        var css = {
            'top': Math.floor(this.el.offset()['top']),
            'left': Math.floor(this.el.offset()['left']),
            'position': 'absolute',
        }
        css['top'] += Math.floor(this.el.innerHeight());

        this.outerContainer.css(css);
    }
    
    this.refresh = function() {
        var newValue;
        newValue = this.el.val();
        if (newValue == this.defaultValue) {
            return false;
        }
        if (newValue.length < this.minCharacters) {
            return false;
        }
        if (newValue == this.value) {
            return false;
        }
        this.value = newValue;
        this.fetchAutocomplete();
    }
    
    this.fetchAutocomplete = function() {
        var autocomplete, data;

        if (this.xhr) {
            this.xhr.abort();
        }

        autocomplete = this;
        data = this.data;
        data[this.queryVariable] = this.value;
        this.xhr = $.ajax(this.url, {
            'data': data,
            'complete': function(jqXHR, textStatus) {
                autocomplete.fixPosition();
                autocomplete.show(jqXHR.responseText);
            },
        });
    }
}

$.fn.yourlabs_autocomplete = function(overrides) {
    var id;
    overrides = overrides ? overrides : {};
    id = overrides.id || this.attr('id');

    if (!(id && this)) {
        alert('failure: the element needs an id attribute, or an id option must be passed');
        return false;
    }
    
    if ($.fn.yourlabs_autocomplete.registry == undefined) {
        $.fn.yourlabs_autocomplete.registry = {};
    }
    
    if ($.fn.yourlabs_autocomplete.registry[id] == undefined) {
        $.fn.yourlabs_autocomplete.registry[id] = new Autocomplete(this);
        $.fn.yourlabs_autocomplete.registry[id] = $.extend($.fn.yourlabs_autocomplete.registry[id], overrides);
        $.fn.yourlabs_autocomplete.registry[id].initialize();
    }

    return $.fn.yourlabs_autocomplete.registry[id];
};

$(document).ready(function() {
    $(document).bind('activateOption', function(e, autocomplete, option) {
        option.addClass(autocomplete.activeClass);
    });
    $(document).bind('deactivateOption', function(e, autocomplete, option) {
        option.removeClass(autocomplete.activeClass);
    });
});
