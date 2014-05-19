(function (mod) {
    'use strict';
    if (typeof exports === 'object' && typeof module === 'object') {// CommonJS
        module.exports = mod(require('./engine'));
    }
    else if (typeof define === 'function' && define.amd) {// AMD
        define(['./engine'], mod);
    }
    else {// Plain browser env
        mod();
    }
})(function (engine) {
    'use strict';
    var Filter = function () {

    };

    var p = Filter.prototype;

    function capitalize(key) {
        return key.replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
    }

    // Check item to match on string filters
    //
    // tokens - an object of tokins in a search request.
    // item - an object to check.
    //
    // returns true if match found, false if not.
    p.checkTokenItem = function (tokens, item) {
        var validTokens = this.getSearchTokens();
        for (var key in tokens) {
            if (tokens.hasOwnProperty(key) && validTokens[key] !== undefined) {
                var res = this.checkMatch(tokens[key], item, key);
                if (!res) {
                    return false;
                }
            }
        }
        return true;
    };


    // Returns an array of search properties for soft matches.
    p.getSearchProps = function () {
        return [];
    };

    // Returns a hash of property to check to description.
    p.getSearchTokens = function () {
        return {};
    };


    // Check soft match.
    //
    // tokens - array of values to check.
    // item - an object to check.
    //
    // Returns true if any property match on one of the tokens.
    p.checkMatchItem = function (tokens, item) {
        var searchProps = this.getSearchProps();
        for (var t = tokens.length - 1; t >= 0; t--) {
            var token = tokens[t].toLowerCase();
            var tokenMatch = false;
            for (var i = searchProps.length - 1; i >= 0; i--) {
                var property = searchProps[i];
                var match = this.checkMatch(token, item, property);
                if (match) {
                    tokenMatch = true;
                    break;
                }
            }
            if (!tokenMatch) {
                return false;
            }
        }
        return true;
    };

    // Check exact property match. Match is case insensitive.
    // Function performs search for 'do' + capitalized property method
    // if method fount it will be called to perform check. Allow to do custom comparisons.
    // if property is a function, it will be called to get a value without arguments.
    //
    // token - a string token to check.
    // item - an object to check.
    // property - a property to validate.
    //
    // Return true if match found.
    p.checkMatch = function (token, item, property) {
        var value = token.toLowerCase();
        var keyCap = capitalize(property);
        if (typeof this['do' + keyCap] === 'function') { // user defined check
            return this['do' + keyCap](value, item);
        } else {
            if (typeof item[property] === 'string') { // process property check
                return this.compare(value, item[property].toLowerCase());
            } else if (typeof item[property] === 'function') { // process function check
                return this.compare(value, item[property]().toLowerCase());
            }
        }
        return false;
    };

    // compare function, returns true if match found
    //
    // term - a string looking for
    // string - an stings looking in.
    //
    // returns true if match found.
    p.compare = function (term, string) {
        // default plain match
        return string.indexOf(term) !== -1;
    };

    engine.BaseFilter = Filter;

    return Filter;
});