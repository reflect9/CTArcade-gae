// FOOD
function Food(I) {
	if(I.size==undefined) I.size=5;
	if(I.x==undefined) I.x = Math.floor(Math.random() * CANVAS_WIDTH);
	if(I.y==undefined) I.y = Math.floor(Math.random() * CANVAS_WIDTH);
	
	I.appearance.color = "#ffbb00"
	I.consume = function() {
		I.size -= 1;
	}
	I.update = function() {
		I.active = I.size > 0;
	}
	return I;
}



