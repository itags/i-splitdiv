module.exports = function (window) {
    "use strict";

    require('./css/i-splitdiv.css'); // <-- define your own itag-name here

    var itagCore = require('itags.core')(window),
        itagName = 'i-splitdiv', // <-- define your own itag-name here
        DOCUMENT = window.document,
        documentElement = DOCUMENT.documentElement,
        bodyElement = DOCUMENT.body,
        ITSA = window.ITSA,
        Event = ITSA.Event,
        DIVIDER = 'divider',
        Itag;

    if (!window.ITAGS[itagName]) {

        Event.after('mousedown', function(e) {
            var resizeNode = e.target,
                element = resizeNode.inside('i-splitdiv'),
                sectionId = resizeNode.getData('_section'),
                reverseResize = resizeNode.getData('_reverse'),
                modelDivider = DIVIDER + (sectionId-1),
                section = element.getData('_section'+sectionId),
                borderSection = resizeNode.getData('_borderNode'),
                model = element.model,
                horizontal = model.horizontal,
                size = horizontal ? 'width' : 'height',
                maxSize = element['inner'+ (horizontal ? 'Width' : 'Height')] - (parseInt(borderSection.getStyle('border-'+(horizontal ? (reverseResize ? 'right' : 'left') : (reverseResize ? 'bottom' : 'top'))+'-width'), 10) || 0),
                startPos, initialSize, moveListener;
            if ((modelDivider===DIVIDER+'0') || (modelDivider===DIVIDER+'1')) {
                modelDivider = DIVIDER;
            }
            element.setClass('i-resizing');
            startPos = horizontal ? e.clientX : e.clientY;
            initialSize = section[size];
            moveListener = Event.after('mousemove', function(e2) {
                var newPos = horizontal ? e2.clientX : e2.clientY,
                    difference = newPos - startPos,
                    newSize;
                reverseResize && (difference=-difference);
                newSize = Math.inbetween(0, initialSize + difference, maxSize);
                model[modelDivider] = newSize+'px';
            });

            Event.onceAfter('mouseup', function(e3) {
                var newPos = horizontal ? e3.clientX : e3.clientY,
                    difference = newPos - startPos,
                    newSize;
                reverseResize && (difference=-difference);
                newSize = Math.inbetween(0, initialSize + difference, maxSize);
                moveListener.detach();
                element.removeClass('i-resizing');
                model[modelDivider] = newSize+'px';
            });
        }, 'i-splitdiv >section >section.resize-handle');

        Itag = DOCUMENT.defineItag(itagName, {
            attrs: {
                horizontal: 'boolean',
                divider: 'string',
                'divider-min': 'string',
                'divider-max': 'string',
                resizable: 'boolean',
                'full-page': 'boolean'
            },

            render: function() {
                var element = this,
                    designNode = element.getItagContainer(),
                    sections = designNode.getAll('>section'),
                    container = element.append('<section></section>'),
                    divider, node;
                if (sections[0]) {
                    sections[0].setAttr('section', 'first', true);
                    element.setData('_section1', container.append('<section container="first">'+sections[0].getOuterHTML(null, true)+'</section>'));
                     // add the divider:
                    divider = container.addSystemElement('<section class="resize-handle first"></section>');
                    divider.setData('_section', 1);
                    element.setData('_divider1', divider);
                }
                if (sections[1]) {
                    sections[1].setAttr('section', 'second', true);
                    node = container.append('<section container="second">'+sections[1].getOuterHTML(null, true)+'</section>');
                    element.setData('_section2', node);
                    divider && divider.setData('_borderNode', node);
                }
                if (element.model['full-page']) {
                    documentElement.setClass('i-splitdiv-full-page');
                    bodyElement.setClass('i-splitdiv-full-page');
                }
            },

            sync: function() {
                var element = this,
                    model = element.model,
                    section1 = element.getData('_section1'),
                    section2 = element.getData('_section2'),
                    dividerNode = element.getData('_divider1'),
                    reverseResize = dividerNode.getData('_reverse'),
                    resizeSection = element.getData('_section'+dividerNode.getData('_section')),
                    divider = model.divider,
                    size, removeSize, value, indent;
                if (section1 && section2) {
                    if (model.horizontal) {
                        size = 'width';
                        removeSize = 'height';
                        indent = reverseResize ? 'right' : 'left';
                    }
                    else {
                        size = 'height';
                        removeSize = 'width';
                        indent = reverseResize ? 'bottom' : 'top';
                    }
                    value = model['divider-min'];
                    if (value) {
                        resizeSection.setInlineStyle('min-'+size, value);
                    }
                    else {
                        resizeSection.removeInlineStyle('min-'+size);
                    }
                    value = model['divider-max'];
                    if (value) {
                        resizeSection.setInlineStyle('max-'+size, value);
                    }
                    else {
                        resizeSection.removeInlineStyle('max-'+size);
                    }
                    resizeSection.removeInlineStyle('min-'+removeSize);
                    resizeSection.removeInlineStyle('max-'+removeSize);
                    resizeSection.removeInlineStyle(removeSize);
                    value = divider;
                    resizeSection.setInlineStyle(size, value);
                    dividerNode.setInlineStyle(indent, (resizeSection[size] - Math.round(dividerNode[size]/2))+'px');
                }
            },

            destroy: function() {
                if (this.model['full-page']) {
                    documentElement.removeClass('i-splitdiv-full-page');
                    bodyElement.removeClass('i-splitdiv-full-page');
                }
            }
        });

        itagCore.setContentVisibility(Itag, true);
        window.ITAGS[itagName] = Itag;
    }

    return window.ITAGS[itagName];
};