/* input I has title, key, precondition, operation
 	precondition is a boolean function that returns true/false. true will execute the rule
	operation is another function object that accepts signal and returns a new state of agent 
*/	

var Rule = function(I) {
	// I.title
	// I.key
	// I.precondition
	// I.operation
	I.run = function(t) {
		if (I.precondition.call(t)) {
			return I.operation.call(t);
		} else return false;
	}
	return I;
}

var presetRule = {};
presetRule.randomExploration =  new Rule({
		title : 'Random Exploration',
		key : 'Random Exploration',
		precondition : function(agent) {
			if(agent.currentTask.type=='idle') return true;	// activated when there's no task assigned for the agent
		},
		operation : function(agent) {
			var random = {x:Math.floor(Math.random()*CANVAS_WIDTH), y:Math.floor(Math.random()*CANVAS_WIDTH)};
			var moveTask = new Task({
				type:'move',
				operation: presetTask.moveToDestination
			});
			return moveTask;
		}
});

///////////////////  TASK FROM HERE

var Task = function(I) {
	// I.type = {'idle','move','...}
	// I.operation is function 
	// I.duration is boolean predicate based on parameters within this
	return I;
}

var presetTask = {};
presetTask.moveToDestination = new Task({
	type:'move',
	operation: function() {
		var newAgentProperties = {};
		var xDist = this.currentTask.xDestination-this.getLocation().x;
		var yDist = this.currentTask.yDestination-this.getLocation().y;
		newAgentProperties.xVelocity = xDist/100;
		newAgentProperties.yVelocity = yDist/100;
		if (newAgentProperties.xVelocity<-5) newAgentProperties.xVelocity=-5;
		if (newAgentProperties.xVelocity>5) newAgentProperties.xVelocity=5;
		if (newAgentProperties.yVelocity<-5) newAgentProperties.yVelocity=-5;
		if (newAgentProperties.yVelocity>5) newAgentProperties.yVelocity=5;
		
		return newAgentProperties;
	},
	isDone: function() {
		
	}
});
presetTask.idle = new Task({
	type:'idle',
	operation: function() {return null;},
	isDone: function() {return false;}
});

