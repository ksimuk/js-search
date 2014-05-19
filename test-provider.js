(function(){

    var TestProvider = function() {

        SearchEngine.SearchProvider.apply(this, argumets);
    };

    inherit(TestProvider, SearchEngine.SearchProvider);

    var p  = TestProvider.prototype;

    p.getInitialResultSet = function(terms, callback) {
        callback();
    };

    p.getSubsearchResultSet = function(prevResults, terms, callback) {

    };



})();