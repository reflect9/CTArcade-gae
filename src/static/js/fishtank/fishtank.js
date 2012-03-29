var CANVAS_WIDTH = 530, CANVAS_HEIGHT = 500;
var FRAME_RATE = 20;
var gLoop, is_running;
var model, view;
var showCurrentTasks = false;
var showSightRange = false;
//INIT PROCESS
$(function() {
	model = new Model_fishtank();
	view = new View_fishtank("canvas");
	restart();
});

// constructor of Fishtank game model
var Model_fishtank = function() {   
	this.agents = [];
	this.foods = [];
}

// view
var View_fishtank = function(canvasID) { 
	this.c = $("#"+canvasID)[0];
	this.ctx = this.c.getContext('2d');
	this.c.width = CANVAS_WIDTH;
	this.c.height = CANVAS_HEIGHT;
	this.clear = function() {
		this.ctx.fillStyle = '#d0e7f9';
		this.ctx.beginPath();
		this.ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		this.ctx.closePath();
		this.ctx.fill();
	}
	this.drawAgent = function(agent) {
		this.ctx.fillStyle = agent.color;
		this.ctx.fillRect(agent.x, agent.y, agent.size.width, agent.size.height);
		if (showCurrentTasks) {
			this.ctx.fillText(agent.currentTask.type,agent.x, agent.y+13);
		}
		if (showSightRange) {
			this.ctx.fillStyle = "rgba(0,0,0,0.15)";
			this.ctx.beginPath();
			this.ctx.arc(agent.x+(agent.size.width/2),agent.y+(agent.size.height/2),agent.sight.range,Math.PI*2,0,true);
			this.ctx.closePath();
			this.ctx.fill();
		}
	}
	this.drawFood = function(food) {
		this.ctx.fillStyle = food.color;
		this.ctx.beginPath();
		this.ctx.arc(food.x, food.y, food.size, food.size, Math.PI*2, true); 
		this.ctx.closePath();
		this.ctx.fill();
	}
}

// CONTROLLER FUNCTIONS
var restart = function() {
	for ( var i = 0; i < 5; i++) {
		model.agents.push(new Agent({
			id : 'agent'+i,
			x : 50,
			y : 50,
			rules : [PresetRule("Random Exploration"),PresetRule("Gathering Food")]
		}));
	}
	for ( var i = 0; i < 20; i++) {
		model.foods.push(new Food({
			size : 5,
			x : Math.floor(Math.random() * CANVAS_WIDTH),
			y : Math.floor(Math.random() * CANVAS_HEIGHT)
		}));
	}
	// make it run forever
	gLoop = setTimeout(gameLoop, 1000 / FRAME_RATE);
	is_running = true;
}
var control = function(mode){
	if (mode=='play') { gLoop = setTimeout(gameLoop, 1000 / FRAME_RATE);  is_running=true; }
	else if(mode=='stop') { clearTimeout(gLoop);  is_running=false; }
	else if(mode=='toggle') {
		if (is_running==true) control('stop');
		else if(is_running==false) control('play');
	}
}
var pause = function() {
	clearTimeout(gLoop);
}
// gameLoop will run every frame
var gameLoop = function() {
	console.log("gameLoop");
	update();
	view.clear();
	$.each(model.agents, function(i,agent) { view.drawAgent(agent); });
	$.each(model.foods, function(i,food) { view.drawFood(food); });
	gLoop = setTimeout(gameLoop, 1000 / 10);
}
var update = function() {
	// change position, do something this round
	model.agents.forEach(function(agent) { agent.update(); });
	model.foods.forEach(function(food) { food.update(); });
}
//
//var updateBins = function(collection) {
//	collection.forEach(function(e) {
//		var bX = Math.floor(e.x/BIN_WIDTH);
//		var bY = Math.floor(e.y/BIN_HEIGHT);
////		console.log(bX + "_"+bY);
//		if(bX<50 & bX>-1 & bY<50 & bY>-1)
//			bins[bX][bY].push(e);
//	});
//}



// CIRCLE BG
//var howManyCircles = 10, circles = [];
//for ( var i = 0; i < howManyCircles; i++)
//	circles.push([ Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT,
//			Math.random() * 100, Math.random() / 2 ]);
//var DrawCircles = function() {
//	for ( var i = 0; i < howManyCircles; i++) {
//		ctx.fillStyle = 'rgba(255, 255, 255, ' + circles[i][3] + ')';
//		// white color with transparency in rgba
//		ctx.beginPath();
//		ctx.arc(circles[i][0], circles[i][1], circles[i][2], 0, Math.PI * 2,
//				true);
//		// arc(x, y, radius, startAngle, endAngle, anticlockwise)
//		// circle has always PI*2 end angle
//		ctx.closePath();
//		ctx.fill();
//	}
//};
//var MoveCircles = function(deltaY) {
//	for ( var i = 0; i < howManyCircles; i++) {
//		if (circles[i][1] - circles[i][2] > CANVAS_HEIGHT) {
//			// the circle is under the screen so we change
//			// informations about it
//			circles[i][0] = Math.random() * CANVAS_WIDTH;
//			circles[i][2] = Math.random() * 100;
//			circles[i][1] = 0 - circles[i][2];
//			circles[i][3] = Math.random() / 2;
//		} else {
//			// move circle deltaY pixels down
//			circles[i][1] += deltaY;
//		}
//	}
//};
// END OF CIRCLE BG
