// FOOD
function Food(I) {
	copyVariables(I,this);	// copy all the variables defined in I : input argument
	if(this.size==undefined) I.size=5;
	if(this.x==undefined) I.x = Math.floor(Math.random() * CANVAS_WIDTH);
	if(this.y==undefined) I.y = Math.floor(Math.random() * CANVAS_WIDTH);
	this.color = "#ffbb00"
}



Food.prototype.consume = function() {
	this.size -= 1;
}
Food.prototype.update = function() {
	this.active = this.size > 0;
}