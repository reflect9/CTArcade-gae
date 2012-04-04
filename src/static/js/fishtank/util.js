function copyVariables(src, tar) {
	$.each(src, function(key, value) {
		tar[key] = value;
	});
}
Function.prototype.bind = function(scope) {
	var _function = this;
	return function() {
		return _function.apply(scope, arguments);
	}
}