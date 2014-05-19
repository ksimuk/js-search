
function inherit(child, parent) {
    function F() {}
    F.prototype = parent && parent.prototype;

    child.prototype = new F();
    child._sc = parent.prototype;
    child._sc.constructor = parent;
}