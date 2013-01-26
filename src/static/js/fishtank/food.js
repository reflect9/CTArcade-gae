// FOOD
function Food(I) {
	
	copyVariables(I,this);	// copy all the variables defined in I : input argument
	if(this.size==undefined) I.size=5;
	if(this.x==undefined) I.x = Math.floor(Math.random() * CANVAS_WIDTH);
	if(this.y==undefined) I.y = Math.floor(Math.random() * CANVAS_WIDTH);
	this.color = "#ffbb00"
}

//Food.prototype.features = ['size','x','y'];
//Food.prototype.getFeatures = function() {
//	return {
//		'position':{'x':this.x,'y':this.y},
//		'size':this.size,
//		'x':this.x,
//		'y':this.y
//	}
//}

Food.prototype.class = ['object'];

Food.prototype.consume = function() {
	this.size -= 1;
}
Food.prototype.update = function() {
	this.active = this.size > 0;
}

Food.prototype.getLocation = function() {
	return {x:this.x, y:this.y};
}
Food.prototype.getDirection = function(target) {
	var xDist = target.x-this.x;
	var yDist = target.y-this.y;		
	return {xDist:xDist, yDist:yDist, distance:Math.sqrt(xDist*xDist + yDist*yDist), angle:Math.atan2(yDist,xDist)}; 	// angle 0~1~0~-1
}