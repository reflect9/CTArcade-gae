var game=null; 	// trainer object created from TicTacToeTrainer.js
var cons=null;	// console object from Console.js
var needReset = false;   
var playbackMode = false; // True when user's viewing previous moves, 
								// user can either resume game there or teach AI what it could've done.

function updateBoard(board) {  // update current board presentation
	// turnPlayer(game.turn);
	for(var x=0;x<game.width;x++) {
		for(var y=0;y<game.height;y++) {
			$("#t"+x+""+y).removeClass('tile_p1');
			$("#t"+x+""+y).removeClass('tile_p2');
			if(board[x][y]==game.p1)
				$("#t"+x+""+y).addClass('tile_p1');
			else if(board[x][y]==game.p2)
				$("#t"+x+""+y).addClass('tile_p2');
		}
	}
}

// called after user/AI move to prevent keep on playing
function checkWinner() {
	// winning event
	var winner = game.checkForWinner();
	if (winner) {
//		$("#status").text(winner + " wins!");
//		$("#status").css('background-color', 'yellow');
		if(winner==game.p1) cons.appendHTML("<div style='font-size:17px; margin:10px;'>"+game.p1 + " wins!</div>");
		else cons.appendHTML("<div style='font-size:17px; margin:10px;'>"+game.p2 + " wins!</div>");
		needReset = true;
	} else {
//		$("#status").text(game.turn + " to play");
	}
}	
// it uses AI's current strategy set 
// to find the best move
function computerMove(response) {
	if(needReset) {
		cons.appendMessage('Game already finished. Press new game button to start again.');
		return;
	}
	$("#sortable").each( function() {
		$(this).attr('id','');	// when there's an existing list of rules already, delete their id to prevent conflicts with new list.
	});
	var html = "<div>For my last move I tried all my strategies,</div><ul id='sortable'>";
	var responseDict = JSON.parse(response);
	game.strategy = responseDict.userRules;
	var bestRuleFound = responseDict.rule;
	showUserAI(game.strategy,"userInfo");
	for(i in game.strategy) {
		html = html+"<li class='ui-state-default'><div style='margin:10px 0 0 10px; ' id='ai_"+game.strategy[i].key+"' class='ai_"+ game.strategy[i].key +" rule_inactive rule'>"+ game.strategy[i].title +"</div></li>";
	}
	html = html+"</ul>";
	cons.appendHTML(html);
	for(i in game.strategy) {
		stKey = game.strategy[i].key;
		if (bestRuleFound!=undefined && bestRuleFound.key==stKey) {	// for the best strategy, color it in red
			console.log("found it!"+game.strategy[i].title);
			var currentMove = cons.getLast(); 
			$(".ai_"+stKey).removeClass('rule_inactive');
			$(".ai_"+stKey).removeClass('rule_unapplicable');
			$(".ai_"+stKey).addClass('rule_selected');
			$(".ai_"+stKey).append("<span style='color:gray; font-size:13px;'> was the first applicable rule.</span>");
			break;
		} else {   // for non-feasible (but top-priority) strategies
			var currentMove = cons.getLast(); 
			console.log("cannot find it!"+ game.strategy[i].title);  
			$(".ai_"+stKey).removeClass('rule_inactive');
			$(".ai_"+stKey).addClass('rule_unapplicable');
			$(".ai_"+stKey).removeClass('rule_selected');
			$(".ai_"+stKey).append("<span style='color:gray; font-size:13px;'> was not applicable.</span>");
		}
	}
	$("#sortable").sortable({
		update : function(event, ui) {
			changeOrder();
		}
	});
	$("#sortable").disableSelection();
	if (responseDict.message=="Tie Game") {
//		$("#status").text(strategy.message);
		html = "<div style='line-height:2em;'>Tie game! Click 'new game' button to start over.</div>"
		cons.appendHTML(html);
	} else if (responseDict.message=="no strategy found") {
//		$("#status").text(strategy.message);
		html = "<div style='line-height:2em;'>No strategy seems to match the situation.</div>"
		cons.appendHTML(html);
	} else {
		$("#rule").text(responseDict.message);
		html = "<div style='line-height:1.2em;margin-top:10px;'>Your turn now. Click an empty cell to continue.</div>"
		cons.appendHTML(html);
		// now it selects one from all the moves of the best strategy
		selectedLoc = responseDict.locList[Math.floor(Math.random()*responseDict.locList.length)]; // randomly select one location from list
		game.move(selectedLoc[0], selectedLoc[1], game.turn); // update board ds with current game.turn and return new value of the cell
		$("#currentStep").text(game.history.length-1);
		updateBoard(game.board);
		checkWinner(); 
	}
}

function history(direction) {
	var currentStep = parseInt($("#currentStep").text());
	if (direction=='next') currentStep += 1;
	else currentStep -= 1;
	if (currentStep>=game.history.length-1) {
		historyMode('off');
		tempBoard = game.history[game.history.length-1];
		updateBoard(tempBoard['board']);
		currentStep = game.history.length-1;
		$("#currentStep").text(currentStep);
		return;
	} else if(currentStep<=-1) {
		currentStep=0;
		return;
	} else {
		historyMode('on');
		tempBoard = game.history[currentStep];	
		updateBoard(tempBoard['board']);
		$("#currentStep").text(currentStep);
		cons.clear();
		cons.appendHTML("<span style='color:#2222ee; font-size:20px;'>History Mode</div>");
		if (tempBoard['turn']==game.p2) {
			cons.appendHTML("<div>It was your turn. Do you want to start again from this point?</div><div class='button_round' onclick='resumeGame("+currentStep+");' style='width:200px; text-align:center; background-color:#aaa; font-size:17px; margin:10px auto;'>Resume Game Here</div></div>");
		} else {
			cons.appendHTML("<div>It was my turn. You can teach me what I could have done at this point. <br>To do that, click an empty cell and tell me why you think it is important.</div>");
			$(".tile").click( function() {
				teachAI(tempBoard['board'],tempBoard['turn'],$(this).attr('id'));
			});
		}
		
	}
}

function teachAI(board,turn,loc) {   // this teaching method is being used in history mode only. 
	var x = loc[1];
	var y = loc[2];
	flippedTurn = (turn == game.p1) ? game.p2 : game.p1;
	game.findMatchingStrategy(board,flippedTurn,[x,y],showTeachingStrategy);
}
function resumeGame(currentStep) {	// history mode -> play mode
	game.resumeFromHistoryMode(currentStep);
	historyMode('off');
	$(".tile").click( function() {
		callUserMove($(this).attr('id'));
	});
}

function showTeachingStrategy(response) {   // teaching method in history mode
	matchingRules = JSON.parse(response);
	cons.appendHTML("<div>Which rule below does match with your choice?</div>");
	$(matchingRules).each( function(i,rule) {
		$('<div></div>',{
			id : 'mR_'+rule['code'],
			style : 'margin: 7px 5px 7px 25px; font-size:1.3em; cursor:pointer;'
		})	.text(rule['name'])
			.click(function() { game.enableStrategy(game.user,rule['code']);})
			.appendTo($(cons.target));
	});
//	$('<div></div>',{
//		id : 'mR_createYourOwn',
//		class : 'mR',
//		style : 'margin: 7px 5px 7px 25px; font-size:1.3em; cursor:pointer;'
//	})	.text("Create Your Own")
//		.click(function() {startGuidedCreationInterface(tempBoard['board']);})
//		.appendTo($(cons.target));
}
function historyMode(flag) {
	if(flag=='on') {
		$(".tile").unbind();
		$('.tile').css('background-color','#ddd');
//		$('#status').text('History mode')
//						.css('background-color','#0055ff');
	} 
	if(flag=='off') {
		$(".tile").unbind();
		$(".tile").click( function() {
			callUserMove($(this).attr('id'));
		});
		$('.tile').css('background-color','#fff');
//		$('#status').text(currentTurn + " 's turn")
//						.css('background-color','#fff');
		cons.appendMessage("It's your turn. Click an empty cell to take.");			
	}
	
}
function changeOrder() {
	nameList = [];
	$('#sortable li').each(function(i,e) {
		// extract the strategy code and push into new list
		var c = $(e).clone();
		code = $(c).find('div').attr('id').replace('ai_','');
		nameList.push(code);
	});
	game.changeOrder(nameList);
}
function clearBoard() {
	needReset=false;
//	$("#status").css('color','black');
	$("#bigButton").hide();
	historyMode('off');
	game.restart();  // reset game.board, game.turn 
	$("#currentStep").text(game.history.length-1);
//	$("#status").css('background-color', 'white');
	$("#rule").text("");
	cons.clear();
	cons.appendMessage("It's your turn. Click an empty cell for next move.");
	for (var i = 0; i < 3; i++) {
		for (var j =0; j<3;j++) {
			$("#t"+i+""+j).removeClass('tile_p1');
			$("#t"+i+""+j).removeClass('tile_p2');
		}
	}
	if (game.turn==game.p2) {
		game.findBestStrategy(game.board,game.turn,computerMove);
	}
	
}	
function showUserAI(userAI,targetDIV) {
//	alert("showUSERAI");
	if (typeof targetDIV=='string' && targetDIV[0]!='#') var t = "#"+targetDIV;
	else var t = targetDIV;
	$(t).empty();
	//  show the player's strategy
	$(t).append("<h2 style='float:left; margin:-10px 5px 5px 5px; color:#eee;'>"+p1+"'s AI</h2>");
//	$(t).append("<div id='instruction_reorder' style='float:left; margin: 8px 10px 0px 30px;'><span class='icon_downArrow'>&nbsp;</span>Drag rules to Re-order</div>");
	var aiDIV = $(t).append("<DIV id='p1_ai_div' class='clearfix' style='clear:both; position:relative; float:left; width:100%;'><ul id='p1_ai' style='list-style-type:none;padding-left:0px;margin:0px;'></ul><div style='clear:both;'></div></DIV>");
	$.each(userAI, function(i,rule) {
		$(aiDIV).find("#p1_ai").append("<li class='ai_item' key='"+rule.key+"'>"+rule.title+"<div class='icon_order'></div></li>");
	});
	$("#p1_ai").sortable({	// update user's strategy after changing order. 
		update : function(event, ui) {
			var keyList = [];
			$("#p1_ai li").each(function(i,e) {
				var key = $(e).attr('key');
				keyList.push(key);
			});
	    	$.ajax({
	    		type : "GET",
	    		url: "/ajaxTrainer",
	    		async: true,
	    		data: 	{ 	action: 'changeOrder',
	    					player: game.p1,
	    					game: 'tictactoe',
	    					newStrategy : JSON.stringify(keyList)
	    				},
	    		success: function(response) {
	    			// run what after updating rule? 
	    		}
	    	});
		}
	});
	$("#p1_ai").disableSelection();
	$("#instruction_reorder").hide();
	$("#p1_ai").mouseover(function() { $("#instruction_reorder").show(); });
	$("#p1_ai").mouseout(function() { $("#instruction_reorder").hide(); });
	$("li.ai_item").click(function() {
		var detailDIV = $(t).find('.ai_detail');
		detailDIV.empty();
		var keyValue = $(this).attr('key');
		for(i in game.strategy) {
			if(game.strategy[i].key == keyValue) {
				detailDIV.append("<div><span style='font-weight:bold;'> "+game.strategy[i].title+"</span><span> "+game.strategy[i].description+"</span></div>");
				if(game.strategy[i].rule_type=="board definition") {
					var defDiv = $("<div id='ai_detail_definition'></div>");
					var defList = eval(game.strategy[i].definition);
					$.each(defList, function(iB, brd) {
						$(defDiv).append(createRuleBoard(brd));
					});
				}
				detailDIV.append(defDiv);
				var deleteButton = $("<div class='btn' style='clear:both; margin-left:15px; '> REMOVE THIS RULE </div>").click(function() { game.deleteRule(game.p1,keyValue); });
				detailDIV.append(deleteButton);
				break;
			}
		}
//		alert(keyValue);
		
	});
	$(t).append("<div id='createRuleButton' class='ai_item btn green clearfix' style='text-align:center;' onclick='javascript:startCreationInterface(game.cloneBoard(game.board));'>Add Custom Rule</div>")
	$(t).append("<div class='ai_detail' style='clear:both; float:left;'> </div>")
	$(t).append("<div style='clear:both;'></div>");

}
function setStrategy(data) {
	game.strategy = eval(data);
//	alert("setStrategy: "+data);
	game.strategyKeyList = [];
	for (i in game.strategy)
		game.strategyKeyList.push(game.strategy[i].key);
}
function createRuleBoard(board) {
	var ruleBoard = $("<div style='border:1px solid #555; margin:3px; float:left;'></div>");
	var tileSize = 15;
//	class CellType:
//	    EMPTY = 0
//	    P1 = 1
//	    P2 = 2
//	    SELECTED = 3
//	    IGNORE = 4
	tileCharacter = ['','O','X',"<span style='color:red'>O</span>","<span style='color:#999'>?</span>"];
	$.each(board, function(iCol,col) {
		var colDiv = $("<div class='clearfix;' style='float:left; width:"+tileSize+"px;'></div>");
		$.each(col, function(iRow,tile) {
			$(colDiv).append("<div style='border:1px solid #eee; font-size:10px; width:"+(tileSize-2)+"px; height:"+(tileSize-2)+"px;'>"+tileCharacter[parseInt(tile)]+"</div>");
		});
		$(ruleBoard).append(colDiv);
	});
	return ruleBoard;
}

function callUserMove(dd) {
	if (needReset) {	// when baord is full or game already ended, needReset is true
		return;
	}
	if (game.turn!=game.p1) { return; }
	var currentTurn = game.turn;
	var x = dd[1];
	var y = dd[2];
	userMove(x,y);
}

function showMatchingStrategy(response) {   
	matchingRules = JSON.parse(response);
	cons.clear();
	cons.appendMessage("Is your last move based on one of these rules?")
	$(matchingRules).each( function(i,rule) {
		var r = $('<div></div>',{
			id : 'mR_'+rule['key'],
			key : rule['key'],
			class : 'mR',
			style : 'margin: 7px 5px 7px 25px; font-size:1.3em; cursor:pointer;'
		})	.text(rule['title'])
			.click(function() { game.enableStrategy(game.user,rule['key']);
								$(".mR").unbind().css('cursor','default').css('color','#aaa');
			}).appendTo($(cons.target));
		if ($.inArray(rule['key'],game.strategyKeyList)==-1) {$(r).append("<span style='font-size:13px;' title='your AI does not know this rule.' class='icon_question'>&nbsp;</span>");} else {$(r).append("<span style='font-size:13px;' title='your AI knows this rule.' class='icon_checkSmall'>&nbsp;</span>");}
	});
//	var c = $('<div></div>',{
//		id : 'mR_createYourOwn',
//		class : 'mR',
//		style : 'margin: 7px 5px 7px 25px; font-size:1.3em; cursor:pointer;'
//	})	.text("Create Your Own")
//		.click(function() {startCreationInterface(game.cloneBoard(game.board));})
//		.appendTo($(cons.target));
	cons.appendButton("CONTINUE","$(this).hide(); game.findBestStrategy(game.board,game.turn,computerMove);");
}

function userMove(x,y) {
	game.findMatchingStrategy(game.board,game.turn,[x,y],showMatchingStrategy);
	var val = game.move(x, y, currentTurn);  // update game.board, game.turn and game.history
	$("#currentStep").text(game.history.length-1);
	updateBoard(game.board);	// update game.board on #txy.text
	checkWinner();	// check winning condition. if yes, show the winner, otherwise show next one to play
			
}


$(document).ready(function () {
	$(".header #header_button_trainer").addClass("currentMode");
	$.ajaxSetup({ cache: false });
	if (p1=='guest') return;
	game = new TicTacToeTrainer();
	game.init(p1,p2);
	showUserAI(game.strategy,"userInfo");	// using user's rule JSON object, show user's AI in userInfo div
	cons = new Console();
	cons.init("#console > .message"); // initialize console object
	currentTurn = game.turn;
	$(".tile").click( function() {
		callUserMove($(this).attr('id'));
	});
});