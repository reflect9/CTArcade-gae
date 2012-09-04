var game=null; 	// trainer object created from TicTacToeTrainer.js
var needReset = false;   
var alwaysContinue = false; 	// whether gamebot waits user's CONTINUE after user's move
var playbackMode = false; // True when user's viewing previous moves, 
var TYPE = {
		0 : {code:'EMPTY',value: 0, css: "create_empty", ignorecss: "consider", description:
			"<b>Empty tile</b> : the tile should be empty to apply the rule"},
		1 : {code:'P1',value: 1, css: "create_p1", ignorecss: "consider", description:
			"<b>Player</b> already occupied this tile."},
		2 : {code:'P2',value: 2, css: "create_p2", ignorecss: "consider", description:
			"<b>Opponent</b> already occupited this tile."},
		3 : {code:'SELECTED',value: 3, css: "create_selected", ignorecss: "consider", description:
			"<b>Next move</b> where the player will take.<br><span style='color:red;'>required</span>"},
		4 : {code:'IGNORE',value: 4, css: "create_ignore", ignorecss: "ignore", description:
			"<b>Ignore</b> : rule doesn't care what is on this tile."}
};						// user can either resume game there or teach AI what it could've done.

function updateBoard(board) {  // update current board presentation
	// turnPlayer(game.turn);
	for(var x=0;x<game.width;x++) {
		for(var y=0;y<game.height;y++) {
			$("#t"+x+""+y).removeClass('tile_p1');
			$("#t"+x+""+y).removeClass('tile_p2');
			//$("#t"+x+""+y).css('opacity',0.5);
			if(board[x][y]==game.p1)
				$("#t"+x+""+y).addClass('tile_p1');
			else if(board[x][y]==game.p2)
				$("#t"+x+""+y).addClass('tile_p2');
			
//			if(x==game.lastestMove[0] & y==game.lastestMove[1]) {
//				$("#t"+x+""+y).css('opacity',1.0);
//			}
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
		if(winner==game.p1) $("#console").append("<div class='alert alert-error' style='margin-top:10px'><b>"+game.p1 + "</b> wins!</div>");
		else $("#console").append("<div class='alert alert-error' style='margin-top:10px'><b>"+game.p2 + "</b> wins!</div>");
		needReset = true;
	} 
	return winner;
}	


function showMatchingStrategy(response) {   
	matchingRules = JSON.parse(response);
	$("#console").empty();
//	alert("aha");
	var userMove = $("<div id='userMoveDIV' class='well clearfix' style='padding:12px; margin-bottom:5px;'></div>").appendTo($("#console"));
	$(userMove).append("<div><b>"+p1+"</b>'s last move matches with the rules below</div>");
	$(matchingRules).each( function(i,rule) {
		var r = $('<div></div>',{
			id : 'mR_'+rule['key'],
			key : rule['key'],
			class : 'mR',
			style : 'margin: 7px 5px 7px 25px; font-size:1.3em; cursor:pointer;'
		})	.text(rule['title'])
			.click(function() { game.enableStrategy(game.user,rule['key']);
								$(".mR").unbind().css('cursor','default').css('color','#aaa');
			}).appendTo($(userMove));
		if ($.inArray(rule['key'],game.strategyKeyList)==-1) {
			$(r).append("<i class='icon-question-sign' style='margin:3px;'></i>");
			$(r).css('opacity',1.0);
		} else {
			$(r).append("<i class='icon-ok-sign' style='margin:3px;'></i><span style='font-size:12px; font-weight:bold;'>knew it already</span>");
			$(r).css('opacity',0.35);
		}
	});
	$(userMove).append("<div>Select one from above to teach <b>"+botName+"</b>.<br>You can also <a href='javascript:addCustomRule();'>Create a Custom Rule</a></div>");
//	$("<a class='btn' id='continueButton'>CONTINUE</a>").click(function() {
//		$(this).hide(); 
//		game.findBestStrategy(game.board,game.turn,computerMove);
//	}).appendTo($("#console"));

}

// it uses AI's current strategy set 
// to find the best move
function computerMove(response) {
	if(needReset) {
		$("#console").append('Game already finished. Press new game button to start again.');
		clearBoard();
		return;
	}
//	$("#console #userMoveDIV").css({
//		'background':'none',
//		'border':'1px solid white',
//		'box-shadow':'none'
//	});
	var botMove = $("<div id='botMoveDIV' class='clearfix' style='padding:12px; margin-bottom:5px;'></div>").appendTo($("#console"));
	$("#sortable").each( function() {
		$(this).attr('id','');	// when there's an existing list of rules already, delete their id to prevent conflicts with new list.
	});
	var html = "<div><b>"+botName+"</b> tried to find the best rule,</div><ul id='sortable'>";
	var responseDict = JSON.parse(response);
	game.strategy = responseDict.userRules;
	var bestRuleFound = responseDict.rule;
	showUserAI(game.strategy,"userInfo");
	for(i in game.strategy) {
		html = html+"<li class='ui-state-default'><div style='margin:10px 0 0 0px; ' id='ai_"+game.strategy[i].key+"' class='ai_"+ game.strategy[i].key +" rule_inactive rule'>"+ game.strategy[i].title +"</div></li>";
	}
	html = html+"</ul>";
	var botMoveContent = $(html).appendTo($(botMove));
	for(i in game.strategy) {
		stKey = game.strategy[i].key;
		if (bestRuleFound!=undefined && bestRuleFound.key==stKey) {	// for the best strategy, color it in red
			console.log("found it!"+game.strategy[i].title);
//			var currentMove = $("#console").getLast(); 
			$(".ai_"+stKey).removeClass('rule_inactive');
			$(".ai_"+stKey).removeClass('rule_unapplicable');
			$(".ai_"+stKey).addClass('rule_selected');
			$(".ai_"+stKey).append("<span style='color:gray; font-size:13px;'> was the first applicable rule.</span>");
			break;
		} else {   // for non-feasible (but top-priority) strategies
//			var currentMove = $("#console").getLast(); 
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
		$(html).appendTo($(botMove));
	} else if (responseDict.message=="no strategy found") {
//		$("#status").text(strategy.message);
		html = "<div style='line-height:2em;'>No strategy seems to match the situation.</div>"
			$(html).appendTo($(botMove));
	} else {
		$("#rule").text(responseDict.message);
		html = "<div style='line-height:1.2em;margin-top:10px;'>Your turn now. Click an empty cell to continue.</div>"
			$(html).appendTo($(botMove));
		// now it selects one from all the moves of the best strategy
		selectedLoc = responseDict.locList[Math.floor(Math.random()*responseDict.locList.length)]; // randomly select one location from list
		game.move(selectedLoc[0], selectedLoc[1], game.turn); // update board ds with current game.turn and return new value of the cell
		game.currentStep = game.history.length-1;
		updateBoard(game.board);
		checkWinner(); 
	}
}

function history(direction) {
	if (direction=='next') game.currentStep += 1;
	else game.currentStep -= 1;
	if (game.currentStep>=game.history.length-1) {
		historyMode('off');	
		$("#console").empty();
		$("#console").append("It's your turn. Click an empty cell for next move.");
		tempBoard = game.history[game.history.length-1];
		updateBoard(tempBoard['board']);
		game.currentStep = game.history.length-1;
		return;
	} else if(game.currentStep<=-1) {
		game.currentStep=0;
		return;
	} else {
		historyMode('on');
		tempBoard = game.history[game.currentStep];	
		updateBoard(tempBoard['board']);
//		$("#currentStep").text(currentStep);
		$("#console").empty();
//		$("#console").append("<span style='color:#2222ee; font-size:20px;'>History Mode</div>");
		if (tempBoard['turn']==game.p2) {
			$("#console").append("<div>It was your turn. Do you want to start again from this point?</div><div class='button_round' onclick='resumeGame("+game.currentStep+");' style='width:200px; text-align:center; background-color:#aaa; font-size:17px; margin:10px auto;'>Resume Game Here</div></div>");
		} else {
			$("#console").append("<div>It was my turn. You can teach me what I could have done at this point. <br>To do that, click an empty cell and tell me why you think it is important.</div>");
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
	game.resumeFromHistoryMode(game.currentStep);
	historyMode('off');
	$(".tile").click( function() {
		callUserMove($(this).attr('id'));
	});
}

function showTeachingStrategy(response) {   // teaching method in history mode
	matchingRules = JSON.parse(response);
	$("#console").append("<div>Which rule below does match with your choice?</div>");
	$(matchingRules).each( function(i,rule) {
		$('<div></div>',{
			id : 'mR_'+rule['code'],
			style : 'margin: 7px 5px 7px 25px; font-size:1.3em; cursor:pointer;'
		})	.text(rule['name'])
			.click(function() { game.enableStrategy(game.user,rule['code']);})
			.appendTo($("#console"));
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
		$('#gameStatusMessage').text("HISTORY MODE");
	} 
	if(flag=='off') {
		$(".tile").unbind();
		$(".tile").click( function() {
			callUserMove($(this).attr('id'));
		});
		$('#gameStatusMessage').text("");
//		$('.tile').css('background-color','#fff');
//		$('#status').text(currentTurn + " 's turn")
//						.css('background-color','#fff');
		$("#console").append("It's your turn. Click an empty cell to take.");			
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
//	$("#bigButton").hide();
	historyMode('off');
	game.restart();  // reset game.board, game.turn 
//	$("#currentStep").text(game.history.length-1);
//	$("#status").css('background-color', 'white');
	$("#rule").text("");
	$("#console").empty();
	var newGameMessage = $("<div class='alert alert-info'></div>").appendTo($("#console"));
	$(newGameMessage).html("A new game has sarted. <br><b>"+game.turn+"</b> takes the first turn this time.");
	if(game.turn==game.p1) $("#console").append("Click an empty tile to make the first move");
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
	if (typeof targetDIV=='string' && targetDIV[0]!='#') var t = "#"+targetDIV;
	else var t = targetDIV;
	$(t).empty();
	//  show the player's strategy
	$(t).append("<div class='bot_icon_big' style='float:left; width:35px; margin:5px 5px 0; background-position:"+botIconOffset(botKind)+"'></div>")
	var names = $("<div style='float:left; width:105px;'></div>");
	$(names).append("<h5 style='color:#eee;'>"+p1+"'s</h5>");
	$(names).append("<h3 style='margin-top:-5px; color:#eee;'>"+botName+"</h3>");
	$(t).append(names);
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
	$("#p1_ai_div").tooltip({
		placement : 'top',
		title: botName+" knows these game rules and applies them in top-down order."
	});
	// Add reset modal Button
	$("#p1_ai").after("<div id='rule-manager' style='text-align:right;'></div>");
	$("#rule-manager").append("<a onclick='javascript:addCustomRule();'><i class='icon-edit icon-white' id='icon-edit' style='opacity:0.3; margin-right:5px;'></i></a>");
	$("#rule-manager").append("<a data-toggle='modal' href='#resetModal'><i class='icon-trash icon-white' id='icon-reset' style='opacity:0.3; margin-right:5px;'></i></a>");
	$("#icon-reset").tooltip({
		placement : 'bottom',
		title: "Delete All The Rules"
	});
	$("#icon-edit").tooltip({
		placement : 'bottom',
		title: "Create a Custom Rule"
	});	
//	$("#icon-reset").mouseenter(function(){
//		$(this).after("<span id='icon-reset-label' style='font-size:11px; margin-left:5px; font-weight:bold; color:white; opacity:0.3'>DELETE ALL THE RULES</span>");
//	}).mouseleave(function() {
//		$("#icon-reset-label").remove();
//	});
//	// Add create custom rule
//	$("#icon-reset").mouseenter(function(){
//		$(this).after("<span id='icon-reset-label' style='font-size:11px; margin-left:5px; font-weight:bold; color:white; opacity:0.3'>DELETE ALL THE RULES</span>");
//	}).mouseleave(function() {
//		$("#icon-reset-label").remove();
//	});
	
	$("#p1_ai").disableSelection();
	// When a rule is clicked, SHOWING DETAIL
	$("li.ai_item").click(function() {
		// close all the opened detail windows
		if($('.floatingPanel').length>0) {
			if($('.floatingPanel').attr('key')==$(this).attr('key')) {	// if user clicked the rule of opening one, slide left
				$('.floatingPanel').hide("slide", { direction: "left" }, 300, function() {$(this).remove();});	
				return;
			} else $('.floatingPanel').remove();	// if another rule is clicked, just remove it
		}
		
		var detailDIV = $("<div></div>",{
			id:	'ruleDetail',
			class: 'floatingPanel',
			key: $(this).attr('key'),
			style: 'position:absolute;\
					display:hidden;\
					z-index:1;\
					top: 40px;\
					left: 180px;\
					width:350px;\
					min-height:400px;\
					max-height:450px;\
					border-radius: 0 10px 10px 0;\
					padding: 10px;\
					background-color:#fff;\
					box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2) inset, 0 2px 5px rgba(0, 0, 0, 0.5);\
				'
		}).appendTo("#userInfo");
		detailDIV.show("slide",{direction:"left"},200, function() {
			var keyValue = $(this).attr('key');
			for(i in game.strategy) {
				if(game.strategy[i].key == keyValue) {
					var ruleTitleAndDescDIV = $("<div></div>",{
						style: 'color:#ddd; \
								background-color:#444; \
								border-radius:0px 10px 0px 0px; \
								margin:-10px -10px 5px -10px;\
								padding:8px;\
							'
					});
					$("<div style='font-size:1.2em;font-weight:bold; width:250px;'> "+game.strategy[i].title+"</div>").appendTo(ruleTitleAndDescDIV);
					$("<div style='font-size:0.9em;'> "+game.strategy[i].description+"</div>").appendTo(ruleTitleAndDescDIV);		
					$(detailDIV).append(ruleTitleAndDescDIV);
					if(game.strategy[i].rule_type=="board definition") {
						var defDiv = $("<div></div>",{
							id: 'ai_detail_definition',
							class: 'clearfix',
							style: 'padding:5px;\
									height:360px;\
									overflow-y:scroll;\
									'
						}).appendTo(detailDIV);
						var defList = eval(game.strategy[i].definition);
						$.each(defList, function(iB, brd) {
							$(defDiv).append(createRuleBoard(brd));
						});
					}
					var deleteButton = $("<div class='txtBtn' style='position:absolute; top:0px; right:0px; margin:5px;'> <i class='icon-trash icon-white'></i></div>").click(function() { game.deleteRule(game.p1,keyValue); });
					detailDIV.append(deleteButton);
					break;
				}
			}
			// add click event of closing all the .floatingPanel to '.trainerPanel'
			$(".trainerPanel").click(function() {
				if($('.floatingPanel').length>0) 
					$('.floatingPanel').hide("slide", { direction: "left" }, 300, function() {$(this).remove();});	
				$(".trainerPanel").unbind('click');
			});
			
		});
	});
	//$(t).append("<div id='createRuleButton' class='ai_item btn green clearfix' style='text-align:center;' onclick='javascript:addCustomRule();'>Add Custom Rule</div>")
	$(t).append("<div class='ai_detail' style='clear:both; float:left;'> </div>")
	$(t).append("<div style='clear:both;'></div>");
}

function showResetModal() {
	$('#resetModal').modal('show');
}

function addCustomRule() {
	$('#container_creation').remove();
	var pageContentHandle = $(".pageContent");
	var graymat = $("<div></div>",{
		style: '	position:absolute;\
					z-index: 1;\
					width: '+ pageContentHandle.width() +'px;\
					height: '+ pageContentHandle.height() +'px;\
					left: '+pageContentHandle.offset()['left']+'px;\
					top: '+pageContentHandle.offset()['top']+'px;'
	}).attr("class","grayMat").appendTo("html");
	graymat.click(function() {
		$(".grayMat").fadeOut().remove();
		$("#container_creation").fadeOut().remove();
	});
	var container_creation = $("<div></div>",{	
				id : 'container_creation',
				style : '	position: absolute;\
							left: '+ ($(".pageContent").offset()['left']+50)+'px;\
							top: 55px;\
							margin-left : 50px;\
							width: 780px;\
							z-index:2;\
							padding:15px;\
							background-color: #fff;\
							opacity: 1;\
							border-radius: 10px;\
							-moz-box-shadow: 0px 0px 5px 5px rgba(0,0,0, 0.5);\
						    -webkit-box-shadow: 0px 0px 5px 5px rgba(0,0 ,0, 0.5);\
						    box-shadow: 0px 0px 5px 5px rgba(0, 0, 0, 0.5);\
						'
			}).attr("id","container_creation").appendTo(pageContentHandle);
	creation = new Creation();
	creation.startCreationInterface(container_creation,game.cloneBoard(game.board));
}

function setStrategy(data) {
	game.strategy = eval(data);
	console.log("setStrategy: "+data);
	game.strategyKeyList = [];
	for (i in game.strategy)
		game.strategyKeyList.push(game.strategy[i].key);
}
function createRuleBoard(board) {
	var miniBoard = $("<div class='tinyboard' style='float:left;'></div>"); 
	var cellSize = 10;
	var boardDiv = $("<div style='position:relative; margin:2px 0 0 2px;'></div>");
	for (ir in board) {
		var r= board[ir];
		var row = $("<div></div>");
		for (ic in r) {
//			var tileType = r[ic].value;
			var col = $("<div class='review_cell "+ir+"_"+ic+"'></div>");
			col.addClass(TYPE[r[ic]].css+"_tiny").addClass(TYPE[r[ic]].ignorecss);				
			col.css({'width':cellSize,'height':cellSize,'border':'1px solid #eee'});
			$(row).append(col);
		}
		$(row).append("<div style='clear:both'></div>");
		$(boardDiv).append(row);
	}	
	$(boardDiv).append("<div style='clear:both'></div>");
	$(miniBoard).append(boardDiv);
	$(miniBoard).append("<div style='clear:both;'></div>");
	return miniBoard;
	
//	var ruleBoard = $("<div style='border:1px solid #555; margin:3px; float:left;'></div>");
//	var tileSize = 15;
////	class CellType:
////	    EMPTY = 0
////	    P1 = 1
////	    P2 = 2
////	    SELECTED = 3
////	    IGNORE = 4
//	tileCharacter = ['',"<span style='color:#1F8CC2; text-align:center'>O</span>","<span style='color:#1F8CC2 text-align:center'>X</span>","<span style='color:red text-align:center'>O</span>","<span style='color:#999 text-align:center'>?</span>"];
//	$.each(board, function(iCol,col) {
//		var colDiv = $("<div class='clearfix;' style='float:left; width:"+tileSize+"px;'></div>");
//		$.each(col, function(iRow,tile) {
//			$(colDiv).append("<div style='border:1px solid #eee; font-size:10px; width:"+(tileSize-2)+"px; height:"+(tileSize-2)+"px;'>"+tileCharacter[parseInt(tile)]+"</div>");
//		});
//		$(ruleBoard).append(colDiv);
//	});
//	return ruleBoard;
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


function userMove(x,y) {
	game.findMatchingStrategy(game.board,game.turn,[x,y],showMatchingStrategy);
	var val = game.move(x, y, currentTurn);  // update game.board, game.turn and game.history
	game.currentStep = game.history.length-1;
	updateBoard(game.board);	// update game.board on #txy.text
	var isThereWinner = checkWinner();	// check winning condition. if yes, show the winner, otherwise show next one to play
	if (isThereWinner!=false) {
		return;
	} else if(game.isFull()==true) {
		$("#console").append("<div class='alert alert-info'>Tie Game</div>");
	} else {
		// show CONTINUE button with checkbox
		var continueButton = $("<div id='continueDIV' style='margin-bottom:5px;'><button id='continueButton' class='btn btn-small btn-success'>CONTINUE</button></div>").appendTo($("#console"));
		$("#continueDIV").append("<input type='checkbox' id='alwaysContinue' style='margin-left:5px; margin-right:5px; color:#888'></input><span id='labelAlwaysContinue'>always continue</span>");
		$("#alwaysContinue").attr('checked',alwaysContinue);
		$("#alwaysContinue").click(function() {
			alwaysContinue=$("#alwaysContinue").is(':checked');
			if (alwaysContinue==true) gamebotThinkingStart();
		});
		if (alwaysContinue==true) {
			$("#continueButton").addClass('disabled').removeClass('btn-primary');
			gamebotThinkingStart();
		}
		$('#continueButton').click(function() {
			$("#alwaysContinue").remove();	$("#labelAlwaysContinue").remove();	
			gamebotThinkingStart();
		});
	} 
}

function gamebotThinkingStart() {
	// PROGRESS BAR : AI THinking
	var progressBar = $("<div class='progress progress-info progress-striped active' style='height:5px; margin-bottom:10px;'></div>").appendTo($('#console'));
	var progress = $("<div class='bar' style='width:1%;'></div>").appendTo(progressBar);
	var progressLabel = $("<div style='color:#49AFCD;font-size:11px;margin-top:-10px;'>"+botName+" is thinking...</h4>").appendTo($('#console'));
	$(progress).animate({ 
		width:'100%'
	}, 1500, function() {   // when progress bar reach the end,
		progressBar.hide('slow').remove();
		progressLabel.hide('slow').remove();
		$("#continueButton").addClass('disabled').unbind('click');
		game.findBestStrategy(game.board,game.turn,computerMove);	// run computerMove as callback function
	});
	
}


$(document).ready(function () {
	$(".header #header_button_trainer").addClass("currentMode");
	$.ajaxSetup({ cache: false });
	if (p1=='Guest') {
		var t = setTimeout("window.location.href = '/signIn?redirect=trainer';",500);
		return;
	}
	game = new TicTacToeTrainer();
	game.init(p1,p2);
	showUserAI(game.strategy,"userInfo");	// using user's rule JSON object, show user's AI in userInfo div
	currentTurn = game.turn;
	clearBoard();
	$(".tile").click( function() {
		callUserMove($(this).attr('id'));
	});
});