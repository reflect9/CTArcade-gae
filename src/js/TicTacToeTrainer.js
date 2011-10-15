/*
	This is a model that represents TicTacToe game status for training purpose
	There's only one AI used here - and user play tictactoe with it.
	And this model can have a list of AI's strategies but cannot run them on client-side for security reason.   
	For each move of AI, this model queries(by sending current board) to the server and retrieves 
		a list of all the AI's strategies(code, title, applicability and list of locations) in the order of priority,
	For each move of user, this model queries(by sending current board and user's move) to the server and gets
		a list of all the public strategies(code, title, whether AI knows or not) in random order. 
	When user confirms a new strategy is used for his move, 
		it sends a query (the rule's code) to update AI's rule set
	
	Each game done here is not recorded.  
		 	
oct13 2011, by Tak
*/


function TicTacToeTrainer() {		
	


//  NOW ALL THE RULES ARE STORED ON THE SERVER
//	this.strategySet = [
//						{'name':"Win",'code':"takeWin",'tooltip':'Take a cell completing three of my stones in a row/column/diagonal','enabled':true},
//						{'name':"Block Win",'code':"takeBlockWin",'tooltip':"Take a cell of the opponent's winning position", 'enabled':false},
//						{'name':"Take Center",'code':"takeCenter",'tooltip':"Take the center cell",'enabled':false},
//						{'name':"Take Any Corner",'code':"takeAnyCorner",'tooltip':"Take any corner",'enabled':false},
//						{'name':"Take Any Side",'code':"takeAnySide",'tooltip':"Take any non-corner cells on the side.",'enabled':false},
//						{'name':"Random Move",'code':"takeRandom",'tooltip':"Take any empty cell.",'enabled':true},
//						{'name':"Take OppositeCorner",'code':"takeOppositeCorner",'tooltip':"Take a corner cell if its opposite corner is occupied by another player",'enabled':false}
//					];


	/* BASIC FUNCTIONS */
    this.createEmptyBoard = function (col, row) {
        var b = new Array();
        for (var i = 0; i < row; i++) {
            var r = new Array();
            for (var j=0;j<col;j++) {
            	r.push(0);
            }
            b.push(r);
        }
        return b;
    }
    
	this.flip = function(player) {
		if (player==this.p1) return this.p2
		else return this.p1
	}
	
	this.cloneBoard = function(b) {
		var nb = this.createEmptyBoard(this.width,this.height);
		for(var i=0;i<this.width;i++) {
			for (var j=0;j<this.height;j++) {
				nb[i][j] = b[i][j];
			}
		}
		return nb;
	}
	
    this.restart = function() {
        this.firstTurn = this.flip(this.firstTurn);
    	this.turn = this.firstTurn;
        this.board = this.createEmptyBoard(this.width, this.height);
        this.history = [];
        this.history.push({'board':this.cloneBoard(this.board), 'loc':undefined, 'turn':undefined});
        this.getStrategy(this.user,function(response){
        	this.strategy = response.data;
        });
        this.started=false;
    }

//  AS THE SERVER HAS ALL THE RULE OF THE USER, trainer doesn't update all the strategies at once,
//	this.updateRule = function() {
//		// 
//		
// 		var user_id = this.p1;
// 		var game_id = 'tictactoe';
// 		var strategy = JSON.stringify(this.getEnabledStrategy());
// 		$.get('updateRule',
// 			{ 	player: user_id, 
// 				game: game_id,
// 				strategy: strategy 
// 			}, function(response) {
// 				alert(response);
// 			}	
// 		);
// 	}
 
 	this.resumeAt = function(step) {
 		if (step>=this.history.length-1) {
 			alert('history out of bound');	
 		} else {
 			resumePoint = this.history[step];
 			this.board = resumePoint['board'];
 			this.turn = this.flip(resumePoint['turn']); // turn of each history is the one who made the previous move. 
 			this.history = this.history.slice(0,step); // cut history after the resume point
 		}
 	}
	
 	// move function applies to both user and AI's move - it updates board data and history
    this.move = function(i, j, t) {
    
        if (this.turn != t) {
        	console.log("player turn doesn't match!" + t + "!=" + this.turn);	
        	return;
        } 
        if (this.board[i][j] != 0) {
        	console.log("cannot move on occupied cell [" + i+","+j+"]");	
        	return;    	
        }
       	if (this.started==false)   this.started = true;
        if (this.p1==this.turn) {
        	this.board[i][j]='p1';
        } else {
        	this.board[i][j]='p2';
        }
        this.history.push({'board':this.cloneBoard(this.board), 'loc':[i,j], 'turn':t});
        this.turn = this.flip(this.turn);
        return this.board[i][j];
    }

    // FUNCTIONS FOR CHECKING CURRENT BOARD STATE //
    
    this.isFull = function() {
        for (var i = 0; i < 3; i++)
			for (var j =0; j<3;j++)
			    if (this.board[i][j] == 0)
			        return false;
        return true;
    }
	this.checkCol =function(x) {
        if (this.board[x][0] == this.board[x][1] && (this.board[x][0] == this.board[x][2]) && (this.board[x][0] != 0)) 
        	return this.board[x][0];
        else return false;
    }
    
    this.checkRow = function(y) {
        if (this.board[0][y] == this.board[1][y] && (this.board[0][y] == this.board[2][y]) && (this.board[0][y] != 0))
        	return this.board[0][y];
        else return false;
    }
    
    this.checkDiag1 = function()  {
        if (this.board[0][0] != 0 && this.board[0][0] == this.board[1][1] && this.board[0][0] == this.board[2][2]) 
        	return this.board[0][0];
        else return false;
        
    }
    
    this.checkDiag2 = function() {
        if (this.board[2][0] != 0 && this.board[1][1] == this.board[2][0] && this.board[0][2] == this.board[2][0]) 
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
    
    
    
//	this.analyzeMove = function(brd,player,userMoveLoc) {
//		// to check which strategies are matching with given brd,turn,loc
// 		// query the server.  The response is a list of strategies.
//	
//		
//		
//// USE SERVER-SIDE FUNCTION INSTEAD		
////		matchingStrategy = [];
////		for (key in this.strategySet) {
////			st = this.strategySet[key];
////			// console.log(st);
////			//console("ana" + brd,player);
////			result = this[st.code](brd,player);
////			if (true /*result['success']==true*/) {
////				for(i in result.loc) {
////					l = result.loc[i];
////					if(userMoveLoc[0]==l[0] && userMoveLoc[1]==l[1]) {
////						matchingStrategy.push({'name':st.name,'code':st.code});
////					}
////					
////				}				
////			}
////		}
//		// console.log(matchingStrategy);
//		return matchingStrategy;
//	}
	
    ////////////////////////////////////////////
    // FUNCTIONS THAT COMMUNICATE WITH SERVER //
    ////////////////////////////////////////////
    
    this.getStrategy = function(userName,callBack) {
    	$.ajax({
    		type : "GET",
    		url: "/ajaxTrainer",
    		async: false,	// browser will hold until it gets the response from server
    		data: 	{	action: 'getStrategy',
    					player: userName,
    					game: this.gameTitle
    				},
    		success: function(response) {
    			callBack(response);
    		}
    	});
    }
    this.getPublicStrategyDict = function(callBack) {
    	$.ajax({
    		type : "GET",
    		url: '/ajaxTrainer',
    		async: true,
    		data: {  	action: 'getPublicStrategyDict',
    					game: this.gameTitle 
    				},
    		success: function(response) {
    			callBack(response);
    		}
    	});
    }
    // ask server to run all the strategies the AI knows one-by-one and retrieve the result
    this.findBestStrategy = function(board,turn,callBack) {
    	$.ajax({
    		type : "GET",
    		url: "/ajaxTrainer",
    		async: true,
    		data: { action: 'findBestStrategy',
    				user:this.user,
    				player1: this.p1,
    				player2: this.p2,
    				game : this.gameTitle,
    				board: JSON.stringify(board),
    				turn: turn
    				},
    		success: function(response) {
    			callBack(response);
    		}
    	})
    }
    
    // ask server to infer which strategy (among all the public rules) might be the one user has used.
	this.findMatchingStrategy = function(brd,turn,userMoveLoc,callBack)  {  
		// matchingRules : {name:text, code:text, locList:array of [x,y]}
		$.ajax({
			type : "GET",
			url: "/ajaxTrainer",
			async: false,
			data: 	{ 	action: 'findMatchingStrategy',
						user: this.user,
						player1: this.p1,
						player2: this.p2,
						turn: turn, 
 	 					game: this.gameTitle,
 	 					board: JSON.stringify(brd),
 	 					loc: JSON.stringify(userMoveLoc)
 	 				},
 	 		success: function(response) {
// 	 				alert(response);
 	 				callBack(response);	
 	 		
//					cons.clear();
//					cons.appendMessage("Is your last move based on one of these rules?")
//					$(matchingRules).each( function(i,rule) {
//						alreadyKnown = game.checkStrategyEnabled(rule['code']);
//						$('<div></div>',{
//							id : 'mR_'+rule['code'],
//							style : 'margin: 7px 5px 7px 25px; font-size:1.3em; cursor:pointer;'
//						})	.text(rule['name'])
//							.click(function() { enableStrategy(rule['code']);})
//							.appendTo($(cons.target));
//					});
//					cons.appendButton("CONTINUE","$(this).hide(); computerMove()");
 	 		}
		});
	}  
	
	// it just tells server to add a rule(by code) to user's AI's strategy
    this.enableStrategy = function(userName,code) {
    	$.ajax({
    		type : "GET",
    		url: "/ajaxTrainer",
    		async: true,
    		data: 	{ 	action: 'enableStrategy',
    					player: userName,
    					game: this.gameTitle,
    					strategyToEnable : code
    				},
    		success: function(response) {
//    					alert(response);
    					if (response=='True') {
//    						alert(code);
//    						alert($(cons.target).find("#mR_"+code).html());
    						$(cons.target).find("#mR_"+code).append("<span style='font-size:12px; color:#955;'> I learned this new rule!</span>");
    					} else if(response=='False') {
    						$(cons.target).find("#mR_"+code).append("<span style='font-size:12px; color:#595;'> Thanks! But I knew it already.</span>");
    					}
    				}
    	
    	});
    }
    
    
    this.changeOrder = function(nameList) {
    	$.ajax({
    		type : "GET",
    		url: "/ajaxTrainer",
    		async: true,
    		data: 	{ 	action: 'changeOrder',
    					player: this.user,
    					game: this.gameTitle,
    					newStrategy : JSON.stringify(nameList)
    				},
//    		success: function(response) {
//    					alert(response);
//    					return JSON.parse(response);
//    				}
    	});
    }
	
    this.assignStrategy = function(data) {
//    	alert(data);
    	this.strategy = (JSON.parse(data)).data;
    }
    this.assignStrategyDict = function(data) {
//    	alert(data);
    	this.publicStrategyDict = JSON.parse(data);
    }
    
    
	this.init = function(user) {
		this.user = user;
		this.firstTurn = user;
		this.gameTitle = 'tictactoe';
		this.p1 = user;
		this.p2 = user + "'s AI";
		this.width=3; 
		this.height=3;  
		var started; 	// true when playing game is on
		
		this.publicStrategyDict = {};  // list of code -> other information of all the public codes for the game
		this.strategy = [];  // list of strategy codes that this user's AI knows
		this.history = [];	// pop in/out current board state for undo/redo moves
	
		this.turn = this.p1;
		this.started = true;    
		this.board = this.createEmptyBoard(this.width, this.height);	
//		alert(this);
//		alert(this.flip(this.turn));
		this.history.push({'board':this.cloneBoard(this.board), 'loc':undefined, 'turn':undefined});
        this.getStrategy(this.user, $.proxy(this.assignStrategy,this)); // $.proxy(function,scope) : will force the function to run within the scope 
        this.getPublicStrategyDict($.proxy(this.assignStrategyDict,this));
	}
    
}