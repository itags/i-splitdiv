module.exports = function (window) {
    "use strict";

    require('./css/i-splitdiv.css'); // <-- define your own itag-name here

    var itagCore = require('itags.core')(window),
        itagName = 'i-splitdiv', // <-- define your own itag-name here
        DOCUMENT = window.document,
        ITSA = window.ITSA,
        Event = ITSA.Event,
        Itag;

    if (!window.ITAGS[itagName]) {

        Event.after('mousedown', function(e) {
            var element = e.target.inside('i-splitdiv'),
                section1 = element.getData('_section1'),
                model = element.model,
                horizontal = model.horizontal,
                size = horizontal ? 'width' : 'height',
                maxSize = element[size] - (parseInt(element.getStyle('border-left-'+size), 10) || null) - (parseInt(element.getStyle('border-right-'+size), 10) || 0),
                startPos, initialSize, moveListener;
            element.setClass('i-resizing');
            startPos = horizontal ? e.clientX : e.clientY;
            initialSize = section1[size];
            moveListener = Event.after('mousemove', function(e2) {
                var newPos = horizontal ? e2.clientX : e2.clientY,
                    difference = newPos - startPos,
                    newSize = Math.inbetween(0, initialSize + difference, maxSize);
                model.divider = newSize+'px';
            });

            Event.onceAfter('mouseup', function(e3) {
                var newPos = horizontal ? e3.clientX : e3.clientY,
                    difference = newPos - startPos,
                    newSize = Math.inbetween(0, initialSize + difference, maxSize);
                moveListener.detach();
                element.removeClass('i-resizing');
                model.divider = newSize+'px';
            });
        }, 'i-splitdiv[resizable="true"] .resize-handle');

        Itag = DOCUMENT.defineItag(itagName, {
            attrs: {
                horizontal: 'boolean',
                divider: 'string',
                'divider-min': 'string',
                'divider-max': 'string',
                resizable: 'boolean'
            },

            render: function() {
                var element = this,
                    designNode = element.getItagContainer(),
                    sections = designNode.getAll('>section'),
                    container = element.append('<div></div>');
                if (sections[0]) {
                    sections[0].setAttr('section', 'first', true);
                    element.setData('_section1', container.append('<div section="first">'+sections[0].getOuterHTML(null, true)+'</div>'));
                     // add the divider:
                    element.setData('_divider', container.addSystemElement('<div class="resize-handle"></div>'));
                }
                if (sections[1]) {
                    sections[1].setAttr('section', 'second', true);
                    element.setData('_section2', container.append('<div section="second">'+sections[1].getOuterHTML(null, true)+'</div>'));
                }
            },

            sync: function() {
                var element = this,
                    model = element.model,
                    section1 = element.getData('_section1'),
                    section2 = element.getData('_section2'),
                    dividerNode = element.getData('_divider'),
                    divider = model.divider,
                    size, removeSize, value, indent;
                if (section1 && section2) {
                    if (model.horizontal) {
                        size = 'width';
                        removeSize = 'height';
                        indent = 'left';
                    }
                    else {
                        size = 'height';
                        removeSize = 'width';
                        indent = 'top';
                    }
                    value = model['dividerNode-min'];
                    if (value) {
                        section1.setInlineStyle('min-'+size, value);
                    }
                    else {
                        section1.removeInlineStyle('min-'+size);
                    }
                    value = model['dividerNode-max'];
                    if (value) {
                        section1.setInlineStyle('max-'+size, value);
                    }
                    else {
                        section1.removeInlineStyle('max-'+size);
                    }
                    section1.removeInlineStyle('min-'+removeSize);
                    section1.removeInlineStyle('max-'+removeSize);
                    section1.removeInlineStyle(removeSize);
                    value = divider;
                    section1.setInlineStyle(size, value);
                    dividerNode.setInlineStyle(indent, (section1[size] - Math.round((dividerNode[size])/2))+'px');
                }
            },

            destroy: function() {
            }
        });

        itagCore.setContentVisibility(Itag, true);
        window.ITAGS[itagName] = Itag;
    }

    return window.ITAGS[itagName];
};