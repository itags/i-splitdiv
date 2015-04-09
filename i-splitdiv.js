module.exports = function (window) {
    "use strict";

    require('./css/i-splitdiv.css'); // <-- define your own itag-name here

    var itagCore = require('itags.core')(window),
        itagName = 'i-splitdiv', // <-- define your own itag-name here
        DOCUMENT = window.document,
        ITSA = window.ITSA,
        Itag;

    if (!window.ITAGS[itagName]) {

        Itag = DOCUMENT.defineItag(itagName, {
            attrs: {
            },

            init: function() {
                var element = this,
                    designNode = element.getItagContainer();

                // when initializing: make sure NOT to overrule model-properties that already
                // might have been defined when modeldata was boundend. Therefore, use `defineWhenUndefined`
                // element.defineWhenUndefined('someprop', somevalue); // sets element.model.someprop = somevalue; when not defined yet

            },

            render: function() {
                // set the content:
                // element.setHTML('');
            },

            sync: function() {
            },

            destroy: function() {
            }
        });

        window.ITAGS[itagName] = Itag;
    }

    return window.ITAGS[itagName];
};
