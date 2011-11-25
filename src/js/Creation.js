var overlayBoard;
var overlayConsole;

var TYPE = {
	IGNORE : {value: 0, css: "create_ignore", ignorecss: "ignore", description:
		"These tiles are ignored by the rule"},
	P1 : {value: 1, css: "create_p1", ignorecss: "consider", description:
		"This tile needs to have P1 in it to apply the rule"},
	P2 : {value: 2, css: "create_p2", ignorecss: "consider", description:
		"This tile needs to have P2 in it to apply the rule"},
	EMPTY : {value: 3, css: "create_empty", ignorecss: "consider", description:
		"This tile needs to be empty to apply the rule"},
	SELECTED : {value: 5, css: "create_selected", ignorecss: "consider", description:
		"This is where the current player could go next"}
	//THERE : {value: 4, css: "create_there"},
};

changeType = function(index1, index2){
	if (overlayBoard[index1][index2] == TYPE.IGNORE)
		overlayBoard[index1][index2] = TYPE.P1;
	else if (overlayBoard[index1][index2] == TYPE.P1)
		overlayBoard[index1][index2] = TYPE.P2;
	else if (overlayBoard[index1][index2] == TYPE.P2)
		overlayBoard[index1][index2] = TYPE.EMPTY;
	else if (overlayBoard[index1][index2] == TYPE.EMPTY)
		overlayBoard[index1][index2] = TYPE.SELECTED;
	/*else if (overlayBoard[index1][index2] == TYPE.THERE)
		overlayBoard[index1][index2] = TYPE.SELECTED;*/
	else if (overlayBoard[index1][index2] == TYPE.SELECTED)
		overlayBoard[index1][index2] = TYPE.IGNORE;
}

startCreationInterface = function(board) {
	var pageContentHandle = $(".pageContent");
	$("<div></div>",{
		id : 'overlay',
		style : 'width: '+pageContentHandle.width()+'px;\
				height: '+pageContentHandle.height()+'px;\
				z-index: 1;\
				background-color: #444444;\
				position: absolute;\
				left: '+pageContentHandle.offset()['left']+'px;\
				top: '+pageContentHandle.offset()['top']+'px;\
				opacity: 0.0;\
				filter: alpha(opacity=0.0);'
	}).attr("class","pageContent").appendTo("html");
	
	// clone, create an overlaid console
	var consoleHandle = $("#console");
	var left = consoleHandle.offset()['left']-parseInt(consoleHandle.css("margin-left"));
	var top = consoleHandle.offset()["top"]-parseInt(consoleHandle.css("margin-top"));
	consoleHandle.clone().css({"width":consoleHandle.width(),
							 "height":consoleHandle.height(),
							 "position":"absolute",
							 "left":left,
							 "top":top,
							 "z-index":2,
							 "opacity":1.0,
							 "filter":"alpha(opacity=1.0)"})
	.attr("id","overlayConsole").appendTo("html");
	overlayConsole = new Console();
	overlayConsole.init("#overlayConsole > .message");
	overlayConsole.clear();
	
	// also need to clone, create the web representation of the game board
	var tileHandle;
	for (var i=0; i<board.length; i++){
		for (var j=0; j<board[i].length; j++){
			//initialize the board type
			if (board[i][j] == "p1")
				board[i][j] = TYPE.P1;
			else if (board[i][j] == "p2")
				board[i][j] = TYPE.P2;
			else
				board[i][j] = TYPE.IGNORE;
			
			// set up the rest of the attributes of the new tile
			tileHandle = $('#t'+i+j);
			tileHandle.clone().attr("id","tilecopy"+i+j).appendTo("html");
			$("#tilecopy"+i+j).attr("style","");
			$("#tilecopy"+i+j).css({"position":"absolute",
								   "left":tileHandle.offset()["left"]-parseInt(tileHandle.css("margin-left")),
								   "top":tileHandle.offset()["top"]-parseInt(tileHandle.css("margin-top")),
								   "width":tileHandle.width(),
								   "height":tileHandle.height(),
								   "z-index":2,
								   "opacity":1.0,
								   "filter":"alpha(opacity=1.0)"});
			$("#tilecopy"+i+j).attr("class", "tile " + board[i][j].ignorecss + " " + board[i][j].css);
			$("#tilecopy"+i+j).mousedown(
				function(index1,index2){
					return function(){
						changeType(index1,index2);
						/*var cssClasses = $(this).attr("class");
						var loc = cssClasses.search("create");
						if(loc != -1)
							cssClasses = cssClasses.slice(0,loc-1);
						alert(cssClasses + " " + overlayBoard[index1][index2].css);*/
						$(this).attr("class", "tile " + board[index1][index2].ignorecss + " " + board[index1][index2].css);
					}
				}(i,j));
			overlayBoard = board;
		}
	}
	
	// put the descriptions of each creation tile type in the console
	var html = "<div style='height: 300px;'>"
	for (type in TYPE){
		html = html +
			"<div id='container_"+type+"' style='float:left; margin: 2px;'>\
			   <div class='"+TYPE[type].ignorecss+"_demonstrate "+TYPE[type].css+"' \
					style='width: 50px; height: 50px; float: left;'>\
				</div>\
				<div id='description_"+type+"' class='instruction' \
					style='float: left; padding: 10px;'>"
					+type+": "+TYPE[type].description+"\
				</div>\
			</div>"
	}
	html = html + "</div>";
	overlayConsole.appendHTML(html);
	for (type in TYPE){
		var handle = $("#container_"+type);
		var width = handle.width()-74-2*parseInt(handle.css("padding-left"));
		$("#description_"+type).css("width",width);
	}
	
	// add a continue and quit button to the console
	overlayConsole.appendButton("CONTINUE","checkRule()");
	overlayConsole.appendHTML("<br/>")
	overlayConsole.appendButton("QUIT","endCreationInterface()");
	
	/*$("<input></input>",{
		type : 'button',
		id : 'doneCreating',
		style : 'height: 20px;\
				z-index: 2;\
				background-color: #FFFFFF;\
				position: absolute;'
	}).attr("value","Create Rule")
	.appendTo($("html"));
	$("#doneCreating").css({
		"width":$("#t00").width(),
		"left":$("#t10").offset()["left"] + 2,
		"top":$("#t02").offset()["top"] + $("#t20").height() + 10
	});
	$("#doneCreating").click(function(){
		if (ruleIsValid){
			parseRule(overlayBoard);
			endCreationInterface();
		}
		// parse the rule and return a function similar to those already programmed
		// add it to the required structures
	});*/
	
	// fancy animation stuff
	$("#overlay").animate({"opacity":"0.75"}, 'fast');
}

checkRule = function(){
	var message = ruleIsValid();
	if (message == null){
		overlayConsole.clear();
		overlayConsole.appendInstruction("What do you want to call your new rule?");
		overlayConsole.appendHTML("<input id='ruleName' type='text' value='newRule'/>");
		overlayConsole.appendHTML("<br/><br/>");
		overlayConsole.appendInstruction("Can you describe what your new rule does?");
		overlayConsole.appendHTML("<textarea id='ruleDesc'>My rule...</textarea>");
		overlayConsole.appendHTML("<br/><br/>");
		overlayConsole.appendInstruction("Which operations do you want applied to your rule?");
		overlayConsole.appendHTML("<input id='transInv' type='checkbox' value='transInv'>Translation Invariance</input><br/>");
		overlayConsole.appendHTML("<input id='flipping' type='checkbox' value='flipping'>Flipping</input><br/>");
		overlayConsole.appendHTML("<input id='rotation' type='checkbox' value='rotation'>Rotation</input><br/>");
		overlayConsole.appendHTML("<input id='rowPermute' type='checkbox' value='rowPermute'>Row Permutation</input><br/>");
		overlayConsole.appendHTML("<input id='colPermute' type='checkbox' value='colPermute'>Column Permutation</input><br/>");
		overlayConsole.appendHTML("<br/>");
		overlayConsole.appendButton("CONTINUE","checkNameAndDesc()");
		overlayConsole.appendHTML("<br/>");
		overlayConsole.appendButton("QUIT","endCreationInterface()");
	} else {
		alert(message);
	}
}

checkNameAndDesc = function(){
	var name = $("#ruleName").val();
	if (name == null || name == "") {
		alert("Please write a name for your new rule!");
	} else if (eval("game."+name+"!=null")){
		alert("This name has already been taken - can you choose another?");
	} else {
		var desc = $("#ruleDesc").val();
		if (desc == "My rule..." || desc == "")
			desc = "No description";
		console.log($("#transInv").attr('checked'));
		console.log($("#flipping").attr('checked'));
		parseRule(overlayBoard, name, desc, $("#transInv").attr('checked'), $("#flipping").attr('checked'),
				  $("#rowPermute").attr('checked'), $("#colPermute").attr('checked'), $("#rotation").attr('checked'));
		endCreationInterface();
	}
}

endCreationInterface = function(){
	$("#overlay").fadeOut();
	$("#overlay").remove();
	$("#overlayConsole").remove();
	for (var i=0; i<overlayBoard.length; i++)
		for (var j=0; j<overlayBoard[0].length; j++)
			$("#tilecopy"+i+j).remove();
}

ruleIsValid = function(){
	// right now just make sure there is at least one "SELECTED" tile
	var selectedCount = 0;
	for (var i=0; i<overlayBoard.length; i++)
		for (var j=0; j<overlayBoard[0].length; j++){
			var tile = overlayBoard[i][j];
			console.log(tile);
			if (tile == TYPE.SELECTED)
				selectedCount++;
		}
	if (selectedCount < 1)
		return "At least one place must be selected (red border)";
	return null;
}

parseRule = function(ruleBoard, name, desc, translationInvariant, flipping,
					 rowPermutation, columnPermutation, rotation)
{
	/* --------------- local helper functions ---------------*/
	var min = function(n,m){
		return (n<m ? n : m);
	}
	
	var max = function(n,m){
		return (n>m ? n : m);
	}
	
	// add the new rule board if not already in the array
	var addRule = function(array, newRule){
		var matchFound = false;
		var currentBoard;
		for (var i=0; i<array.length && !matchFound; i++){
			currentBoard = array[i];
			// make sure the dimensions match
			if (newRule.length != currentBoard.length || newRule[0].length != currentBoard[0].length)
				continue;
			// check to see if the boards are the same
			matchFound = true;
			boardLoop:
			for (var j=0; j<currentBoard.length; j++){
				for (var k=0; k<currentBoard[0].length; k++){
					if (currentBoard[j][k] != newRule[j][k]){
						// break out of these loops
						matchFound = false;
						break boardLoop;
					}
				}
			}
		}
		// if the board was not found in the array, add it
		if (!matchFound)
			array.push(newRule);
	}
	
	var flip = function(board,horizontally,vertically){
		var flippedRuleBoard = new Array();
		for(var i=0; i<board.length; i++)
			flippedRuleBoard.push(new Array(board[0].length));
		for(var i=0; i<board.length; i++){
			for(var j=0; j<board[0].length; j++){
				var xIndex = i;
				var yIndex = j;
				if (vertically)
					xIndex = board.length-i-1;
				if (horizontally)
					yIndex = board[0].length-j-1;
				flippedRuleBoard[xIndex][yIndex] = board[i][j];
			}
		}
		return flippedRuleBoard;
	}
	
	var rotate = function(board){
		var rotatedBoard = new Array();
		for (var i=0; i<board[0].length; i++)
			rotatedBoard.push(new Array(board.length));
		for (var i=0; i<board.length; i++){
			for (var j=0; j<board[0].length; j++){
				var xIndex = j;
				var yIndex = board.length-i-1;
				rotatedBoard[xIndex][yIndex] = board[i][j];
			}
		}
		return rotatedBoard;
	}
	
	var colPermute = function(board,offset){
		var permutedBoard = new Array();
		for (var i=0; i<board.length; i++)
			permutedBoard.push(new Array(board[0].length));
		for (var i=0; i<board.length; i++){
			for (var j=0; j<board[0].length; j++){
				var xIndex = (i + offset) % board.length;
				permutedBoard[xIndex][j] = board[i][j];
			}
		}
		return permutedBoard;
	}
	
	var rowPermute = function(board,offset){
		var permutedBoard = new Array();
		for (var i=0; i<board.length; i++)
			permutedBoard.push(new Array(board[0].length));
		for (var i=0; i<board.length; i++){
			for (var j=0; j<board[0].length; j++){
				var yIndex = (j + offset) % board[0].length;
				permutedBoard[i][yIndex] = board[i][j];
			}
		}
		return permutedBoard;
	}
	/* ------------- end local helper functions -------------*/
	
	// if the rule was created from the creation guide, flip the players
	// my rule evaluation function assumes that P1 represents the current player
	if (guideState == GUIDE_STATE.FINISHING){
		for (var i=0; i<ruleBoard.length; i++){
			for (var j=0; j<ruleBoard[0].length; j++){
				if(ruleBoard[i][j] == TYPE.P1)
					ruleBoard[i][j] = TYPE.P2;
				else if(ruleBoard[i][j] == TYPE.P2)
					ruleBoard[i][j] = TYPE.P1;
			}
		}
	}
	
	// if translation invariance is activated, convert the rule to a relative format
	if (translationInvariant){
		var hMin = ruleBoard.length;
		var hMax = 0;
		var vMin = ruleBoard.length;
		var vMax = 0;
		for (var i=0; i<ruleBoard.length; i++){
			for (var j=0; j<ruleBoard[0].length; j++){
				if (ruleBoard[i][j] != TYPE.IGNORE){
					hMin = min(hMin,i);
					hMax = max(hMax,i);
					vMin = min(vMin,j);
					vMax = max(vMax,j);
				}
			}
		}
		
		var width = hMax-hMin+1;
		var height = vMax-vMin+1;
		
		// essentially, we're shrinking a given rule to the smallest rectangular
		// array that can hold it
		var newRuleBoard = new Array();
		for (var i=0; i<width; i++)
			newRuleBoard.push(new Array(height));
		for (var i=hMin; i<=hMax; i++){
			for (var j=vMin; j<=vMax; j++){
				newRuleBoard[i-hMin][j-vMin] = ruleBoard[i][j];
			}
		}
		
		ruleBoard = newRuleBoard;
	}
	
	// generate all of the new ruleBoards
	var newRuleBoards = new Array();
	// always push the original rule board
	newRuleBoards.push(ruleBoard);
	
	// if flipping activated
	if (flipping){
		for (var i=0; i<newRuleBoards.length; i++){
			addRule(newRuleBoards, flip(newRuleBoards[i],true,false));
			addRule(newRuleBoards, flip(newRuleBoards[i],false,true));
			addRule(newRuleBoards, flip(newRuleBoards[i],true,true));
		}
	}
	
	// if row permutation activated
	if (rowPermutation){
		for (var i=0; i<newRuleBoards.length; i++)
			for (var j=0; j<newRuleBoards[i][0].length; j++)
				addRule(newRuleBoards, rowPermute(newRuleBoards[i],j))
	}
	
	// if column permutation activated
	if (columnPermutation){
		for (var i=0; i<newRuleBoards.length; i++)
			for (var j=0; j<newRuleBoards[i].length; j++)
				addRule(newRuleBoards, colPermute(newRuleBoards[i],j))
	}
	
	// if rotation activated
	if (rotation){
		for (var i=0; i<newRuleBoards.length; i++){
			var rotatedBoard = rotate(newRuleBoards[i]);
			addRule(newRuleBoards, rotatedBoard);
			addRule(newRuleBoards, flip(rotatedBoard,true,true));
		}
	}
	
	// this is the check function - it goes through all ruleboards just created
	//   and compares them to the actual board
	var newRule;
	
	if (translationInvariant){
		// relative version of the function (translation invariance)
		newRule = function(board, player){
			var result = new Object();
			var pushFlag = false;
			var width, height;
			result['success']=true;
			result['loc'] = [];
			for (var h=0; h<newRuleBoards.length; h++){
				width = newRuleBoards[h].length;
				height = newRuleBoards[h][0].length;
				for (var i=0; i<=(board.length-width); i++){
					for (var j=0; j<=(board[0].length-height); j++){
						for (var k=i; k<(width+i); k++){
							for (var l=j; l<(height+j); l++){
								switch(newRuleBoards[h][k-i][l-j]){
									case (TYPE.P1):
										if (board[k][l] != player)
											result['success'] = false;
										break;
									case (TYPE.P2):
										if (board[k][l] != game.flip(player))
											result['success'] = false;
										break;
									case (TYPE.EMPTY):
										if (board[k][l] != null)
											result['success'] = false;
										break;
									case (TYPE.SELECTED):
										if (board[k][l] == null){
											result['loc'].push([k,l]);
											pushFlag = true;
										}
										break;
									default:
										alert("something went wrong");
								}
							}
						}
						if (!result['success']){
							if (pushFlag)
								result['loc'].pop();
						}
						pushFlag = false;
						result['success'] = true;
					}
				}
				console.log(result['loc']+"")
			}
			if (result['loc'].length == 0)
				result['success'] = false;
			return result;
		}
	} else {
		// normal version (no translation invariance)
		newRule = function(board,player){
			var result = new Object();
			var pushFlag = false;
			result['success']=true;
			result['loc'] = [];
			for (var h=0; h<newRuleBoards.length; h++){
				console.log(newRuleBoards[h]);
				for (var i=0; i<board.length; i++){
					for (var j=0; j<board[0].length; j++){
						switch(newRuleBoards[h][i][j]){
							case (TYPE.P1):
								// this assumes p1 is the current player in the rule
								// could implement it so that it's player-blind
								if (board[i][j] != player)
									result['success'] = false;
								break;
							case (TYPE.P2):
								if (board[i][j] != game.flip(player))
									result['success'] = false;
								break;
							case (TYPE.EMPTY):
								if (board[i][j] != null)
									result['success'] = false;
								break;
							case (TYPE.SELECTED):
								if (board[i][j] == null){
									result['loc'].push([i,j])
									pushFlag = true;
								}
								break;
						}
					}
				}
				if (!result['success']){
					if (pushFlag)
						result['loc'].pop();
				}
				pushFlag = false;
				result['success'] = true;
			}
			if (result['loc'].length == 0)
				result['success'] = false;
			return result;
		}
	}
	
	// name,code,tooltip,enabled:
	//   name should be set by the user
	//   code could depend on name, or be represented as an index into an array of functions
	//   tooltip should be set by the user, if used
	//   enabled could be toggled depending on the context - should the AI learn it right away,
	//                                                       or learn through context when it next pops up
	
	game.strategySet.push({'name':name,'code':name,'tooltip':desc,'enabled':true});
	eval("game."+name+" = newRule");
	console.log('new strategy '+name+' pushed');	
	
	// a generic addRule() function would definitely be preferred to this method
}

// want a way to break down rules into textual representation
// and building them back up to a rule function

// states of the guided rule creation
var GUIDE_STATE = {
	SELECT : {value: 0},
	IGNORE : {value: 1},
	FINISHING : {value: 2}
};

var guideState = GUIDE_STATE.SELECT;
var ignoreBoard = new Array();

/*var lastIndex1;
var lastIndex2;
var lastValue = null;
var lastIgnore = null;
var last = null;*/

var changeTypeBasedOnGuide = function(index1, index2, handle){
	if (guideState == GUIDE_STATE.SELECT){
		var curr = overlayBoard[index1][index2];
		if ( curr == TYPE.P1 || curr == TYPE.P2)
			return;
		/*if (lastValue != null){
			last.attr("class", "tile " + lastIgnore + " " + lastValue.css);
			overlayBoard[lastIndex1][lastIndex2] = lastValue;
			ignoreBoard[lastIndex1][lastIndex2] = lastIgnore;
		}
		last = handle;
		lastValue = curr;
		lastIgnore = ignoreBoard[index1][index2];
		lastIndex1 = index1;
		lastIndex2 = index2;*/
		overlayBoard[index1][index2] = TYPE.SELECTED;
		ignoreBoard[index1][index2] = "consider";
		switchState();
	} else if (guideState == GUIDE_STATE.IGNORE)
		flipIgnoreValue(index1, index2);
}

var flipIgnoreValue = function(index1, index2){
	var tile = overlayBoard[index1][index2];
	if (tile == TYPE.SELECTED)
		return;
	if (ignoreBoard[index1][index2] == "ignore")
		ignoreBoard[index1][index2] = "consider";
	else
		ignoreBoard[index1][index2] = "ignore";
}

var switchState = function(){
	switch(guideState){ 
		case GUIDE_STATE.SELECT:
			var message = ruleIsValid();
			if (message != null){
				alert(message);
				return;
			}
			guideState = GUIDE_STATE.IGNORE;
			overlayConsole.clear();
			overlayConsole.appendInstruction("Now, which spaces made you choose that space?");
			overlayConsole.appendHTML("<br/>");
			overlayConsole.appendButton("CONTINUE","switchState()");
			overlayConsole.appendHTML("<br/>");
			overlayConsole.appendButton("QUIT","endCreationInterface()");
			break;
		case GUIDE_STATE.IGNORE:
			guideState = GUIDE_STATE.FINISHING;
			for (var i=0; i<overlayBoard.length; i++)
				for (var j=0; j<overlayBoard[0].length; j++)
					if (ignoreBoard[i][j] == "ignore")
						overlayBoard[i][j] = TYPE.IGNORE;
			checkRule();
			break;
		case GUIDE_STATE.FINISHING:
			alert("This should be impossible to reach - guide_state.finishing");
			break;
	}
}

// also want a way to create rules within a guide
startGuidedCreationInterface = function(board) {
	var pageContentHandle = $(".pageContent");
	$("<div></div>",{
		id : 'overlay',
		style : 'width: '+pageContentHandle.width()+'px;\
				height: '+pageContentHandle.height()+'px;\
				z-index: 1;\
				background-color: #444444;\
				position: absolute;\
				left: '+pageContentHandle.offset()['left']+'px;\
				top: '+pageContentHandle.offset()['top']+'px;\
				opacity: 0.0;\
				filter: alpha(opacity=0.0);'
	}).attr("class","pageContent").appendTo($("html"));
	
	// clone, create an overlaid console
	var consoleHandle = $("#console");
	consoleHandle.clone().css({"position":"absolute",
							 "left":consoleHandle.offset()["left"]-parseInt(consoleHandle.css("margin-left")),
							 "top":consoleHandle.offset()["top"]-parseInt(consoleHandle.css("margin-top")),
							 "width":consoleHandle.width(),
							 "height":consoleHandle.height(),
							 "z-index":2,
							 "opacity":1.0,
							 "filter":"alpha(opacity=1.0)"})
	.attr("id","overlayConsole").appendTo("html");
	overlayConsole = new Console();
	overlayConsole.init("#overlayConsole > .message");
	overlayConsole.clear();
	
	// also need to clone, create the web representation of the game board
	var tileHandle;
	for (var i=0; i<board.length; i++){
		ignoreBoard[i] = new Array();
		for (var j=0; j<board[i].length; j++){
			//initialize the board type
			if (board[i][j] == "p1")
				board[i][j] = TYPE.P1;
			else if (board[i][j] == "p2")
				board[i][j] = TYPE.P2;
			else
				board[i][j] = TYPE.EMPTY;
			ignoreBoard[i][j] = "ignore";
			
			// set up the rest of the attributes of the new tile
			tileHandle = $('#t'+i+j);
			tileHandle.clone().attr("id","tilecopy"+i+j).appendTo("html");
			$("#tilecopy"+i+j).attr("style","");
			$("#tilecopy"+i+j).css({"position":"absolute",
								   "left":tileHandle.offset()["left"]-parseInt(tileHandle.css("margin-left")),
								   "top":tileHandle.offset()["top"]-parseInt(tileHandle.css("margin-top")),
								   "width":tileHandle.width(),
								   "height":tileHandle.height(),
								   "z-index":2,
								   "opacity":1.0,
								   "filter":"alpha(opacity=1.0)"});
			$("#tilecopy"+i+j).attr("class", "tile " + ignoreBoard[i][j] + " " + board[i][j].css);
			$("#tilecopy"+i+j).mousedown(
				function(index1,index2){
					return function(){
						changeTypeBasedOnGuide(index1,index2,$(this));
						$(this).attr("class", "tile " + ignoreBoard[index1][index2] + " " + board[index1][index2].css);
					}
				}(i,j));
			overlayBoard = board;
		}
	}
	
	// add a continue and quit button to the console
	overlayConsole.appendInstruction("Click where you think I should have gone.");
	overlayConsole.appendHTML("<br/>");
	overlayConsole.appendHTML("<br/>");
	overlayConsole.appendButton("QUIT","endCreationInterface()");
	
	// set up the initial guide state
	guideState = GUIDE_STATE.SELECT;
	
	// fancy animation stuff
	$("#overlay").animate({"opacity":"0.75"}, 'fast');
}