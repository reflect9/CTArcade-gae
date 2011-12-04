var memberList, currentMode;

var p1_color = "paleGreen";   
var p2_color = "violetPink";  
var playerColor = {};
var canvasElement, ctx;
var currentRound = 0;    
var selectedShape = "";


function showUserAI(userID, targetDIV) {
	if (typeof targetDIV=='string' && targetDIV[0]!='#') var t = "#"+targetDIV;
	else var t = targetDIV;
	$.get('ajaxCall',{action:'getUserAI', userID:userID}, function(data){
		var res= JSON.parse(data);  var userAI = res.result;
		//  show the player's strategy
		$(t).append("<h2 style='float:left;'>"+userID+"'s AI</h2><div id='button_ai_edit' style='float:left; margin:2px 0px 0px 10px; cursor:pointer;'><span class='icon_edit'>&nbsp;</span><span style='float:left; margin:4px 0px 0px 2px; font-weight:bold;'>Edit</span></span>");
		var aiDIV = $(t).append("<DIV id='p1_ai_div' class='clearfix' style='clear:both;'><ul id='p1_ai' style='list-style-type:none;padding-left:0px;margin:0px;'></ul><div style='clear:both;'></div></DIV>");
		$.each(userAI, function(i,strategy) {
			$(aiDIV).find("#p1_ai").append("<li class='ai_item'>"+strategy+"</li>");
		});
		$("#p1_ai").sortable({
			update : function(event, ui) {
				var codeList = [];
				$("#p1_ai li").each(function(i,e) {
					var code = $(e).text();
					codeList.push(code);
				});
		    	$.ajax({
		    		type : "GET",
		    		url: "/ajaxTrainer",
		    		async: true,
		    		data: 	{ 	action: 'changeOrder',
		    					player: userID,
		    					game: 'tictactoe',
		    					newStrategy : JSON.stringify(codeList)
		    				},
		    		success: function(response) {
		    			init(p2);
		    			runMatch(p1,p2);
		    		}
		    	});
			}
		});
		$("#p1_ai").disableSelection();
		$("#button_ai_edit").click(function() {
		});
	});
}
function init(pl1,pl2) {
	currentRound = 0;
	if(pl1=="Guest") {
		alert("User should log in first."); return;
	}
	p2 = pl2;
	playerColor[p1]=p1_color;   playerColor[p2] = p2_color;
}
 
// request server to run match and get response
function runMatch(pl1,pl2) {
	$("#welcome").empty();
	if(pl1=="Guest") {
		return;
	}
	$("#summary").empty();			$("#matches").empty();
	$.get('ajaxCall',{ action:'runMatch', p1:pl1, p2:pl2 }, function(data) {
		var res = JSON.parse(data);
		var result = res.result;
		matches = result.matches;
		p1_AI = result.AI[p1];
		p2_AI = result.AI[p2];
		// count who wins how many times
		var p1_wins = 0;  var p2_wins= 0;  var tie_games = 0;
		$.each(matches, function(i,match) {
			if (match.winner==result.players.p1) p1_wins++;
			if (match.winner==result.players.p2) p2_wins++;
			if (match.winner=="Tie Game") tie_games++;
		});
		// show description of the match
		$("#summary").append("<h2 style='margin-top:15px;'>Result of 30 matches</h2>");
		var html = 	"<SPAN style='background-color:"+getColor(playerColor[result.players.p1],1)+"; color:white; padding:0px 4px 0px 4px; -moz-border-radius: 4px; border-radius:4px;'>"+result.players.p1+"</SPAN>"
				+	"<SPAN style='margin:0 10px 0 10px;'>"+p1_wins+"</SPAN>"
				+	" : "
				+	"<SPAN style='margin:0 10px 0 10px;'>"+p2_wins+"</SPAN>"
				+	"<SPAN style='background-color:"+getColor(playerColor[result.players.p2],1)+"; color:white; padding:0px 4px 0px 4px; -moz-border-radius: 4px; border-radius:4px;'>"+result.players.p2+"</SPAN>"
				+	"<SPAN style='margin:0 10px 0 20px;'>and "+tie_games+" tie games</SPAN>";
 
   			$("#summary").append("<DIV style='font-size:21px; margin:10px;'>"+html+"</DIV>");
   		
   		// draw default graph visualization	
   		showMatches(currentMode);
	});
}
function showMatches(mode) {
	if(mode=='list')
		showMatchesAsList(matches);
	else if(mode=='animation')
		showMatchesAsAnimation(matches);
	else if(mode=='group')
		showMatchesAsGroups(matches);
	else if(mode=='graph_vertical')
		showMatchesAsGraph(matches,'vertical');
	else if (mode=='graph_horizontal') 
		showMatchesAsGraph(matches,'horizontal');
}
function createMiniBoard_singleRound(match,iR) {	// used by graph mode only
	var movesInOrder = [[0,0,0],[0,0,0],[0,0,0]];
    var strategyInOrder = [["","",""],["","",""],["","",""]];
        $(match.history).each(function(bi,turn) {
        	if (turn.loc==undefined) return;
            movesInOrder[turn.loc[0]][turn.loc[1]]=bi+1;
            strategyInOrder[turn.loc[0]][turn.loc[1]]=turn.message;
        });
        var turn = match.history[iR];
        var matchBoard = createTinyBoard(turn.board,turn.message,turn.loc,movesInOrder,strategyInOrder,false);
        return matchBoard;
   	}
   
/* miniBoards are used for layouts except graph*/
function createMiniBoard(board,st,loc,movesInOrder,strategyInOrder,showStrategy) {
	var miniBoard = $("<div class='miniboard'></div>"); 
	if (showStrategy) $(miniBoard).append("<div id='strategy' style='font-size:12px; font-family:Helvetica; '>"+"</div>");
	else  $(miniBoard).append("<div id='strategy' style='font-size:12px; font-family:Helvetica'></div>");
	var boardDiv = $("<div></div>");
		$(board).each( function(ir,r) {
			//alert(r);
			var row = $("<div></div>");
			$(r).each( function(ic,c) {
			    var col = $("<div class='review_cell "+ir+"_"+ic+"'><p>"+movesInOrder[ir][ic]+"</p></div>");
				col.css({'width':miniBoard.width()/4,'height':miniBoard.width()/4});
			    if (loc!=undefined && loc[0]==ir && loc[1]==ic) { // if it's the latest move
					if (c==p1) $(col).css("background-color",color.paleGreen);  
                   else if (c==p2) $(col).css("background-color",color.violetPink);
				} else {
                   if (c==p1) $(col).css("background-color",getColor("paleGreen",0.3));  
                   else if (c==p2) $(col).css("background-color",getColor("violetPink",0.3));
				}		
				if(strategyInOrder[ir][ic]!="" && (c==p1 || c==p2)) $(col).qtip({content:strategyInOrder[ir][ic]});
				$(row).append(col);
			});
			$(row).append("<div style='clear:both'></div>");
			$(boardDiv).append(row);
		});
	var winnerAndPattern = findWinningCells(board);
	if (winnerAndPattern!=false) {
//		$(miniBoard).css('border','2px solid '+getColor(playerColor[winnerAndPattern.winner],1));
		$(winnerAndPattern.pattern).each(function(i,wloc) {
			$(boardDiv).find("."+wloc[0]+"_"+wloc[1]).css('border','2px solid black');
		});
   }			
	$(boardDiv).css('border','2px solid white');
	$(boardDiv).append("<div style='clear:both'></div>");
	$(miniBoard).append(boardDiv);
	$(miniBoard).append("<div style='clear:both;'></div>");
	return miniBoard;
}
// tiny board are used in graph layouts
function createTinyBoard(board,st,loc,movesInOrder,strategyInOrder,showStrategy) {
	var miniBoard = $("<div class='tinyboard'></div>"); 
	var cellSize = Math.floor((miniBoard.width()-10)/3);
	var boardDiv = $("<div style='position:absolute; margin:2px 0 0 2px;'></div>");
		$(board).each( function(ir,r) {
			//alert(r);
			var row = $("<div></div>");
			$(r).each( function(ic,c) {
			    var col = $("<div class='review_cell "+ir+"_"+ic+"'>&nbsp;</div>");
				col.css({'width':cellSize,'height':cellSize,'border':'1px solid #eee'});
			    if (loc!=undefined && loc[0]==ir && loc[1]==ic) { // if it's the latest move
					if (c==p1) $(col).css("background-color",color.paleGreen).css("border","1px solid white");  
                   else if (c==p2) $(col).css("background-color",color.violetPink).css("border","1px solid white");
				} else {
                   if (c==p1) $(col).css("background-color",getColor("paleGreen",0.25));  
                   else if (c==p2) $(col).css("background-color",getColor("violetPink",0.25));
				}		
				if(strategyInOrder[ir][ic]!="" && (c==p1 || c==p2)) $(col).qtip({content:strategyInOrder[ir][ic]});
				$(row).append(col);
			});
			$(row).append("<div style='clear:both'></div>");
			$(boardDiv).append(row);
		});
		var winnerAndPattern = findWinningCells(board);
		if (winnerAndPattern!=false) {
			$(miniBoard).attr('winner',winnerAndPattern.winner);
			$(miniBoard).css('border','1px solid '+getColor(playerColor[winnerAndPattern.winner],1));
			$(winnerAndPattern.pattern).each(function(i,wloc) {
				$(boardDiv).find("."+wloc[0]+"_"+wloc[1]).css('border','1px solid black');
			});
	   }		
	$(boardDiv).append("<div style='clear:both'></div>");
	$(miniBoard).append(boardDiv);
	$(miniBoard).append("<div style='clear:both;'></div>");
	return miniBoard;
}



function showMatchesAsList(matchList) {
	currentMode = "list";
    $("#matches").empty();
   $(matchList).each( function(i,m) {
       //alert(e.message);
       var matchDIV = $("<div style='clear:both; margin:10px 0 10px 0; border-top:2px dotted'></div>");
       var p1tag = "<span style='background-color:"+getColor(playerColor[p1],0.6)+";border-radius:2px; padding:1px 3px 1px 3px;'>"+p1+"</span>";
       var p2tag = "<span style='background-color:"+getColor(playerColor[p2],0.6)+";border-radius:2px; padding:1px 3px 1px 3px;'>"+p2+"</span>";
       if (m.winner==p1) $(matchDIV).append("<div><span>"+"<div class='icon_star' style=''></div>"+p1tag+" vs. "+p2tag+"</span></div>");
       else if(m.winner==p2) $(matchDIV).append("<div><span>"+p1tag+" vs. "+p2tag+"<div class='icon_star' style=''></div>"+"</span></div>");
       var movesInOrder = [[0,0,0],[0,0,0],[0,0,0]];
       var strategyInOrder = [["","",""],["","",""],["","",""]];
       $(m.history).each(function(bi,turn) {
       	if (turn.loc==undefined) return;
           movesInOrder[turn.loc[0]][turn.loc[1]]=bi+1;
           strategyInOrder[turn.loc[0]][turn.loc[1]]=turn.message;
       });
//               alert(movesInOrder);
       $(m.history).each(function(bi,turn) {
           var matchBoard = createMiniBoard(turn.board,turn.message,turn.loc,movesInOrder,strategyInOrder,true);
           $(matchDIV).append(matchBoard);
       });
       $(matchDIV).append("<div style='clear:both'/>");
       $("#matches").append(matchDIV);
   });
   colorizeUser();
}
function showMatchesAsAnimation(matchList) {
	currentMode = "animation";
  $("#matches").empty();
  $("#matches").append("<div><input type='button' value='<' onclick='prev();'/><input type='button' value='>' onclick='next();'/>"+currentRound+"</div>");
  $(matchList).each( function(i,m) {
      var matchDIV = $("<div id='match_"+i+"' class='match'></div>");
      matchDIV.append("<div style='font-size:11px;'>match "+i+"</div>");
      var turn = m.history[currentRound];
      if (turn==undefined) turn=m.history[m.history.length-1];
     var movesInOrder = [[0,0,0],[0,0,0],[0,0,0]];
     var strategyInOrder = [["","",""],["","",""],["","",""]];
     $(m.history).each(function(bi,turn) {
     	if (turn.loc==undefined) return;
         movesInOrder[turn.loc[0]][turn.loc[1]]=bi+1;
         strategyInOrder[turn.loc[0]][turn.loc[1]]=turn.message;
     });
      var matchBoard = createMiniBoard(turn.board, turn.message, turn.loc,movesInOrder,strategyInOrder,true);
      $(matchDIV).append(matchBoard);
      $("#matches").append(matchDIV);
  });
}
function prev() {
  currentRound -=1; 
  if (currentRound<0)  currentRound=0;
  showMatchesAsAnimation(matches);
}
function next() {
 currentRound +=1; 
 if (currentRound>8)  currentRound=8;
 showMatchesAsAnimation(matches);
}

function showMatchesAsGroups(matchList) {
	currentMode = "group";
	$("#matches").empty();
	$("#matches").append("<div id='winningGames' style='clear:both; margin:10px;'><div>Winning games</div></div>");
	$("#matches").append("<div id='losingGames' style='clear:both; margin:10px;'><div>Losing games</div></div>");
	$("#matches").append("<div id='tieGames' style='clear:both; margin:10px;'><div>Tie games</div></div>");
	$(matchList).each( function(i,m) {
		var matchDIV = $("<div class='match'></div>");
		var lastTurn = m.history[m.history.length-1];
        var movesInOrder = [[0,0,0],[0,0,0],[0,0,0]];
        var strategyInOrder = [["","",""],["","",""],["","",""]];
        $(m.history).each(function(bi,turn) {
        	if (turn.loc==undefined) return;
            movesInOrder[turn.loc[0]][turn.loc[1]]=bi+1;
            strategyInOrder[turn.loc[0]][turn.loc[1]]=turn.message;
        });
		var matchBoard = createMiniBoard(lastTurn.board, lastTurn.message, lastTurn.loc,movesInOrder,strategyInOrder,false);
		$(matchDIV).append(matchBoard);
		if (m.winner==p1) {
			$("#winningGames").append(matchDIV);
		}
		if (m.winner==p2) {
			$("#losingGames").append(matchDIV);
		}
		if (m.winner=="Tie Game") {
			$("#tieGames").append(matchDIV);
		}
	});
	// lose
	
	// group by last move position
}
function findCluster(matches) {
	var cluster = {};
	$(matches).each(function(i,match) {	/*  board:[[0, "tak", 0], [0, 0, 0], ["ben", 0, 0]],iM:0,loc:[2, 0],,message:"takeAnyCorner",turn:"ben"  */
		var variations = getBoardVariations(match.board);	//  util.js
		var patternExist = false;
		var fingerprint = "";
		$(variations).each(function(iV,variation) {
//			fingerprint = match.turn+";"+JSON.stringify(variation);
			fingerprint = JSON.stringify(variation);
			if ( fingerprint in cluster) {
				cluster[fingerprint].push(match.iM);	// iM is index of match for the fingerprint
				patternExist = true;
				return false;
			} 
		}); 
		if (patternExist==false) cluster[fingerprint] = [match.iM];
	});
	return cluster;
}
// graph (from left to right). Each column represents round. In a column, similar matches are clustered. Edges between two clusters in adjacent columns are strategy used. 
function showMatchesAsGraph(matchList, direction) {
	currentMode = "graph";
	$("#matches").empty();
//	var graph_p1 = [];  var graph_p2 = [];	// graph_p1 is a set of matches initiated by p1's move first
	$.each([p1,p2], function(iP, firstMovePlayer) {	//
		var selectedMatches = [];
		var graph = [];
		$.each(matchList, function(iM,match) { // for each match, 
			if(match.history[0].turn==firstMovePlayer) selectedMatches.push(match);	// filter by the first move player
		});
		// for each round, 
		for(var iR=0;iR<9;iR++) {
			var allMatchesWithinARound = [];
			$(selectedMatches).each( function(iM,match) {
				if (match.history.length>iR)  {
					var b = match.history[iR];
					b.iM = iM;
					allMatchesWithinARound.push(b);
				}
			});
			var cluster = findCluster(allMatchesWithinARound);  // key-value pair.  key:fingerprint of each cluster, value:index of matches in the cluster
			graph.push(cluster);
		}
		var layoutResult = sugiyama(graph);
		var divID =  "matches_"+firstMovePlayer;
		$("#matches").append("<div id='"+divID+"' class='clearfix' style='clear:both; position:relative; width:100%;'></div>");
		drawGraph(layoutResult,selectedMatches,"#"+divID,direction);
	});
//	$(".matchGraphColumn_bg").click(function() { alert("asdfdfd"); deselectBoard();});
//	$(".matchGraphColumn").click(function() { deselectBoard();});
	
}
function drawGraph(layoutResult,selectedMatches,targetDivID, direction) {
	graph = layoutResult.graph;
	var connectivityMatrix = layoutResult.connectivity;
	// find max, min position (integer)
	var min_pos = 100000;	var max_pos = -100000;
	for(var rI in graph) 
		for(var nodeI in graph[rI]) {
			if (graph[rI][nodeI]['position'] <min_pos) min_pos = graph[rI][nodeI]['position'];
			if (graph[rI][nodeI]['position'] >max_pos) max_pos = graph[rI][nodeI]['position'];
		}
	if(direction=="horizontal") {
		var gap = max_pos-min_pos;
		var interval = 45;
		var totalHeight = (gap+2)*interval;
		var vertical_offset = (-1*min_pos*interval) + (interval/2);	
		var columnDivClass = "matchGraphColumn";
	} else {
		var gap = max_pos-min_pos;
		var interval = $(targetDivID).width()/(gap+1);
		if (interval<$(".tinyboard:first").width()) interval = $(".tinyboard:first").width()+10;
		var hor_offset = (-1*min_pos*interval) + (interval/2);
		var columnDivClass = "matchGraphRound";
	}

	// place tinyboard representation
	$(graph).each(function(iR,round){
		var columnDiv = $("<div id='graph_round_"+iR+"' class='"+columnDivClass+" clearfix'></div>");
		if(direction=="horizontal") columnDiv.css('height',totalHeight);
		$.each(round, function(boardShape,data) { // iterate clusters
			var sampleMatch = selectedMatches[data['matches'][0]];  // use the first game in the list, generate representative miniboard
			var matchBoard = createMiniBoard_singleRound(sampleMatch,iR);
			$(matchBoard).removeClass('miniboard');  $(matchBoard).addClass('miniboard_graph');
			var listOfMatches = data.matches.length;
			if(direction=="horizontal") {	// positioning each board
				$(matchBoard).css("top",vertical_offset+data.position*interval);
				$(matchBoard).css("left",0);
				$(matchBoard).append("<div class='board_frequency' style='position:absolute; color:"+getColor(playerColor[$(matchBoard).attr('winner')],1)+"; top:0; left:0; margin-left:42px; padding:0 2px 0 2px; font-size:9px; background-color:rgba(255,255,255,0.75); font-weight:bold; visibility:hidden;'>"+listOfMatches+"</div>");
			} else {
				$(matchBoard).css("left",data.position*interval+hor_offset);
				$(matchBoard).css("top",0);
				$(matchBoard).append("<div class='board_frequency' style='position:absolute; bottom:0; left:0; margin-bottom:-15px; font-size:9px; font-weight:bold;'>"+listOfMatches+"</div>");
			}
			// add some custom attr. to each board div
			$(matchBoard).attr("shape",boardShape.replace(/"/gi,''));
			if (typeof connectivityMatrix[iR]['downward'][boardShape]==="undefined")
				var down_connection = "";
			else 
				var down_connection = connectivityMatrix[iR]['downward'][boardShape].join("_");   
			$(matchBoard).attr("down_connection",down_connection.replace(/"/gi,''));
			if(iR>0) { var up_connection = connectivityMatrix[iR-1]['upward'][boardShape].join("_");
									$(matchBoard).attr("up_connection",up_connection.replace(/"/gi,'')); 	}
			$(matchBoard).attr("matchIndex",","+data.matches+",");
			// mouse interaction
			$(matchBoard).click(function() {
				selectBoard(matchBoard);
			});
			$(matchBoard).mouseover(function() {
			});
			$(matchBoard).mouseout(function() {
			});
			$(columnDiv).append(matchBoard);
		});
//		$(columnDiv).append("<div class='matchGraphColumn_bg' style='position:absolute; width:100%; height:100%; z-index:0;'></div>")
		$(targetDivID).append(columnDiv);
	});
	// draw lines
	$(targetDivID).prepend("<canvas id='canvas_"+targetDivID.replace("#","")+"' style='position:absolute; top:0px; left:0px;' width='"+$(targetDivID).width()+"px' height='"+$(targetDivID).height()+"px' direction='"+direction+"'></canvas>");
	var canvas = $("#canvas_"+targetDivID.replace("#",""));
	drawGraphLinesAll(targetDivID,canvas,direction);
}	
function selectBoard(matchBoard) {
//	alert("selected");
	if(typeof selectedBoard=='undefined') selectedBoard = "";
	if (selectedBoard == matchBoard) {
		deselectBoard();
	} else {
		$(selectedBoard).removeClass('selectedBoard');
		selectedBoard = matchBoard;
		$(matchBoard).addClass('selectedBoard');
		highlightPath(matchBoard);
	}
}
function deselectBoard() {
	$(selectedBoard).removeClass('selectedBoard');
	selectedBoard = "";
	dehighlightPath();
}
function drawGraphLinesAll(targetDivID,canvas,direction) {
	var ctx = $(canvas)[0].getContext("2d");
	ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);	
	var allDivs = $(targetDivID).find("div.tinyboard");
	$.each(allDivs, function(iD, tinyboard) {
		var downwardConnectedDivShapes = $(tinyboard).attr('down_connection').split("_");
		$.each(downwardConnectedDivShapes, function(iCD, connectedShape) {
			if(connectedShape=="") return true;
			var downwardConnectedTinyBoard = $(targetDivID).find('div[shape="'+connectedShape+'"]');
			drawGraphLine(canvas,$(tinyboard),downwardConnectedTinyBoard,direction,"#eee");
		});
	});
//	$.each(connectivityMatrix, function(iR, round) {
//		$.each(round.downward, function(shapeA, connectedShapesB){
//			$.each(connectedShapesB, function(iB, shapeB) {
//				var sA = $(targetDivID+' div[shape="'+shapeA.replace(/"/gi,'')+'"]');
//				var sB = $(targetDivID+' div[shape="'+shapeB.replace(/"/gi,'')+'"]');
//				if (sA.length==0)
//					alert("ahahaha");
//				drawGraphLine(canvas,sA,sB,direction,"#eee");	// ctx: canvas context, sA: start div jquery var, sB: ending, direction : "horizontal" or vertical, and color
//			});
//		});
//	});
}
function clearAllCanvas(){
	$.each($("canvas"),function(iCanvas,c) {
		var tempCtx = c.getContext("2d");
		tempCtx.clearRect(0,0,c.width,tempCtx.canvas.height);
	});
}
function drawGraphLinesSpecificMatches(targetDivID,canvas,direction,listOfSelectedMatches) {	
	// lines connecting listOfSelectedMatches are stronger than the others. 
//	clearAllCanvas();
	var ctx = $(canvas)[0].getContext("2d");
//	ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
	drawGraphLinesAll("#"+targetDivID,canvas,direction);
	var allDivs = $("#"+targetDivID).find("div.tinyboard");
	$.each(allDivs, function(iD, tinyboard) {
		var matchesOfCurrentBoard = $(tinyboard).attr('matchindex').split(",");
		if (commonElementsFromArrays(matchesOfCurrentBoard,listOfSelectedMatches).length>0) {
			var downwardConnectedDivShapes = $(tinyboard).attr('down_connection').split("_");
			$.each(downwardConnectedDivShapes, function(iCD, connectedShape) {
				if(connectedShape=="") return true;
				var downwardConnectedTinyBoard = $("#"+targetDivID).find('div[shape="'+connectedShape+'"]');
				var matches_downwardConnectedTinyBoard = downwardConnectedTinyBoard.attr('matchindex').split(",");
				if(commonElementsFromArrays(matches_downwardConnectedTinyBoard,listOfSelectedMatches).length>0) {
					drawGraphLine(canvas,$(tinyboard),downwardConnectedTinyBoard,direction,"#bbb");
				}
			});
		}
	});
}
function drawGraphLine(canvas,sA,sB,direction,color) {
	var ctx = $(canvas)[0].getContext("2d");
	var offsetA = sA.offset();
	var offsetB = sB.offset();
	var gap = 15; // how strong bezierCurve tends to go straight
	if(direction=="horizontal")  {
		var startPoint = {'x':sA.offset().left+sA.width()-$(canvas).offset().left, 'y':sA.offset().top+sA.height()/2-$(canvas).offset().top};
		var endPoint = {'x':sB.offset().left-$(canvas).offset().left, 'y':sB.offset().top+sB.height()/2-$(canvas).offset().top};
		var ctrA = {'x':startPoint.x+gap,'y':startPoint.y};
		var ctrB = {'x':endPoint.x-gap, 'y':endPoint.y};
	} else {
		var startPoint = {'x':sA.offset().left+sA.width()/2-$(canvas).offset().left, 'y':sA.offset().top+sA.height()-$(canvas).offset().top};
		var endPoint = {'x':sB.offset().left+sB.width()/2-$(canvas).offset().left, 'y':sB.offset().top-$(canvas).offset().top};
		var ctrA = {'x':startPoint.x,'y':startPoint.y+gap};
		var ctrB = {'x':endPoint.x, 'y':endPoint.y-gap};
	}
	ctx.beginPath();
	ctx.moveTo(startPoint.x,startPoint.y);
	ctx.bezierCurveTo(ctrA.x,ctrA.y,ctrB.x,ctrB.y,endPoint.x,endPoint.y);
	if(parseInt($(sA).find(".board_frequency").text()) < parseInt($(sB).find(".board_frequency").text())) {
		ctx.lineWidth = 1+parseInt($(sA).find(".board_frequency").text())/2;
	} else {
		ctx.lineWidth = 1+parseInt($(sB).find(".board_frequency").text())/2;
	}
    ctx.strokeStyle =color; // line color
    ctx.stroke();
}

function highlightPath(shapeDIV) {
	var indexes = $(shapeDIV).attr("matchindex").split(',');
	indexes.splice(0,1);
	var currentGraphDiv = $(shapeDIV).parent().parent();
	$(currentGraphDiv).find(".tinyboard").css("opacity","0.1");
//	$(currentGraphDiv).find(".board_frequency").css('visibility','hidden');
	var canvas = currentGraphDiv.find('canvas');
	var direction = canvas.attr('direction');
	drawGraphLinesSpecificMatches(currentGraphDiv.attr('id'),canvas,direction,indexes);
	$.each(indexes, function(iMatchIndex,matchIndex) {
		var tempDIV = $(currentGraphDiv).find('div.tinyboard[matchindex*=",'+matchIndex+',"]');
		$(tempDIV).css("opacity","1.0");	// select all Div having matchindex of the index and set opacity 1.0
//		$(tempDIV).find(".board_frequency").css('visibility','show');
	});
	
//	$(shapeDIV).css("opacity","1.0");
}
function dehighlightPath() {
	$(".tinyboard").css("opacity","1.0");
//	$(".board_frequency").css('visibility','hidden');
	$.each([p1,p2], function(iP, firstMovePlayer) {	
		var currentGraphDiv = $("#matches_"+firstMovePlayer);
		var canvas = currentGraphDiv.find('canvas');
		var direction = canvas.attr('direction');
		drawGraphLinesAll("#"+currentGraphDiv.attr('id'),canvas,direction);
	});
//	$(shapeDIV).css("opacity","1.0");	
}


//function drawGraph_vertical(result,selectedMatches,targetDivID) {
//	var graph = result.graph;
//	var cM = result.connectivity;
//	// find max, min position (integer)
//	var min_pos = 100000;	var max_pos = -100000;
//	for(var rI in graph) 
//		for(var nodeI in graph[rI]) {
//			if (graph[rI][nodeI]['position'] <min_pos) min_pos = graph[rI][nodeI]['position'];
//			if (graph[rI][nodeI]['position'] >max_pos) max_pos = graph[rI][nodeI]['position'];
//		}
//
////			 vertical flow
//	var gap = max_pos-min_pos;
//	var interval = $(targetDivID).width()/(gap+1);
//	if (interval<$(".tinyboard:first").width()) interval = $(".tinyboard:first").width()+10;
//	var hor_offset = (-1*min_pos*interval) + (interval/2);
//	
//	// place tinyboard representation
//	$(graph).each(function(iR,round){
//		var columnDiv = $("<div id='graph_round_"+iR+"' class='matchGraphRound clearfix'></div>");
//		$.each(round, function(boardShape,data) { // iterate clusters
////			var parentShape = data.connection.up[0];
//			var sampleMatch = selectedMatches[data['matches'][0]];  // use the first game in the list, generate representative miniboard
//			var matchBoard = createMiniBoard_singleRound(sampleMatch,iR);
//			$(matchBoard).removeClass('miniboard');  $(matchBoard).addClass('miniboard_graph');
//			$(matchBoard).css("left",data.position*interval+hor_offset);
//			$(matchBoard).css("top",0);
//			$(matchBoard).attr("shape",boardShape.replace(/"/gi,''));
//			var listOfMatches = data.matches.length;
//			$(matchBoard).append("<div class='board_frequency' style='position:absolute; bottom:0; left:0; margin-bottom:-15px; font-size:9px;'>"+listOfMatches+"</div>")
//			$(columnDiv).append(matchBoard);
//		});
//		$(targetDivID).append(columnDiv);
//	});
//	// draw lines
//	$(targetDivID).prepend("<canvas id='canvas_"+targetDivID.replace("#","")+"' style='position:absolute; top:0px; left:0px;' width='"+$(targetDivID).width()+"px' height='"+$(targetDivID).height()+"px'></canvas>");
//	var canvas = $("#canvas_"+targetDivID.replace("#",""));
//	ctx = $(canvas)[0].getContext("2d");
//	ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);	
//	$.each(cM, function(iR, round) {
//			$.each(round.downward, function(shapeA, connectedShapesB){
//				$.each(connectedShapesB, function(iB, shapeB) {
//					var sA = $(targetDivID+' div[shape="'+shapeA.replace(/"/gi,'')+'"]');
//					var sB = $(targetDivID+' div[shape="'+shapeB.replace(/"/gi,'')+'"]');
//					var offsetA = sA.offset();
//					var offsetB = sB.offset();
//					var widthA = $(targetDivID+' div[shape="'+sA+'"]').width();
//					var widthB = $(targetDivID+' div[shape="'+sA+'"]').width();
//					var gap = 15; // how strong bezierCurve tends to go straight
//					var startPoint = {'x':sA.offset().left+sA.width()/2-$(canvas).offset().left, 'y':sA.offset().top+sA.height()-$(canvas).offset().top};
//					var endPoint = {'x':sB.offset().left+sB.width()/2-$(canvas).offset().left, 'y':sB.offset().top-$(canvas).offset().top};
//					var ctrA = {'x':startPoint.x,'y':startPoint.y+gap};
//					var ctrB = {'x':endPoint.x, 'y':endPoint.y-gap};
//					ctx.beginPath();
//					ctx.moveTo(startPoint.x,startPoint.y);
//					ctx.bezierCurveTo(ctrA.x,ctrA.y,ctrB.x,ctrB.y,endPoint.x,endPoint.y);
//					if(parseInt($(sA).find(".board_frequency").text()) < parseInt($(sB).find(".board_frequency").text())) {
//						ctx.lineWidth = 1+parseInt($(sA).find(".board_frequency").text())/2;
//					} else {
//						ctx.lineWidth = 1+parseInt($(sB).find(".board_frequency").text())/2;
//					}
//				    ctx.strokeStyle ="#eee"; // line color
//				    ctx.stroke();
//				});
//			});
//	});
//}


   // colorize user class with matching colors
   function colorizeUser() {
        $("span.user").each(function(i,d) {
      var userName = $(this).text();
      var colorName = playerColor[userName];
      $(this).css("background-color",getColor(colorName,0.3));      
        }); 
   }

   
   
   // FUNCTIONS FOR GETTING WINNING CELLS //
isFull = function() {
       for (var i = 0; i < 3; i++)
		for (var j =0; j<3;j++)
		    if (board[i][j] == 0)
		        return false;
       return true;
}
checkCol =function(x,board) {
       if (board[x][0] == board[x][1] && (board[x][0] == board[x][2]) && (board[x][0] != 0)) 
       	return {'winner':board[x][0],'pattern':[[x,0],[x,1],[x,2]]};
       else return false;
}
   
   checkRow = function(y,board) {
       if (board[0][y] == board[1][y] && (board[0][y] == board[2][y]) && (board[0][y] != 0))
    	   return {'winner':board[0][y],'pattern':[[0,y],[1,y],[2,y]]};
       else return false;
   }
   
   checkDiag1 = function(board)  {
       if (board[0][0] != 0 && board[0][0] == board[1][1] && board[0][0] == board[2][2]) 
    	   return {'winner':board[0][0],'pattern':[[0,0],[1,1],[2,2]]};
       else return false;
       
   }
   checkDiag2 = function(board) {
       if (board[2][0] != 0 && board[1][1] == board[2][0] && board[0][2] == board[2][0]) 
    	   return {'winner':board[2][0],'pattern':[[2,0],[1,1],[0,2]]};
       else return false;
   }
function findWinningCells(board) {
       /* Check the top row */
       var result = false;
       for (var i=0; i < 3; i++) {
           result = checkRow(i,board);
           if (result != false)
               return result;
           result = checkCol(i,board);
           if (result != false)
               return result;
       }
       result = checkDiag1(board);
       if (result != false)
           return result;
       result = checkDiag2(board);
       if (result != false)
           return result;
       return false;
}
   
$(document).ready( function() {
	memberList = new MemberList();
	memberList.init("#memberListDIV");
	currentMode = 'graph_horizontal';
	if(p1=="Guest") {
		$("#welcome").append("Welcome, Guest!  You need to <a href='javascript:openSignIn();'>log in</a> to play matches with others.");
	} else {
		showUserAI(p1,"userInfo");
		$("#welcome").append("Welcome, "+p1+"! Select an opponent to play matches.");
		if(p2!="") {	
	   		init(p1,p2); 
	   		runMatch(p1,p2);
		}
	}
	$(".header #header_button_match").addClass("currentMode");

});
