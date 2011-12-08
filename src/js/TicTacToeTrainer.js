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
	this.flipTurn = function(player) {
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
        this.firstTurn = this.flipTurn(this.firstTurn);
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
 	this.resumeFromHistoryMode = function(step) {
 		if (step>=this.history.length-1) {
 			alert('history out of bound');	
 		} else {
 			resumePoint = this.history[step];
 			this.board = resumePoint['board'];
 			this.turn = this.flipTurn(resumePoint['turn']); // turn of each history is the one who made the previous move. 
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
        	this.board[i][j]=this.p1;
        } else {
        	this.board[i][j]=this.p2;
        }
        this.history.push({'board':this.cloneBoard(this.board), 'loc':[i,j], 'turn':t});
        this.turn = this.flipTurn(this.turn);
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
    		cache: false,
    		data: 	{	action: 'getStrategy',
    					player: userName,
    					game: this.gameTitle
    				},
    		success: function(response) {
    			callBack(response);
    		}
    	});
    }
    this.getPublicStrategyDict = function(callBack) {	// list of all possible public rules
    	$.ajax({
    		type : "GET",
    		url: '/ajaxTrainer',
    		async: true,
    		cache: false,
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
    		cache: false,
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
 	 				callBack(response);	
 	 		}
		});
	}  
	
	// it just tells server to add a rule(by code) to user's AI's strategy
    this.enableStrategy = function(userName,key) {
    	$.ajax({
    		type : "GET",
    		url: "/ajaxTrainer",
    		async: true,
    		cache: false,
    		data: 	{ 	action: 'enableStrategy',
    					player: userName,
    					game: this.gameTitle,
    					strategyToEnable : key
    				},
    		success: function(response) {
//    					alert(response);
    					if (response=='True') {
    						$(cons.target).find("#mR_"+key).append("<span style='font-size:12px; color:#955;'> I learned this new rule!</span>");
    					} else if(response=='False') {
    						$(cons.target).find("#mR_"+key).append("<span style='font-size:12px; color:#595;'> Thanks! But I knew it already.</span>");
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
    	});
    }
    // callback functions for ajax calls
    this.setStrategy = function(data) {
    	this.strategy = JSON.parse(data);
    	this.strategyKeyList = [];
    	for (i in this.strategy)
    		this.strategyKeyList.push(this.strategy[i].key);

    }
    this.setPublicStrategyDict = function(data) {
    	this.publicStrategyDict = JSON.parse(data);
    }
    //
	this.makeNewStrategy = function(board, turn, ruleBoard, name, desc,
									translationInvariant, flipping, rowPermutation,
									columnPermutation,rotation){
		$.ajax({
			type : "GET",
			url : "/ajaxTrainer",
			async : true,
			data : 	{	action : 'makeNewStrategy',
						user: this.user,
						player1: this.p1,
						player2: this.p2,
						turn: turn, 
 	 					game: this.gameTitle,
 	 					board: JSON.stringify(board),
						ruleBoard : JSON.stringify(ruleBoard),
						title : name,
						desc : desc,
						translationInvariant : translationInvariant,
						flipping : flipping,
						rowPermutation : rowPermutation,
						columnPermutation : columnPermutation,
						rotation : rotation				
					}
		});
	}
	this.init = function(p1,p2) {
		this.user = p1;
		this.firstTurn = p1;
		this.gameTitle = 'tictactoe';
		this.p1 = p1;
		this.p2 = p2;
		this.width=3; 
		this.height=3;  
		var started; 	// true when playing game is on
		
		this.publicStrategyDict = {};  // list of code -> other information of all the public codes for the game
		this.strategy = [];  // list of rules that this user's AI knows
		this.strategyKeyList = [];  // list of keys only
		this.history = [];	// pop in/out current board state for undo/redo moves
	
		this.turn = this.p1;
		this.started = true;    
		this.board = this.createEmptyBoard(this.width, this.height);	
		this.history.push({'board':this.cloneBoard(this.board), 'loc':undefined, 'turn':undefined});
        this.getStrategy(this.user, $.proxy(this.setStrategy,this)); // $.proxy(function,scope) : will force the function to run within the scope 
        this.getPublicStrategyDict($.proxy(this.setPublicStrategyDict,this));
	}


	
} // end of TicTacToeTrainer