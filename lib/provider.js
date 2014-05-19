(function (mod) {
    'use strict';
    if (typeof exports === 'object' && typeof module === 'object') { // CommonJS
        module.exports = mod(require('./engine'));
    }
    else if (typeof define === 'function' && define.amd) { // AMD
        define(['./engine'], mod);
    }
    else { // Plain browser env
        mod();
    }
})(function (engine) {
    'use strict';
    var Provider = function (filters) {
        this._filters = filters;
        this._tokenCache = null;
    };

    var p = Provider.prototype;

    // Main search function.
    // if getRemoteResult if specified, will do a request to it, function should returns to callback
    // filtered results
    // if remote results not specified, localSearch will be called, that function will perform a
    // filter on results after getRemoteResults.
    //
    // self - an instance of provider class.
    // terms - an object with search terms.
    // callback a function results callback.
    //
    function doSearch(self, terms, callback) {
        if (typeof self.getRemoteResults === 'function') {
            self.getRemoteResults(terms, callback);
        } else {
            self.localSearch(terms, callback);
        }
    }

    // Preforms local search.
    //
    // terms - an object for search.
    // callback - results callback function.
    p.localSearch = function (terms, callback) {
        if (typeof this.getLocalResults === 'function') {
            var self = this;
            this.getLocalResults(terms, function (data) {
                self.filterResults(terms, data, callback);
            });
        } else {
            callback([]);
        }
    };

    // get Initial search results
    //
    // terms - an object with search terms
    // callback a function results callback
    p.getInitialResultSet = function (terms, callback) {
        doSearch(this, terms, callback);
    };


    // subsearch
    //
    // prevResults - previous search results.
    // terms - an obejct with terms for a search.
    // callback - a function results callback.
    p.getSubsearchResultSet = function (prevResults, terms, callback) {
        this.filterResults(terms, prevResults, callback);
    };

    // Preform "strong" property match search.
    //
    // terms -an map property: term search.
    // results an array if input data.
    //
    // Return filtered results.
    p.strongSearch = function (terms, results) {
        var output = results.slice(0);
        if (Object.keys(terms).length === 0) {
            return output;
        }
        for (var f = 0; f < this._filters.length; f++) { // loop filters
            var filter = this._filters[f];
            for (var i = output.length - 1; i >= 0; i--) { // loop output
                var item = output[i];
                var match = filter.checkTokenItem(terms, item);
                if (!match) {
                    output.splice(i, 1);
                }
                if (output.length === 0) {
                    return [];
                }
            }
        }
        return output;
    };


    // Preform "soft" any property match
    //
    // terms - an array for filter keywords.
    // results - an array if input object to filter.
    //
    // Return filterd array.
    p.softSearch = function (terms, results) {
        var output = [];
        if (terms.length === 0) {
            return results.slice(0);
        }
        for (var f = 0; f < this._filters.length; f++) { // loop filters
            var filter = this._filters[f];
            for (var i = results.length - 1; i >= 0; i--) { // loop results
                var item = results[i];
                var match = filter.checkMatchItem(terms, item);
                if (match) {
                    output.push(results[i]);
                    results.splice(i, 1);
                }
                if (results.length === 0) {
                    break;
                }
            }
        }
        return output.reverse();
    };

    // Filter input data
    //
    // terms - an object a search terms
    // results - an array, input array to filter.
    // callback - a function, results callback.
    p.filterResults = function (terms, results, callback) {
        var items = this.strongSearch(terms.strong, results);
        items = this.softSearch(terms.soft, items);
        callback(items);
    };

    // add filter to the provider.
    //
    // filter - an object, instance of filter class
    p.addFilter = function (filter) {
        this._tokenCache = null;
        this._filters.push(filter);
    };

    // removes filter from provider.
    //
    // filter - an instance of filter class.
    p.removeFilter = function (filter) {
        this._tokenCache = null;
        this._filters.push(filter);
    };

    // returns all filters for a providers
    p.getFilters = function () {
        return this._filters;
    };


    function collectSearchTokens(self) {
        var filters = self.getFilters();
        var result = {};
        for (var i = 0; i < filters.length; i++) {
            var tokens = filters[i].getSearchTokens();
            for (var key in tokens) {
                if (tokens.hasOwnProperty(key)) {
                    result[key] = tokens[key];
                }
            }
        }
        return result;
    }

    // return all search tokens for a provider
    //
    // return map {token: description}
    p.getSearchTokens = function () {
        if (this._tokenCache) {
            return this._tokenCache;
        }
        return this._tokenCache = collectSearchTokens.call(null, this);
    };

    engine.BaseProvider = Provider;
    return Provider;
});