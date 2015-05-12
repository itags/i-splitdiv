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

        Event.after('dd', function(e) {
            // start dragging
            var node = e.target,
                isplitdiv = node.inside('i-splitdiv'),
                dragPromise = e.dd;
            isplitdiv.setData('_dragging', true);
            isplitdiv.setClass('i-resizing');
            dragPromise.finally(function() {
                isplitdiv.removeData('_dragging');
                isplitdiv.removeClass('i-resizing');
            });
        }, 'i-splitdiv .resize-handle');

        Event.before('dd-drag', function(e) {
            var node = e.target,
                isplitdiv = node.inside('i-splitdiv'),
                // divider = isplitdiv.getData('_divider'),
                model = isplitdiv.model,
                horizontal = model.horizontal,
                dimension = horizontal ? 'width' : 'height',
                start = horizontal ? 'left' : 'top',
                end = horizontal ? 'right' : 'bottom',
                borderStart = parseInt(isplitdiv.getStyle('border-'+start+'-'+dimension) || 0, 10),
                borderEnd = parseInt(isplitdiv.getStyle('border-'+end+'-'+dimension) || 0, 10),
                extra = isplitdiv[start] + borderStart,
                min = (model['divider-min'] || 0),
                max = (model['divider-max'] || isplitdiv[dimension]),
                maxSize = isplitdiv[dimension] - borderStart - borderEnd;
            min = Math.max(0, min);
            max = Math.min(maxSize, max);
            min += extra;
            max += extra;
            if ((e[(horizontal ? 'x' : 'y')+'Mouse']<min) || (e[(horizontal ? 'x' : 'y')+'Mouse']>max)) {
                e.preventDefault();
            }
        }, 'i-splitdiv .resize-handle');

        Event.after('dd-drag', function(e) {
            var node = e.target,
                isplitdiv = node.inside('i-splitdiv'),
                divider = isplitdiv.getData('_divider'),
                model = isplitdiv.model,
                horizontal = model.horizontal,
                dimension = horizontal ? 'width' : 'height',
                start = horizontal ? 'left' : 'top',
                halfSplitSize = Math.round(divider[dimension]/2),
                borderStart = parseInt(isplitdiv.getStyle('border-'+start+'-'+dimension) || 0, 10);
            model.divider = (divider[start]-isplitdiv[start]-borderStart+halfSplitSize) +'px';

        }, 'i-splitdiv .resize-handle');

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
                    element.setData('_section1', container.append('<div>'+sections[0].getOuterHTML(null, true)+'</div>'));
                    element.setData('_section1HiddenCopy', container.addSystemElement('<div class="hidden-copy suppress-trans"></div>'));
                }
                if (sections[1]) {
                    sections[1].setAttr('section', 'second', true);
                    element.setData('_section2', container.append('<div>'+sections[1].getOuterHTML(null, true)+'</div>'));
                }
                 // add the divider, but not silently --> we need to enable the dd-plugin to render:
                element.setData('_divider', container.addSystemElement('<div class="resize-handle" plugin-constrain="true" constrain-selector="i-splitdiv"></div>', false, false));
            },

            sync: function() {
                var element = this,
                    model = element.model,
                    section1 = element.getData('_section1'),
                    section1HiddenCopy = element.getData('_section1HiddenCopy'),
                    section2 = element.getData('_section2'),
                    divider = element.getData('_divider'),
                    size, indent, removeSize, removeIndent, value, isDragging;
                if (section1 && section2) {
                    isDragging = element.getData('_dragging');
                    if (model.horizontal) {
                        size = 'width';
                        indent = 'left';
                        removeSize = 'height';
                        removeIndent = 'top';
                    }
                    else {
                        size = 'height';
                        indent = 'top';
                        removeSize = 'width';
                        removeIndent = 'left';
                    }
                    divider[model.resizable ? 'plug' : 'unplug']('dd');
                    value = model['divider-min'];
                    if (value) {
                        section1.setInlineStyle('min-'+size, value);
                        section1HiddenCopy.setInlineStyle('min-'+size, value);
                    }
                    else {
                        section1.removeInlineStyle('min-'+size);
                        section1HiddenCopy.removeInlineStyle('min-'+size);
                    }
                    value = model['divider-max'];
                    if (value) {
                        section1.setInlineStyle('max-'+size, value);
                        section1HiddenCopy.setInlineStyle('max-'+size, value);
                    }
                    else {
                        section1.removeInlineStyle('max-'+size);
                        section1HiddenCopy.removeInlineStyle('max-'+size);
                    }
                    section1.removeInlineStyle('min-'+removeSize);
                    section1.removeInlineStyle('max-'+removeSize);
                    section1.removeInlineStyle(removeSize);
                    section1HiddenCopy.setInlineStyle(size, model.divider);
                    section1HiddenCopy.removeInlineStyle('min-'+removeSize);
                    section1HiddenCopy.removeInlineStyle('max-'+removeSize);
                    section1HiddenCopy.removeInlineStyle(removeSize);
                    // now use, the true width of section1 to set the offset of section2:
                    // in case `divider` is set in pixels, we can use it straight ahead
                    // in all other cases we need to calculate the width --> CAUTIOUS: this might be set with transition!
                    if (!isDragging && !model.divider.endsWith('px')) {
                        // we need to go async --> section1 might have itags that need rendering
                        ITSA.async(function() {
                            section1HiddenCopy.setHTML(section1.getHTML(null, true), true);
                            value = section1HiddenCopy[size];
                            section1.setInlineStyle(size, value+'px', null, true).finally(function() {
                                section1.setClass('suppress-trans');
                                section1.setInlineStyle(size, model.divider);
                                section1.removeClass('suppress-trans');
                            });
                            section2.setInlineStyles([
                                {property: 'margin-'+indent, value: -value+'px'},
                                {property: 'padding-'+indent, value: value+'px'}
                            ]);
                            section2.removeInlineStyle('margin-'+removeIndent);
                            section2.removeInlineStyle('padding-'+removeIndent);
                            if (!isDragging) {
                                divider.setInlineStyle(indent, (value-(divider[size]/2))+'px');
                                divider.removeInlineStyle(removeIndent);
                            }
                        });
                    }
                    else {
                        section1.setInlineStyle(size, model.divider);
                        value = parseInt(model.divider, 10);
                        section2.setInlineStyles([
                            {property: 'margin-'+indent, value: -value+'px'},
                            {property: 'padding-'+indent, value: value+'px'}
                        ]);
                        section2.removeInlineStyle('margin-'+removeIndent);
                        section2.removeInlineStyle('padding-'+removeIndent);
                        if (!isDragging) {
                            divider.setInlineStyle(indent, (value-(divider[size]/2))+'px');
                            divider.removeInlineStyle(removeIndent);
                        }
                    }


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