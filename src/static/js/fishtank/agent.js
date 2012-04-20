// Agent, Rule and Task

function Agent(I) {
	copyVariables(I,this);	// copy all the variables defined in I : input argument
	// predefined properties
	this.velocity = {x:0, y:0};
	this.size = 5;
	this.angle = 0;	// angle 0~2 pi
	this.sight = {range:20, angle:20};
	this.color = "#000000";
	this.active = true;

	// internal states that will change
	//I.rules = [];		// like tictactoe, an agent has an ordered list of rules 	
	this.health = 100;		
	this.stamina = 100;
	this.message = "";		// message is pheromone.  
	this.currentTask = presetTask("idle");
}

//// defines object properties that can be used as precondition/logic features 
//Agent.prototype.features = {'velocity':{'x':'@','y':'@'},
//				'x':'@','y':'@',
//				'size':{'width':'@','height':'@'},
//				'sight':{'range':'@','angle':'@'},
//				'health':'@',
//				'stamina':'@',
//				'message':'@'
//				};
//
//Agent.prototype.getFeatures = function() {
//	return {
//		'position':{'x':this.x,'y':this.y},
//		'velocity':this.velocity,
//		'size':this.size.width,
//		'health':this.health
//	}
//}

Agent.prototype.class = ['object'];

// external status
Agent.prototype.sense = function(s) {
	// using sight information and current global this, it returns the signal within agent's sight
	return s;
}
//I.inBounds = function() {
//	return this.x >= 0 && this.x <= CANVAS_WIDTH && this.y >= 0 && this.y <= CANVAS_HEIGHT;
//};
Agent.prototype.resetTask = function() {
	this.currentTask = presetTask("idle");
}
Agent.prototype.reproduce = function() {  	
	// create multiple small agents
	// decrease health point
}
Agent.prototype.update = function() {
	// apply rules to change internal status
	var context = this.sense(model);	// context : all the external information filtered by agent's sense
	for (rI in this.rules) {
		var args = [];
		var rule = this.rules[rI];
		var result;
		if (rule.precondition.call(this)) {
			result = rule.getNewTask.call(this);
			if (result!=false) {
				if(result==undefined) {
					alert("oops");
				}
				this.currentTask=result;
				break;
			}
		} 
		
	}
	// apply currentTask to do action
	var newObjectProperty = this.currentTask.operation.call(this);
	copyVariables(newObjectProperty,this); 
	if (this.currentTask.isDone.call(this)==true) this.resetTask();
	// basic update of internal status
	this.x += this.velocity.x;
	this.y += this.velocity.y;
	if(this.stamina > 0) this.stamina -= 1; else this.stamina = 0;
	if (this.stamina<1) this.health -= 1;
};

// BASIC MOVEMENTS
Agent.prototype.getLocation = function() {
	return {x:this.x, y:this.y};
}
Agent.prototype.getDirection = function(target) {
	var xDist = target.x-this.x;
	var yDist = target.y-this.y;		
	return {xDist:xDist, yDist:yDist, distance:Math.sqrt(xDist*xDist + yDist*yDist), angle:Math.atan2(yDist,xDist)}; 	// angle 0~1~0~-1
}
Agent.prototype.getVelocityFromAngleAndDistance = function(angle,speed) {
	return {x:Math.cos(angle)*speed, y:Math.sin(angle)*speed};
}
