// Main search module.
(function (mod) {
    'use strict';
    if (typeof exports === 'object' && typeof module === 'object') { // CommonJS
        module.exports = mod();
    } else if (typeof define === 'function' && define.amd) { // AMD
        return define([], mod);
    } else { // Plain browser env
        this.JsSearchEngine = mod();
    }
})(function () {
    'use strict';


    var Engine = function (options) {
        this._options = options || {};
        this._providers = [];
        this._render = null;
        this.clean();
        this._currentSearch = 0;
    };

    var p = Engine.prototype;

    function getToken(self, term) {
        var parts = term.split(':');
        if (parts.length === 2) {
            var isTokenExist = (parts[0] in self.getSearchTokens());
            if (isTokenExist) {
                return parts;
            }
        }
        return term;
    }


    // The function parses terms and returns the object {strong: object soft: array } of tokens.
    //  strong - tokens match on exact property.
    //  soft - match in one of the property.
    //  Delimiter is the space, delimiter for string tokens is ":".
    //
    //  self - an object instance of Engine class.
    //  terms - a String tokens string.
    //
    //  Return an Object
    function parseTerms(self, terms) {
        terms = terms.split(' ');
        var strong = {};
        var soft = [];
        for (var i = terms.length - 1; i >= 0; i--) {
            var term = terms[i];
            if (term.length === 0) {
                continue;
            }
            var data = getToken(self, term);
            if (typeof data !== 'string') {
                strong[data[0]] = data[1];
            } else {
                soft.push(term);
            }
        }

        return {
            strong: strong,
            soft: soft
        };
    }

    // function isSubsetFilter(oldTerms, newTerms) {
    //     var oldSoft = oldTerms.soft;
    //     var newSoft = newTerms.soft;
    //     if (newSoft.length !== oldSoft.length) { // different items count
    //         return false;
    //     }

    //     var oldStrong = oldTerms.strong;
    //     var newStrong = newTerms.strong;

    //     if (oldStrong.keys.length !== newStrong.keys.length) { // different items count
    //         return false;
    //     }

    //     var isSoftIDentical = compareSoft(oldSoft, newSoft);
    //     var isStrongDentical = compare();

    // }

    // function compareSoft(a1, a2) {
    //     a1 = a1.slice(0);
    //     a2 = a2.slice(0);

    //     for (var i = a1.length - 1; i >= 0; i--) {
    //         var token = a1[i];
    //         for (var i = a2.length - 1; i >= 0; i--) {
    //             a2[i]
    //         };
    //     };
    // }


    // Adds Provider to providers collection.
    //
    // provider - an instance of provider class.
    p.addProvider = function (provider) {
        this._providers.push(provider);
    };


    // Function collects all available from providers property tokens.
    //
    // self - an instance of Engine class.
    //
    // Returns an Object map {"token" : "description"}.
    function collectSearchTokens(self) {
        var providers = self._providers;
        var result = {};
        for (var i = 0; i < providers.length; i++) {
            var tokens = providers[i].getSearchTokens();
            for (var key in tokens) {
                if (tokens.hasOwnProperty(key)) {
                    result[key] = tokens[key];
                }
            }
        }
        return result;
    }


    // Returns all possible tokens for current set of providers.
    //
    // Returns an object  map {"token": "Description"}.
    p.getSearchTokens = function () {
        if (this._tokenCache) {
            return this._tokenCache;
        }
        return this._tokenCache = collectSearchTokens.call(null, this);
    };


    // Removes Provider from the search
    //
    // provider - an instance of Provider class to remove
    p.removeProvider = function (provider) {
        var index = this._providers.indexOf(provider);
        if (index === -1) {
            return;
        }
        this._providers.splice(index, 1);
    };

    // Return providers collection.
    p.getProviders = function () {
        return this._providers;
    };


    // Set render engine
    //
    // Render - an Object
    p.setRender = function (render) {
        this._render = render;
    };


    // Checks is str1 is filtering subset result of str2
    //
    // str1 - new String for search.
    // str2 - old string search was performed.
    //
    // Returns true if request just a subset filter.
    p.isSubsetFilter = function (str1, str2) {
        var isLength = str2.length > 0;
        var isExtend = isLength && str1.indexOf(str2) === 0;
        return isExtend && str1.split(':').length === str2.split(':').length;
    };

    // Performs search though all providers.
    //
    // terms - a string - search query.
    // callback - a function, callback for the search results, params:
    //      results - array of the result,
    //      provider - instance of provider results from.
    p.search = function (terms, callback) {
        console.log(terms);
        this._currentSearch++;
        var termsData = parseTerms(this, terms);

        var isSubset = this.isSubsetFilter(terms, this._previousTerms);

        for (var i = this._providers.length - 1; i >= 0; i--) {
            var provider = this._providers[i];
            var providerCallback = this.onSearchResults.bind(this, terms,
                this._currentSearch, callback, provider);
            if (isSubset) {
                var _previousResults = this._previousResults;
                provider.getSubsearchResultSet(_previousResults, termsData, providerCallback);
            }
            else {
                provider.getInitialResultSet(termsData, providerCallback);
            }
        }
    };


    // Function result fetch callback.
    //
    // terms - a String request.
    // searchId - searchId number.
    // callback - a function passed as a callback to the search method.
    // provider - an instance of provider result from.
    // results - an array of search results.
    p.onSearchResults = function (terms, searchId, callback, provider, results) {
        if (searchId !== this._currentSearch) {
            return;
        }
        this._previousResults = results;
        this._previousTerms = terms;
        if (typeof callback === 'function') {
            callback(results, provider);
        }
        if (this._render) {
            this._render.updateResult(provider, results);
        }
    };

    // clean the ibecjt state.
    p.clean = function (callback) {
        this._previousTerms = '';
        this._previousResults = [];
    };

    return Engine;
});