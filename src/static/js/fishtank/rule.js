
/* input I has title, key, precondition, operation
	precondition is a boolean function that returns true/false. true will execute the rule
operation is another function object that accepts signal and returns a new state of agent 
*/	

var Rule = function(I) {
// title, key, precondition, operation
	copyVariables(I,this);
}
//Rule.prototype.run = function() {
//	if (this.precondition.call()) {
//		return {currentTask:this.getNewTask()};
//	} 
//	else return false;
//}

//var presetRule = {};
var PresetRule = function(templateCode) {
	if (templateCode=='Random Exploration') {
		var rule = new Rule({
			title : 'Random Exploration',
			key : 'Random Exploration',
			precondition : function() {	// this : Agent,  
				if(this.currentTask.type=='idle') return true;	// activated when there's no task assigned for the agent
			},
			getNewTask : function() {
				var newTask = presetTask.call(this,"moveToDestination");  // 'this' is bound to agent
				newTask.xDestination = Math.floor(Math.random()*CANVAS_WIDTH)
				newTask.yDestination = Math.floor(Math.random()*CANVAS_WIDTH);
//				console.log("["+this.id+"] "+newTask.xDestination);
				return newTask;
			}
		});
		return rule;
	} else if (templateCode=='Gathering Food') {
		var rule = new Rule({
			title : 'Gathering Food',
			key : 'Gathering Food',
			precondition : function() {	// this : Agent,  
				if(this.currentTask.type=='move') {
					var foodFound = false;
					for(var fid=0;fid<model.foods.length;fid++) {
						var food = model.foods[fid];
						var direction = this.getDirection(food);
						if (direction.distance<this.sight.range) { 
							foodFound = true;
							return false;	// break the loop because food is found
						}
					}	
					return foodFound;
				}
				return false;
			},
			getNewTask : function() {
				var newTask = presetTask("moveToDestination").bind(this);
				var foodLocation = null;
				for (var fid=0;fid<model.foods.length;fid++) {
					var food = model.foods[fid];
					var direction = this.getDirection(food);
					if (direction.distance<this.sight.range) {
						foodLocation = {x:food.x, y:food.y};
						return false;
					}
				}
				newTask.xDestination = foodLocation.x;
				newTask.yDestination = foodLocation.y;
//				console.log("["+this.id+"] "+newTask.xDestination);
				return newTask;
			}
		});
		return rule;
	}else if (templateCode=='other') {
		// return another rule
	}
} 





///////////////////  TASK FROM HERE

var Task = function(I) {
// I.type = {'idle','move','...}
// I.operation is function 
// I.duration is boolean predicate based on parameters within this
return I;
}

var presetTask = {};
var presetTask = function(template) {
	if (template=="moveToDestination") {
		var newTask = new Task({
			type:'move',
			id: Number(new Date()),
			owner: this 	// owner contains the task
		});	
		newTask.operation = function() {
			var newAgentProperties = {velocity:{}};
			var target = {x:this.currentTask.xDestination, y:this.currentTask.yDestination};
			var direction = this.getDirection(target);
			var velocity = this.getVelocityFromAngleAndDistance(direction.angle,5);
			newAgentProperties.velocity.x = (this.velocity.x*3+velocity.x)/4;
			newAgentProperties.velocity.y = (this.velocity.y*3+velocity.y)/4;
			return newAgentProperties;
		};
		newTask.isDone = function() {		
			var xDist = this.currentTask.xDestination-this.getLocation().x;
			var yDist = this.currentTask.yDestination-this.getLocation().y;
			if (xDist<30 & yDist<30) return true;
			else return false;
		};
		return newTask;
	}
	if (template =="idle") {
		var newTask = new Task({
			type:'idle',
			operation: function() {return null;},
			isDone: function() {return false;}
		});
		return newTask;
	}
};
