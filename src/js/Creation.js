
function Creation() {
	var overlayBoard;
	var patternList;
	var overlayConsole;
	var variationList = {
			rowPermutation: {title:'Row Permutation',desc:'', checked:''	},
			columnPermutation: {title:'Column Permutation',desc:'',  checked:''		},
			flip : {title:'Flipping',desc:'safe',  checked:'checked="yes"'		},
			rotate: {title:'Rotation',desc:'safe',  checked:'checked="yes"'		}
//			move: {title:'Move'	}
			};
	var TYPE = {
			EMPTY : {value: 0, css: "create_empty", ignorecss: "consider", description:
				"<b>Empty tile</b> : the tile should be empty to apply the rule"},
			P1 : {value: 1, css: "create_p1", ignorecss: "consider", description:
				"<b>Player</b> already occupied this tile."},
			P2 : {value: 2, css: "create_p2", ignorecss: "consider", description:
				"<b>Opponent</b> already occupited this tile."},
			SELECTED : {value: 3, css: "create_selected", ignorecss: "consider", description:
				"<b>Next move</b> where the player will take.<br><span style='color:red;'>required</span>"},
			IGNORE : {value: 4, css: "create_ignore", ignorecss: "ignore", description:
				"<b>Ignore</b> : rule doesn't care what is on this tile."}
	};
	this.changeType = function(index1, index2){
		if (this.overlayBoard[index1][index2] == TYPE.EMPTY)
			this.overlayBoard[index1][index2] = TYPE.P1;
		else if (this.overlayBoard[index1][index2] == TYPE.P1)
			this.overlayBoard[index1][index2] = TYPE.P2;
		else if (this.overlayBoard[index1][index2] == TYPE.P2)
			this.overlayBoard[index1][index2] = TYPE.SELECTED;
		else if (this.overlayBoard[index1][index2] == TYPE.SELECTED)
			this.overlayBoard[index1][index2] = TYPE.IGNORE;
		/*else if (overlayBoard[index1][index2] == TYPE.THERE)
			overlayBoard[index1][index2] = TYPE.SELECTED;*/
		else if (this.overlayBoard[index1][index2] == TYPE.IGNORE)
			this.overlayBoard[index1][index2] = TYPE.EMPTY;
	}

	this.startCreationInterface = function(target,board) {	// target: jquery object of container, board: board state
//		var pageContentHandle = $(".pageContent");
//		$("<div></div>",{
//			id : 'overlay',
//			style : 'width: '+pageContentHandle.width()+'px;\
//					height: '+pageContentHandle.height()+'px;\
//					z-index: 1;\
//					background-color: #444444;\
//					position: absolute;\
//					left: '+pageContentHandle.offset()['left']+'px;\
//					top: '+pageContentHandle.offset()['top']+'px;\
//					opacity: 0.0;\
//					filter: alpha(opacity=0.0);'
//		}).attr("class","pageContent").appendTo("html");
		
		// clone, create an overlaid console
//		var consoleHandle = $("#console");
//		var left = consoleHandle.offset()['left']-parseInt(consoleHandle.css("margin-left"));
//		var top = consoleHandle.offset()["top"]-parseInt(consoleHandle.css("margin-top"));
//		consoleHandle.clone().css({"width":consoleHandle.width(),
//								 "height":consoleHandle.height(),
//								 "position":"absolute",
//								 "left":left,
//								 "top":top,
//								 "z-index":2,
//								 "opacity":1.0,
//								 "filter":"alpha(opacity=1.0)"})
//		.attr("id","overlayConsole").appendTo("html");
//		this.overlayConsole = new Console();
//		this.overlayConsole.init("#overlayConsole > .message");
//		this.overlayConsole.clear();
		target.addClass('creationDIV').addClass('clearfix');
		$("<h2 style='color:#57A957;'>Step 1. Define basic pattern</h2>").appendTo(target);
		var boardDIV = $("<div></div>",{
			id: 'cr_board',
			style : '	width: 330px;\
						height: 330px;\
						float:left;\
						margin:0px;\
					',
		}).appendTo(target);
		var instDIV = $("<div></div>",{
			id: 'cr_inst',
			style : '	width: 440px;\
						height: 330px;\
						float:left;\
						margin-left:10px;\
					',
		}).appendTo(target);
		var variationDIV = $("<div></div>",{
			id: 'cr_variation',
			style : '	clear:both;\
						width:100%;\
						position:relative;\
						\
					',
		}).appendTo(target);
		
		// create the web representation of the game board
		for (var i=0; i<board.length; i++){
			for (var j=0; j<board[i].length; j++){
				//initialize the board type
				if (board[i][j] == game.p1)
					board[i][j] = TYPE.P1;
				else if (board[i][j] == game.p2)
					board[i][j] = TYPE.P2;
				else
					board[i][j] = TYPE.IGNORE;
				var tileDIV = $("<div></div>").
							attr("id","tilecopy"+i+j).
							attr("class", "tile " + board[i][j].ignorecss + " " + board[i][j].css).
							appendTo(boardDIV);
				tileDIV.mousedown(
						function(index1,index2){
							return function(){
								creation.changeType(index1,index2);
								$(this).attr("class", "tile " + board[index1][index2].ignorecss + " " + board[index1][index2].css);
								creation.updateVariation();
							}
						}(i,j)
				);
			}
		}
		this.overlayBoard = board;		
				
		
		// put the descriptions of each creation tile type in the console
		var html = "<div style='height: 300px;'>"
		for (type in TYPE){
			html = html +
				"<div id='container_"+type+"' style='float:left; margin: 2px;'>\
				   <div class='"+TYPE[type].ignorecss+"_demonstrate "+TYPE[type].css+"' \
						style='width: 50px; height: 50px; float: left;'>\
					</div>\
					<div id='description_"+type+"' class='instruction' \
						style='float: left; padding:5px 5px 5px 10px;'>"
						+TYPE[type].description+"\
					</div>\
				</div>"
		}
		html = html + "</div>";
		instDIV.append(html);

		// STEP2. add variation UI
		$("<h2 style='color:#57A957;'>Step 2. Make variations of your pattern</h2>").appendTo(variationDIV);
		$.each(variationList,function(i_op,op) {
			var d = $("<div></div>").attr('id','var_'+i_op).appendTo(variationDIV);
			d.css('border-bottom','1px solid #ddd');
			d.append("<div><input type='checkbox' value='"+i_op+"' name='variationCheckBoxes' "+op.checked+" onchange='creation.updateVariation();'>&nbsp;"+op.title+"<span style='font-size:0.8em; color:blue; margin-left:5px;'>"+op.desc+"</span></div>");
			d.append("<div class='ex_boards clearfix'></div>");
		});
		
		// STEP3. title and description
		$("<h2 style='color:#57A957; margin-top:10px;'>Step 3. Name your rule</h2>").appendTo(variationDIV);
		$("<div style='margin:5px 0 5px 0;'><div style='width:100px; float:left;'>Title</div><input type='text' size='50' id='title' name='title'></div>").appendTo(variationDIV);
		$("<div style='margin:5px 0 5px 0; clear:both;'><div style='width:100px; float:left;'>Description</div><textarea rows='4' id='description' style='width:415px;'name='description'></textarea></div>").appendTo(variationDIV);
		$("<div style='margin:5px 0 5px 0; clear:both;'><div style='float:left;margin-right:15px;'>Allow other users to use your rule</div><input type='checkbox' name='publicCheckBox'></div>").appendTo(variationDIV);
		$("<div style='position:absolute; right:0px; bottom:0px; margin-right:20px;'><a class='btn green large' onclick='creation.createRule();'>CREATE RULE</a></div>").appendTo(variationDIV);
	} // end of constructor



	// when: 	1. basic pattern board updated
	//			2. variation checkbox updated
	this.updateVariation = function(){
		var basePatternList = [];
		basePatternList.push(this.overlayBoard);
		for(code in variationList) {
			var exDIV = $("#var_"+code+" .ex_boards").empty();
			if ($("input[value='"+code+"']").is(':checked')) {
				basePatternList = this.getVariation(basePatternList,code);
				for(i in basePatternList) {
					var board = basePatternList[i];
					exDIV.append(this.createTinyPattern(board));	
				}		
			}
		}
		this.patternList = basePatternList;
	} // end of updateVariation

	// tiny board are used in graph layouts
	this.createTinyPattern = function(board) {
		var miniBoard = $("<div class='tinyboard' style='float:left;'></div>"); 
		var cellSize = 10;
		var boardDiv = $("<div style='position:absolute; margin:2px 0 0 2px;'></div>");
		for (ir in board) {
			var r= board[ir];
			var row = $("<div></div>");
			for (ic in r) {
				var tileType = r[ic].value;
				var col = $("<div class='review_cell "+ir+"_"+ic+"'></div>");
				col.addClass(r[ic].css).addClass(r[ic].ignorecss);				
				col.css({'width':cellSize,'height':cellSize,'border':'1px solid #eee', 'background-size':'15px 15px'});
				$(row).append(col);
			}
			$(row).append("<div style='clear:both'></div>");
			$(boardDiv).append(row);
		}	
		$(boardDiv).append("<div style='clear:both'></div>");
		$(miniBoard).append(boardDiv);
		$(miniBoard).append("<div style='clear:both;'></div>");
		return miniBoard;
	}
	this.extractBoardList = function() {
		var ruleBoardList = [];
		for (i in this.patternList) {
			var brd = [];
			for (cI in this.patternList[i]) {
				var col = [];
				for(rI in this.patternList[i][cI]) 	col.push(this.patternList[i][cI][rI].value);
				brd.push(col);
			}	
			ruleBoardList.push(brd);
		}
		return ruleBoardList;
	}
	
	this.createRule = function() {
		var newRuleTitle = $("#title").val();
		if (newRuleTitle == null || newRuleTitle == "") {	alert("Please write a title for your new rule!"); return;  } 
		if (this.ruleIsValid()!=null) {
			alert(this.ruleIsValid()); return;
		}
		var desc = $("#description").val();
		if (desc == "My rule..." || desc == "")
			desc = "No description";
//		var ruleBoard = new Array(overlayBoard.length);
//		for (var i=0; i<overlayBoard.length; i++){
//			ruleBoard[i] = new Array(overlayBoard[0].length);
//			for (var j=0; j<overlayBoard[0].length; j++)
//				ruleBoard[i][j] = overlayBoard[i][j].value;
//		}
		game.makeNewStrategy(this.extractBoardList(), newRuleTitle, desc);
		this.endCreationInterface();
	}
	


	this.endCreationInterface = function(){
		$(".grayMat").fadeOut().remove();
		$("#container_creation").fadeOut().remove();
	}

	this.ruleIsValid = function(){
		// right now just make sure there is at least one "SELECTED" tile
		var selectedCount = 0;
		for (var i=0; i<this.overlayBoard.length; i++)
			for (var j=0; j<this.overlayBoard[0].length; j++){
				var tile = this.overlayBoard[i][j];
				console.log(tile);
				if (tile == TYPE.SELECTED)
					selectedCount++;
			}
		if (selectedCount < 1)
			return "At least one Next move tile(red circle) is required.";
		return null;
	}

	//	 --------------- local helper functions ---------------
	this.min = function(n,m){
		return (n<m ? n : m);
	}
	this.max = function(n,m){
		return (n>m ? n : m);
	}
	
	this.getVariation = function(boardList,operation) {
		var result = boardList;
		for(i in boardList) {
			var board = boardList[i];
			if(operation=='rowPermutation') {
				this.addRules(result,this.rowPermutation(board));
			} else if (operation=='columnPermutation') {
				this.addRules(result,this.columnPermutation(board));
			} else if (operation=='flip') {
				this.addRules(result,this.flip(board));
			} else if (operation=='rotate') {
				this.addRules(result,this.rotate(board));
			} 
		}
		return result;
	}
	
	// add the new rule board if not already in the array
	this.addRules = function(array, newArray) {
		for(i in newArray) 	this.addRule(array,newArray[i]);
		return array;
	}
	this.addRule = function(array, newRule){
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
	
	this.flip = function(board) {
		var flipWorker = function(board,horizontally,vertically){
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
		var result= [];
		this.addRule(result,flipWorker(board,true,false));
		this.addRule(result,flipWorker(board,false,true));
		this.addRule(result,flipWorker(board,true,true));
		return result;
	}

	this.rotate = function(board){
		var rotateWorker = function(board) {
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
		var result = [];
		this.addRule(result,rotateWorker(board));
		this.addRule(result,rotateWorker(rotateWorker(board)));
		this.addRule(result,rotateWorker(rotateWorker(rotateWorker(board))));
		return result;
	}
	
	this.rowPermutation = function(board) {
		var rowPermutationWorker = function(board,offset){
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
		var result = [];
		for(offset in board) {
			result.push(rowPermutationWorker(board,offset));
		}
		return result;
	}

	this.columnPermutation = function(board) {
		var columnPermutationWorker = function(board,offset){
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
		var result = [];
		for(offset in board) {
			result.push(columnPermutationWorker(board,offset));
		}
		return result;
	}

	/* ------------- end local helper functions -------------*/	
//	
//	
//	this.parseRule = function(ruleBoard, name, desc, translationInvariant, flipping,
//						 rowPermutation, columnPermutation, rotation)
//	{
//
//		
//		// if the rule was created from the creation guide, flip the players
//		// my rule evaluation function assumes that P1 represents the current player
//		if (guideState == GUIDE_STATE.FINISHING){
//			for (var i=0; i<ruleBoard.length; i++){
//				for (var j=0; j<ruleBoard[0].length; j++){
//					if(ruleBoard[i][j] == TYPE.P1)
//						ruleBoard[i][j] = TYPE.P2;
//					else if(ruleBoard[i][j] == TYPE.P2)
//						ruleBoard[i][j] = TYPE.P1;
//				}
//			}
//		}
//		
//		/* I'm not sure if this approach is really necessary - an easier approach would
//			 * perhaps be to generate new rules like I do with the other options and then apply them
//			 * via the "no translation invariance" function below, but since this method should not cause
//			 * any repeat boards and should be faster, maybe its not a bad way to go, especially once
//			 * we generalize to larger games like connect4 */
//		// if translation invariance is activated, convert the rule to a relative format
//		if (translationInvariant){
//			var hMin = ruleBoard.length;
//			var hMax = 0;
//			var vMin = ruleBoard[0].length;
//			var vMax = 0;
//			for (var i=0; i<ruleBoard.length; i++){
//				for (var j=0; j<ruleBoard[0].length; j++){
//					if (ruleBoard[i][j] != TYPE.IGNORE){
//						hMin = min(hMin,i);
//						hMax = max(hMax,i);
//						vMin = min(vMin,j);
//						vMax = max(vMax,j);
//					}
//				}
//			}
//			
//			var width = hMax-hMin+1;
//			var height = vMax-vMin+1;
//			
//			// essentially, we're shrinking a given rule to the smallest rectangular
//			// array that can hold it
//			var newRuleBoard = new Array();
//			for (var i=0; i<width; i++)
//				newRuleBoard.push(new Array(height));
//			for (var i=hMin; i<=hMax; i++){
//				for (var j=vMin; j<=vMax; j++){
//					newRuleBoard[i-hMin][j-vMin] = ruleBoard[i][j];
//				}
//			}
//			
//			ruleBoard = newRuleBoard;
//		}
//		
//		// generate all of the new ruleBoards
//		var newRuleBoards = new Array();
//		// always push the original rule board
//		newRuleBoards.push(ruleBoard);
//		
//		// if flipping activated
//		if (flipping){
//			for (var i=0; i<newRuleBoards.length; i++){
//				addRule(newRuleBoards, flip(newRuleBoards[i],true,false));
//				addRule(newRuleBoards, flip(newRuleBoards[i],false,true));
//				addRule(newRuleBoards, flip(newRuleBoards[i],true,true));
//			}
//		}
//		
//		// if row permutation activated
//		if (rowPermutation){
//			for (var i=0; i<newRuleBoards.length; i++)
//				for (var j=0; j<newRuleBoards[i][0].length; j++)
//					addRule(newRuleBoards, rowPermute(newRuleBoards[i],j))
//		}
//		
//		// if column permutation activated
//		if (columnPermutation){
//			for (var i=0; i<newRuleBoards.length; i++)
//				for (var j=0; j<newRuleBoards[i].length; j++)
//					addRule(newRuleBoards, colPermute(newRuleBoards[i],j))
//		}
//		
//		// if rotation activated
//		if (rotation){
//			for (var i=0; i<newRuleBoards.length; i++){
//				var rotatedBoard = rotate(newRuleBoards[i]);
//				addRule(newRuleBoards, rotatedBoard);
//				addRule(newRuleBoards, flip(rotatedBoard,true,true));
//			}
//		}
//		
//		// this is the check function - it goes through all ruleboards just created
//		//   and compares them to the actual board
//		var newRule;
//		
//		if (translationInvariant){
//			// relative version of the function (translation invariance)
//			newRule = function(board, player){
//				var result = new Object();
//				var pushFlag = false;
//				var width, height;
//				result['success']=true;
//				result['loc'] = [];
//				for (var h=0; h<newRuleBoards.length; h++){
//					width = newRuleBoards[h].length;
//					height = newRuleBoards[h][0].length;
//					for (var i=0; i<=(board.length-width); i++){
//						for (var j=0; j<=(board[0].length-height); j++){
//							for (var k=i; k<(width+i); k++){
//								for (var l=j; l<(height+j); l++){
//									switch(newRuleBoards[h][k-i][l-j]){
//										case (TYPE.P1):
//											if (board[k][l] != player)
//												result['success'] = false;
//											break;
//										case (TYPE.P2):
//											if (board[k][l] != game.flip(player))
//												result['success'] = false;
//											break;
//										case (TYPE.EMPTY):
//											if (board[k][l] != null)
//												result['success'] = false;
//											break;
//										case (TYPE.SELECTED):
//											if (board[k][l] == null){
//												result['loc'].push([k,l]);
//												pushFlag = true;
//											}
//											break;
//										default:
//											alert("something went wrong");
//									}
//								}
//							}
//							if (!result['success']){
//								if (pushFlag)
//									result['loc'].pop();
//							}
//							pushFlag = false;
//							result['success'] = true;
//						}
//					}
//					console.log(result['loc']+"")
//				}
//				if (result['loc'].length == 0)
//					result['success'] = false;
//				return result;
//			}
//		} else {
//			// normal version (no translation invariance)
//			newRule = function(board,player){
//				var result = new Object();
//				var pushFlag = false;
//				result['success']=true;
//				result['loc'] = [];
//				for (var h=0; h<newRuleBoards.length; h++){
//					console.log(newRuleBoards[h]);
//					for (var i=0; i<board.length; i++){
//						for (var j=0; j<board[0].length; j++){
//							switch(newRuleBoards[h][i][j]){
//								case (TYPE.P1):
//									// this assumes p1 is the current player in the rule
//									// could implement it so that it's player-blind
//									if (board[i][j] != player)
//										result['success'] = false;
//									break;
//								case (TYPE.P2):
//									if (board[i][j] != game.flip(player))
//										result['success'] = false;
//									break;
//								case (TYPE.EMPTY):
//									if (board[i][j] != null)
//										result['success'] = false;
//									break;
//								case (TYPE.SELECTED):
//									if (board[i][j] == null){
//										result['loc'].push([i,j])
//										pushFlag = true;
//									}
//									break;
//							}
//						}
//					}
//					if (!result['success']){
//						if (pushFlag)
//							result['loc'].pop();
//					}
//					pushFlag = false;
//					result['success'] = true;
//				}
//				if (result['loc'].length == 0)
//					result['success'] = false;
//				return result;
//			}
//		}
//		
//		// name,code,tooltip,enabled:
//		//   name should be set by the user
//		//   code could depend on name, or be represented as an index into an array of functions
//		//   tooltip should be set by the user, if used
//		//   enabled could be toggled depending on the context - should the AI learn it right away,
//		//                                                       or learn through context when it next pops up
//		
//		game.strategySet.push({'name':name,'code':name,'tooltip':desc,'enabled':true});
//		eval("game."+name+" = newRule");
//		console.log('new strategy '+name+' pushed');	
//		
//		// a generic addRule() function would definitely be preferred to this method
//	}


	// states of the guided rule creation
//	var GUIDE_STATE = {
//		SELECT : {value: 0},
//		IGNORE : {value: 1},
//		FINISHING : {value: 2}
//	};
//	
//	var guideState = GUIDE_STATE.SELECT;
//	var ignoreBoard = new Array();

/*var lastIndex1;
var lastIndex2;
var lastValue = null;
var lastIgnore = null;
var last = null;*/
//
//	this.changeTypeBasedOnGuide = function(index1, index2, handle){
//		if (guideState == GUIDE_STATE.SELECT){
//			var curr = this.overlayBoard[index1][index2];
//			if ( curr == TYPE.P1 || curr == TYPE.P2)
//				return;
//			/*if (lastValue != null){
//				last.attr("class", "tile " + lastIgnore + " " + lastValue.css);
//				overlayBoard[lastIndex1][lastIndex2] = lastValue;
//				ignoreBoard[lastIndex1][lastIndex2] = lastIgnore;
//			}
//			last = handle;
//			lastValue = curr;
//			lastIgnore = ignoreBoard[index1][index2];
//			lastIndex1 = index1;
//			lastIndex2 = index2;*/
//			this.overlayBoard[index1][index2] = TYPE.SELECTED;
//			ignoreBoard[index1][index2] = "consider";
//			this.switchState();
//		} else if (guideState == GUIDE_STATE.IGNORE)
//			this.flipIgnoreValue(index1, index2);
//	}
//
//	this.flipIgnoreValue = function(index1, index2){
//		var tile = this.overlayBoard[index1][index2];
//		if (tile == TYPE.SELECTED)
//			return;
//		if (this.ignoreBoard[index1][index2] == "ignore")
//			this.ignoreBoard[index1][index2] = "consider";
//		else
//			this.ignoreBoard[index1][index2] = "ignore";
//	}

//	this.switchState = function(){
////		switch(guideState){ 
////			case GUIDE_STATE.SELECT:
////				var message = ruleIsValid();
////				if (message != null){
////					alert(message);
////					return;
////				}
////				guideState = GUIDE_STATE.IGNORE;
////				overlayConsole.clear();
////				overlayConsole.appendInstruction("Now, which spaces made you choose that space?");
////				overlayConsole.appendHTML("<br/>");
////				overlayConsole.appendButton("CONTINUE","switchState()");
////				overlayConsole.appendHTML("<br/>");
////				overlayConsole.appendButton("QUIT","endCreationInterface()");
////				break;
////			case GUIDE_STATE.IGNORE:
////				guideState = GUIDE_STATE.FINISHING;
////				for (var i=0; i<overlayBoard.length; i++)
////					for (var j=0; j<overlayBoard[0].length; j++)
////						if (ignoreBoard[i][j] == "ignore")
////							overlayBoard[i][j] = TYPE.IGNORE;
////				checkRule();
////				break;
////			case GUIDE_STATE.FINISHING:
////				alert("This should be impossible to reach - guide_state.finishing");
////				break;
////		}
//	}

//	// also want a way to create rules within a guide
//	this.startGuidedCreationInterface = function(board) {
//		var pageContentHandle = $(".pageContent");
//		$("<div></div>",{
//			id : 'overlay',
//			style : 'width: '+pageContentHandle.width()+'px;\
//					height: '+pageContentHandle.height()+'px;\
//					z-index: 1;\
//					background-color: #444444;\
//					position: absolute;\
//					left: '+pageContentHandle.offset()['left']+'px;\
//					top: '+pageContentHandle.offset()['top']+'px;\
//					opacity: 0.0;\
//					filter: alpha(opacity=0.0);'
//		}).attr("class","pageContent").appendTo($("html"));
//		
//		// clone, create an overlaid console
//		var consoleHandle = $("#console");
//		consoleHandle.clone().css({"position":"absolute",
//								 "left":consoleHandle.offset()["left"]-parseInt(consoleHandle.css("margin-left")),
//								 "top":consoleHandle.offset()["top"]-parseInt(consoleHandle.css("margin-top")),
//								 "width":consoleHandle.width(),
//								 "height":consoleHandle.height(),
//								 "z-index":2,
//								 "opacity":1.0,
//								 "filter":"alpha(opacity=1.0)"})
//		.attr("id","overlayConsole").appendTo("html");
//		overlayConsole = new Console();
//		overlayConsole.init("#overlayConsole > .message");
//		overlayConsole.clear();
//		
//		// also need to clone, create the web representation of the game board
//		var tileHandle;
//		for (var i=0; i<board.length; i++){
//			ignoreBoard[i] = new Array();
//			for (var j=0; j<board[i].length; j++){
//				//initialize the board type
//				if (board[i][j] == "p1")
//					board[i][j] = TYPE.P1;
//				else if (board[i][j] == "p2")
//					board[i][j] = TYPE.P2;
//				else
//					board[i][j] = TYPE.EMPTY;
//				ignoreBoard[i][j] = "ignore";
//				
//				// set up the rest of the attributes of the new tile
//				tileHandle = $('#t'+i+j);
//				tileHandle.clone().attr("id","tilecopy"+i+j).appendTo("html");
//				$("#tilecopy"+i+j).attr("style","");
//				$("#tilecopy"+i+j).css({"position":"absolute",
//									   "left":tileHandle.offset()["left"]-parseInt(tileHandle.css("margin-left")),
//									   "top":tileHandle.offset()["top"]-parseInt(tileHandle.css("margin-top")),
//									   "width":tileHandle.width(),
//									   "height":tileHandle.height(),
//									   "z-index":2,
//									   "opacity":1.0,
//									   "filter":"alpha(opacity=1.0)"});
//				$("#tilecopy"+i+j).attr("class", "tile " + ignoreBoard[i][j] + " " + board[i][j].css);
//				$("#tilecopy"+i+j).mousedown(
//					function(index1,index2){
//						return function(){
//							changeTypeBasedOnGuide(index1,index2,$(this));
//							$(this).attr("class", "tile " + ignoreBoard[index1][index2] + " " + board[index1][index2].css);
//						}
//					}(i,j));
//				overlayBoard = board;
//			}
//		}
//		
//		// add a continue and quit button to the console
//		overlayConsole.appendInstruction("Click where you think I should have gone.");
//		overlayConsole.appendHTML("<br/>");
//		overlayConsole.appendHTML("<br/>");
//		overlayConsole.appendButton("QUIT","endCreationInterface()");
//		
//		// set up the initial guide state
//		guideState = GUIDE_STATE.SELECT;
//		
//		// fancy animation stuff
//		$("#overlay").animate({"opacity":"0.75"}, 'fast');
//	}

	
}//end of Creation()