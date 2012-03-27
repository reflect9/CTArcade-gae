var CANVAS_WIDTH = 500, CANVAS_HEIGHT = 500;
var FRAME_RATE = 10;
var game, viewer;
//INIT PROCESS
$(function() {
	model = new Model_fishtank();
	view = new View_fishtank("canvas");
	restart();
});

// constructor of Fishtank game model
var Model_fishtank = function() {   
	var agents = [];
	var foods = [];
}

// view
var View_fishtank = function(canvasID) { 
	this.c = $("#"+canvasID)[0];
	this.ctx = this.c.getContext('2d');
	this.c.width = CANVAS_WIDTH;
	this.c.height = CANVAS_HEIGHT;
	
	this.clear = function() {
		ctx.fillStyle = '#d0e7f9';
		ctx.beginPath();
		ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		ctx.closePath();
		ctx.fill();
	}
	this.drawAgent = function(agent) {
		ctx.fillStyle = agent.appearance.color;
		ctx.fillRect(agent.x, agent.y, agent.size.width, agent.size.height);
	}
	this.drawFood = function(food) {
		ctx.fillStyle = food.appearance.color;
		ctx.beginPath();
		ctx.arc(food.x, food.y, food.size, food.size, Math.PI*2, true); 
		ctx.closePath();
		ctx.fill();
	}
}

// CONTROLLER FUNCTIONS
var restart = function() {
	for ( var i = 0; i < 5; i++) {
		model.agents.push(new Agent({
			x : Math.floor(Math.random() * CANVAS_WIDTH),
			y : Math.floor(Math.random() * CANVAS_HEIGHT),
			rules : [presetRule.randomExploration]
		}));
	}
	for ( var i = 0; i < 50; i++) {
		model.foods.push(new Food({
			size : 5,
			x : Math.floor(Math.random() * CANVAS_WIDTH),
			y : Math.floor(Math.random() * CANVAS_HEIGHT)
		}));
	}
	// make it run forever
	gLoop = setTimeout(gameLoop, 1000 / FRAME_RATE);
}
// gameLoop will run every frame
var gameLoop = function() {
	console.log("gameLoop");
	view.update();
	view.clear();
	$.each(model.agents, function(agent) { view.drawAgent(agent); });
	$.each(model.foods, function(food) { view.drawFood(food); });
	gLoop = setTimeout(gameLoop, 1000 / 10);
}
var update = function() {
	// change position, do something this round
	agents.forEach(function(agent) { agent.update(); });
	foods.forEach(function(food) { food.update(); });
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
