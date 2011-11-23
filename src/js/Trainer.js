	var p1='{{user_id}}';
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
				$("#t"+x+""+y).addClass('tile_'+board[x][y]);
			}
		}
	}
	
	// called after user/AI move to prevent keep on playing
	function checkWinner() {
		// winning event
		var winner = game.checkForWinner();
		if (winner) {
			$("#status").text(winner + " wins!");
			$("#status").css('background-color', 'yellow');
			if(winner=='p1') cons.appendHTML("<div style='font-size:17px; margin:10px;'>"+game.p1 + " wins!</div>");
			else cons.appendHTML("<div style='font-size:17px; margin:10px;'>"+game.p2 + " wins!</div>");
			needReset = true;
		} else {
			$("#status").text(game.turn + " to play");
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
		var strategy = JSON.parse(response);
		var nextMove;
		for(i in strategy) {
			result = strategy[i].result;
			if (result.success) {
				nextMove=strategy[i];	// nextMove : the top-priority successful rule which will be executed. 
				break;
			}
		}
		for(i in strategy) {
			code = strategy[i].st;
			strt = game.publicStrategyDict[code];  
			name = strt['name'];
			html = html+"<li class='ui-state-default'><div style='margin:10px 0 0 10px; ' id='ai_"+code+"' class='ai_"+ code +" rule_inactive'>"+ name +"</div></li>";
		}
		html = html+"</ul>";
		cons.appendHTML(html);
		for(i in strategy) {
			stCode = strategy[i].st;
			if (nextMove!=undefined && nextMove.st==strategy[i].st) {	// for the best strategy, color it in red
				console.log("found it!"+stCode);
				var currentMove = cons.getLast(); 
				$(".ai_"+stCode).removeClass('rule_inactive');
				$(".ai_"+stCode).removeClass('rule_unapplicable');
				$(".ai_"+stCode).addClass('rule_selected');
				$(".ai_"+stCode).append("<span style='color:gray; font-size:13px;'> was the first applicable rule.</span>");
				break;
			} else {   // for non-feasible (but top-priority) strategies
				var currentMove = cons.getLast(); 
				console.log("cannot find it!"+ stCode);  
				$(".ai_"+stCode).removeClass('rule_inactive');
				$(".ai_"+stCode).addClass('rule_unapplicable');
				$(".ai_"+stCode).removeClass('rule_selected');
				$(".ai_"+stCode).append("<span style='color:gray; font-size:13px;'> was not applicable.</span>");
			}
		}
		$("#sortable").sortable({
			update : function(event, ui) {
				changeOrder();
			}
		});
		$("#sortable").disableSelection();
		if (strategy.message=="Tie Game") {
			$("#status").text(strategy.message);
			html = "<div style='line-height:2em;'>Tie game! Click 'new game' button to start over.</div>"
			cons.appendHTML(html);
		} else if (strategy.message=="no strategy found") {
			$("#status").text(strategy.message);
			html = "<div style='line-height:2em;'>No strategy seems to match the situation.</div>"
			cons.appendHTML(html);
		} else {
			$("#rule").text(strategy.message);
			html = "<div style='line-height:1.2em;margin-top:10px;'>Your turn now. Click an empty cell to continue.</div>"
			cons.appendHTML(html);
			// now it selects one from all the moves of the best strategy
			selectedLoc = nextMove.result.loc[Math.floor(Math.random()*nextMove.result.loc.length)]; // randomly select one location from list
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
		flippedTurn = (turn == 'p1') ? 'p2' : 'p1';
		game.findMatchingStrategy(board,flippedTurn,[x,y],showTeachingStrategy);
	}
	function resumeGame(currentStep) {	// history mode -> play mode
		game.resumeAt(currentStep);
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
	}
	function historyMode(flag) {
		if(flag=='on') {
			$(".tile").unbind();
			$('.tile').css('background-color','#ddd');
			$('#status').text('History mode')
							.css('background-color','#0055ff');
		} 
		if(flag=='off') {
			$(".tile").unbind();
			$(".tile").click( function() {
				callUserMove($(this).attr('id'));
			});
			$('.tile').css('background-color','#fff');
			$('#status').text(currentTurn + " 's turn")
							.css('background-color','#fff');
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
		$("#status").css('color','black');
		$("#bigButton").hide();
		historyMode('off');
		game.restart();  // reset game.board, game.turn 
		$("#currentStep").text(game.history.length-1);
		$("#status").css('background-color', 'white');
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
				id : 'mR_'+rule['code'],
				class : 'mR',
				style : 'margin: 7px 5px 7px 25px; font-size:1.3em; cursor:pointer;'
			})	.text(rule['name'])
				.click(function() { game.enableStrategy(game.user,rule['code']);
									$(".mR").unbind().css('cursor','default').css('color','#aaa');
				}).appendTo($(cons.target));
			if ($.inArray(rule['code'],game.strategy)==-1) {$(r).append("<span style='font-size:13px;' title='your AI does not know this rule.'> <b>[?]</b></span>");} else {$(r).append("<span style='font-size:13px;' title='your AI knows this rule.'> <b>[!]</b></span>");}
		});
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
		$.ajaxSetup({ cache: false });
		game = new TicTacToeTrainer();
		game.init(p1);
		cons = new Console();
		cons.init("#console > .message"); // initialize console object
		currentTurn = game.turn;
		$(".tile").click( function() {
			callUserMove($(this).attr('id'));
		});
	});