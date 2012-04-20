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
function recursiveSearch(target, key, value) {
	// recursively search an object having the key variable with specific value
	// within the target
	try {
		var variableNamesInTheTarget = Object.keys(target);
		if ($.inArray(value, target[key]) != -1) { // if the target matches is
													// what we're looking for
			console.log('found object');
			return [ target ];
		} else {
			var objFound = [];
			for (childKeyID in variableNamesInTheTarget) {
				var childKey = variableNamesInTheTarget[childKeyID];
				var child = target[childKey];
				var objFoundFromChild = recursiveSearch(child, key, value);
				if (objFoundFromChild != undefined)
					objFound = objFound.concat(objFoundFromChild);
			}
			return objFound;
		}
	} catch (err) {
		// console.log(err);
		return undefined;
	}
}


