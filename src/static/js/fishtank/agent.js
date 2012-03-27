var Agent = function(I) {
	// predefined properties
	I.velocity = {x:0, y:0};
	I.size = {width:2, height:2};
	I.sight = {range:10, angle:20};
	I.appearance = {color:"#000000"};
	I.active = true;

	// internal states that will change
	//I.rules = [];		// like tictactoe, an agent has an ordered list of rules 	
	I.health = 100;		
	I.stamina = 100;
	I.message = "";		// message is pheromone.  
	I.currentTask = presetTask.idle;
	// external status
	I.sense = function(s) {
		// using sight information and current global this, it returns the signal within agent's sight
	}
	
	I.inBounds = function() {
		return this.x >= 0 && this.x <= CANVAS_WIDTH && this.y >= 0 && this.y <= CANVAS_HEIGHT;
	};
	I.changeStatus = function(newStatus) {	
		for (key in newStatus) {
			this[key] = newStatus[key];
		}	
	}
	I.resetTask = function() {
		this.currentTask = presetTask.idle;
	}
	I.reproduce = function() {  	
		// create multiple small agents
		// decrease health point
	}
	I.update = function() {
		// apply rules to change internal status
		var context = this.sense(game);	// context : all the external information filtered by agent's sense
		for (rI in this.rules) {
			var args = [];
			var rule = this.rules[rI];
			var result = rule.run(context);
			if (result!=false) {
				this.changeStatus(result);
				break;
			}
		}
		// apply currentTask to do action
		this.changeStatus(this.currentTask.operation()); 
		if (this.currentTask.isDone()==true) this.resetTask();
		// basic update of internal status
		this.x += this.velocity.x;
		this.y += this.velocity.y;
		if(this.stamina > 0) this.stamina -= 1; else this.stamina = 0;
		if (this.stamina<1) this.health -= 1;
	};
	
	// BASIC MOVEMENTS
	I.getLocation = function() {
		return $(this).position();
	}
	I.getDirection = function(target) {
		var xDist = $(this).offset().left - $(target).offset().left;
		var yDist = $(this).offset().top - $(target).offset().top;
		return {xDist:xDist, yDist:yDist, distance:Math.sqrt(xDist*xDist + yDist*yDist), angle:(Math.atan2(yDist,xDist)/Math.PI)*180};
	}
	
	
	return I;
}