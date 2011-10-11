

function get(name) { return localStorage.getItem(name); }


/*
	Game object
*/
function TicTacToe() {
	// this.p1 = 'human'; 			  
	// this.p2 = 'computer';			
	this.width=3; 
	this.height=3;  // initial dimension of board
	var turn;  		// whose turn it is now --> this.p1 or this.p2 
	var started; 	// true when playing game is on
	var conversationState; 	// 
	this.history = [];	// pop in/out current board state
	this.strategySet = [
						{'name':"Win",'code':"takeWin",'tooltip':'Take a cell completing three of my stones in a row/column/diagonal','enabled':true},
						{'name':"Block Win",'code':"takeBlockWin",'tooltip':"Take a cell of the opponent's winning position", 'enabled':false},
						{'name':"Take Center",'code':"takeCenter",'tooltip':"Take the center cell",'enabled':false},
						{'name':"Take Any Corner",'code':"takeAnyCorner",'tooltip':"Take any corner",'enabled':false},
						{'name':"Take Any Side",'code':"takeAnySide",'tooltip':"Take any non-corner cells on the side.",'enabled':false},
						{'name':"Random Move",'code':"takeRandom",'tooltip':"Take any empty cell.",'enabled':true},
						{'name':"Take OppositeCorner",'code':"takeOppositeCorner",'tooltip':"Take a corner cell if its opposite corner is occupied by another player",'enabled':false}
					];

 this.turn = 'p1';
 this.started = false;    
 this.board = setupBoard(this.width, this.height);
  

	/* INIT */

    function setupBoard(col, row) {
        var b = new Array();
        for (var i = 0; i < row; i++) {
            b.push(new Array(col));
        }
        return b;
    }



	/* BASIC FUNCTIONS */

    this.getTurn = function () {   	return this.turn			};
    this.historyPush = function(b,loc,t) {
    	this.history.push({'board':this.cloneBoard(b), 'loc':loc, 'turn':this.turn});
    }

	
	this.flip = function(player) {
		if (player=="p1") return "p2"
		else return "p1"
	}
	this.getBoard = function () {     return this.board;	  }
	this.cloneBoard = function(b) {
		var nb = setupBoard(this.width,this.height);
		for(var i=0;i<this.width;i++) {
			for (var j=0;j<this.height;j++) {
				nb[i][j] = b[i][j];
			}
		}
		return nb;
	}
	
	this.historyPush(this.board,undefined,undefined); // store current board and turn in history array        
 
 	this.updateRule = function() {
 		var user_id = $("#user_id").val();
 		var game_id = 'tictactoe';
 		var strategy = JSON.stringify(this.getEnabledStrategy());
 		$.get('updateRule.php',
 			{ 	user_id: user_id, 
 				game_id: game_id,
 				strategy: strategy 
 			}, function(response) {
 				alert(response);
 			}	
 		);
 	}
 
 	this.resumeAt = function(step) {
 		if (step>=this.history.length-1) {
 			alert('history out of bound');	
 		} else {
 			nB = this.history[step];
 			this.board = nB['board'];
 			if(nB['turn']=='p1') this.turn = 'p2';
 			else this.turn = 'p1';
 			// this.turn = nB['turn'];
 			this.history = this.history.slice(0,step);
 		}
 	}
	
    this.move = function(i, j, t) {
        if (this.turn != t) {
        	console.log("player turn doesn't match!" + t + "!=" + this.turn);	
        	return;
        } 
        if (this.board[i][j] != null) {
        	console.log("cannot move on occupied cell [" + i+","+j+"]");	
        	return;    	
        }
       	if (!started)   started = true;
        this.board[i][j] = this.turn;    
        this.historyPush(this.board,[i,j],t); // store current board and turn in history array        
        this.turn = this.flip(this.turn);
        return this.board[i][j];
    }

    
    this.isFull = function() {
        for (var i = 0; i < 3; i++)
			for (var j =0; j<3;j++)
			    if (this.board[i][j] == null)
			        return false;
        return true;
    }
    
	this.checkCol =function(x) {
        if (this.board[x][0] == this.board[x][1] && (this.board[x][0] == this.board[x][2]) && (this.board[x][0] != null)) 
        	return this.board[x][0];
        else return false;
    }
    
    this.checkRow = function(y) {
        if (this.board[0][y] == this.board[1][y] && (this.board[0][y] == this.board[2][y]) && (this.board[0][y] != null))
        	return this.board[0][y];
        else return false;
    }
    
    this.checkDiag1 = function()  {
        if (this.board[0][0] != null && this.board[0][0] == this.board[1][1] && this.board[0][0] == this.board[2][2]) 
        	return this.board[0][0];
        else return false;
        
    }
    
    this.checkDiag2 = function() {
        if (this.board[2][0] != null && this.board[1][1] == this.board[2][0] && this.board[0][2] == this.board[2][0]) 
        	return this.board[2][0];
        else return false;
    }
    
    this.checkForWinner = function() {
        /* Check the top row */
        var result = false;
        for (var i=0; i < 3; i++) {
            result = this.checkRow(i);
            if (result != false)
                return result;
            result = this.checkCol(i);
            if (result != false)
                return result;
        }
        result = this.checkDiag1();
        if (result != false)
            return result;
        result = this.checkDiag2();
        if (result != false)
            return result;
        return false;
    }
    
	this.analyzeMove = function(brd,player,userMoveLoc) {
		// check which strategies are matching with given brd,turn,loc
		matchingStrategy = [];
		for (key in this.strategySet) {
			st = this.strategySet[key];
			// console.log(st);
			//console("ana" + brd,player);
			result = this[st.code](brd,player);
			if (true /*result['success']==true*/) {
				for(i in result.loc) {
					l = result.loc[i];
					if(userMoveLoc[0]==l[0] && userMoveLoc[1]==l[1]) {
						matchingStrategy.push({'name':st.name,'code':st.code});
					}
					
				}				
			}
		}
		// console.log(matchingStrategy);
		return matchingStrategy;
	}
    this.restart = function() {
        this.turn = 'p1';
        this.board = setupBoard(this.width, this.height);
        this.history = [];
        this.historyPush(this.board,undefined,undefined); // store current board and turn in history array        
        this.started=false;
    }
    
    this.getStatus = function() {
        if (!this.started)
            return "New Game, player 1 to move";
        else if (this.turn == 'p1')
            return "player 1 to move";
        else
            return "player 2 to move";
        
    }
    
    this.getEnabledStrategy = function() {
    	enabledStrategy = [];
    	for (i in this.strategySet) {
    		st = this.strategySet[i];  // select one strategy one-by-one
    		if(st['enabled']==false) continue;  // if the strategy is not enabled, pass
    		else enabledStrategy.push(st);
    	}
    	return enabledStrategy;
    }
    
    this.getEnabledStrategy_name = function() {
    	enabledStrategy = [];
    	for (i in this.strategySet) {
    		st = this.strategySet[i];  // select one strategy one-by-one
    		if(st['enabled']==false) continue;  // if the strategy is not enabled, pass
    		else enabledStrategy.push(st['code']);
    	}
    	return enabledStrategy;
    }
    
    this.enableStrategy = function(code) {
    	for (i in this.strategySet) {
    		st = this.strategySet[i];
    		if(st['code']==code) {
    			if(st['enabled']) {
    				return false;
    			} else {
    				st['enabled']=true;
    				return true;	
    			}
    		}
    	}
    	return 
    }
    
    this.checkStrategyEnabled = function(code) {
    	for (i in this.strategySet) {
    		if(st['code']==code) {
    			return st['enabled'];
    		}
    	}
    }
    
    this.changeOrder = function(nameList) {
    	newStrategySet = [];  
    	// console.log(nameList);
    	for (ni in nameList) {
    		name = nameList[ni];
    		for(i in this.strategySet) {
    			st=this.strategySet[i];
    			if(st['name']==name) {
    				newStrategySet.push(st);
    			}
    		}
    	}
    	console.log(newStrategySet);
    	// add strategies not in the codeList (new strategy order)
    	for(si in this.strategySet) {
    		st = this.strategySet[si];
    		alreadyAdded = false;
    		for (ni in nameList) {
    			name = nameList[ni];
    			if (name==st['name']) alreadyAdded = true;
    		}
    		if (alreadyAdded==false) newStrategySet.push(st);
    	}
    	this.strategySet = newStrategySet;
    }
    
    this.findBestStrategy = function(brd,player,strategy) {
    	if (this.isFull()) {
    		return {'message':"Tie Game",'locList':undefined};
    	}
    	for (key in strategy) {
    		st = strategy[key];  // select one strategy one-by-one
    		if(st['enabled']==false) continue;  // if the strategy is not enabled, pass
    		result = this[st.code](brd,player); // try the strategy on current board
    		if (result['success']==true)  {
    			bestStrategy = {'message':st.name,'locList':result.loc};
    			return bestStrategy;	// return the first strategy matched. d'nt try the rest
    		}
    	}
		bestStrategy = {'message':'no strategy found','locList':undefined};
		return bestStrategy;
    }
    
    
    
    
    
	/* STRATEGIES */
    this.takeWin = function(brd,player) {
		var result = new Object();		
		result['success']=false;
		result['loc'] = [];		// one strategy can generate multiple locations
        // Check diagonals for win
        var combos = [
            [[0,0],[1,1],[2,2]],
            [[0,2],[1,1], [2,0]], 
            
            [[0,0], [0,1], [0,2]], 
            [[1,0], [1,1], [1,2]], 
            [[2,0], [2,1], [2,2]], 
            
            [[0,0], [1,0], [2,0]], 
            [[0,1], [1,1], [2,1]],
            [[0,2], [1,2], [2,2]],         
        ];
        
        for (var  i in combos) {
            var positions = combos[i];
            var open = null;
            var count = 0;
            for (var pos in positions) {
                var move = positions[pos];
                var x = move[0];
                var y = move[1];
                //console.log(brd, player);
                if (brd[x][y] == player)
                    count++;
                else if (!brd[x][y]) 
                    open = move;
            }
            
            if (count == 2 && open) {
				result['success']=true;
				result['loc'].push(open);	
				// alert(result['loc']);
				//return result;
            }
        }
        
		return result;
        
    }
    this.takeBlockWin = function(brd,player) {
		var result = new Object();
		result['success']=false;
		result['loc'] = [];		
        var origTurn = player
        // Flip turn
        player =  this.flip(player);;
        var willWin = this.takeWin(brd,player);
        // Restore original turn
        player = origTurn;
		if (willWin['success']) {
			return willWin;		
		} else {
			// no winning condition for opponent
			result['success']=false;
			return result;
		}		
    }
    this.takeCenter = function(brd,player) {
    	// alert("take Center");
		var result = new Object();
		result['success']=false;  
		result['loc'] = [];	
		// console.log('check takecenter' + brd[1][1]);
        if (!brd[1][1]) {
			result['success']=true;
			result['loc'].push([1,1]);	
			// alert(result['loc']);
			return result;
        } else {
        	// alert('center occupied');
			result['success']=false;	
			return result;
		}
    }
	this.takeAnyCorner = function(brd,player) {
		var result = new Object();	
		result['success']=false;
		result['loc'] = [];	
		var moves = [[0,0], [2,2], [2,0], [0, 2]];
		for (var i=0;i<moves.length; i++) {
           var move=moves[i];
           var x = move[0];
           var y = move[1];
           
           if (!brd[x][y]) {
               // this.move(x,y);
				result['success']=true;
				result['loc'].push([x, y]);	
				//return result;
           }
		}
		// result['success']=false;
		return result;
    }
    this.takeAnySide = function(brd,player) {
        var result = new Object();
        result['success']=false;
		result['loc'] = [];	
        var moves = [[0,1], [1,0], [1,2], [2,1]];
        for (var i=0; i<moves.length;i++) {
            var pt = moves[i];
            if (!brd[pt[0]][pt[1]]) {
                result['success']=true;
				result['loc'].push([pt[0],pt[1]]);	
            }
        }
        return result;
    }
    this.takeRandom = function(brd,player) {	
		var result = new Object();	
		result['success']=false;
		result['loc'] = [];
		for(var i=0;i<this.width;i++) {
			for (var j=0;j<this.height;j++) {
				if(!brd[i][j]) {
					result['success']=true;
					result['loc'].push([i,j]);
				}
			}
		}	
		return result;
    }
	this.stopL = function (brd,player) {
	    // block corner trap strategy : two adj. sides are occupied by opponent, 
	    //								and in-between corner is empty.
	    // 								if I don't take the corner, opp. will take it. 
    	var result = new Object();	
 		result['success']=false;
		result['loc'] = [];	
        var oppTurn =  this.flip(player);
        if (!brd[0][0] && brd[0][1] == oppTurn && brd[1][0] == oppTurn)
			result['success']=true;
			result['loc'].push([0,0]);	
			// return result;		
        if (!brd[0][2] && brd[0][1] == oppTurn && brd[1][2] == oppTurn)
			result['success']=true;
			result['loc'].push([0,2]);	
			// return result;	
        if (!brd[2][0] && brd[1][0] == oppTurn && brd[2][1] == oppTurn)
			result['success']=true;
			result['loc'].push([2,0]);	
			// return result;
        if (!brd[2][2] && (brd[1][2] == oppTurn) && (brd[2][1] == oppTurn))
			result['success']=true;
			result['loc'].push([2,2]);	
			// return result;
        return result;
    }
    this.takeOppositeCorner = function(brd,player) {
		var result = new Object();	
   		result['success']=false;
		result['loc'] = [];	
        var pairs = [ [[0,0], [2,2]], [[0,2], [2,0]] ];  // for each pair of opposing corners
        for (var i=0;i<pairs.length; i++) {		
              var pair=pairs[i];	
              var pt1 = pair[0];	// x
              var pt2 = pair[1];	// y
              var ptOccupied1 = brd[pt1[0]][pt1[1]]; 
              var ptOccupied2 = brd[pt2[0]][pt2[1]];
              
              // if one corner is occupied, take another one. 
              if (ptOccupied1 && !ptOccupied2) { 
				result['success']=true;
				result['loc'].push(pt2);	
				// return result;
              }
              else if (ptOccupied2 && !ptOccupied1) {
				result['success']=true;
				result['loc'].push(pt1);	
				// return result;
              }
                
		}
		// result['success']=false;
		return result;
    }
}

// //
// var TTT_WIN = "Win";
// var TTT_CENTER = "Take Center";
// var TTT_CORNER = "Take any corner";
// var TTT_OPP_CORNER = "Take opposite corner";
// var TTT_BLOCK_WIN = "Block Win";
// var TTT_TAKE_SIDE = "Take any side";
// var TTT_RANDOM = "Random Move";
// var TTT_BLOCK_CORNER_TRAP = "Block Corner Trap";
