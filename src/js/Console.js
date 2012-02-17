/*
 Console object controls all the message shown on target message board

*/

function Console() {
	var target;  // reference to the div where this console will control
	

	
	
	this.clear = function() {
		// delete everything in the target
		$(this.target).empty();
	}
	this.scrollDown = function() {
		// console.log("scrollDown");
		$(this.target).each(function() {
			var scrollHeight =Math.max(this.scrollHeight, this.clientHeight);
			var scrollTo = scrollHeight - this.clientHeight;
			$("this").animate({scrollTop: scrollTo});
		});
	}
	this.appendHTML = function(html,gotoBottom) {
//		var paragraphs = $(this.target).find('.paragraph');
//		if(!paragraphs.length) {
//			$(this.target).append("<div class='paragraph'>"+html+"</div>");
//		} 
		// append html at the bottom of the target contents
		$(this.target).append(html);
		// add click event as well
		// if (gotoBottom==true) 
			// t = setTimeout("cons.scrollDown()",1000);
		// // and scroll down	
//		this.scrollDown();
	}

	this.appendInstruction = function(message) {
		html = "<div class='instruction'>"+ message +"</div>";
		this.appendHTML(html,true);
	} 
	this.appendMessage = function(message) {
		html = "<div class='message'>"+ message +"</div>";
		this.appendHTML(html,true);
	} 
	this.appendMove = function(player,loc, html, board) {
		resultHTML = "<div class='move'>"+ html +"</div>";
		this.appendHTML(resultHtml,true);
	}
	this.appendButton = function(message,action) {
		resultHTML = "<div class='cons_action' onclick='"+ action +"'>"+ message + "</div>";
		this.appendHTML(resultHTML,true);
	}
	this.countMove = function() {
		return $(".move",this.target).length; 
	}
	this.getLastMove = function() {
		return $(".move:last",this.target);
	}
	this.getLast = function() {
		return $("div:last",this.target);
	}
	this.getList = function(filter) {
		// return an array of all the items in the target
	}
	

	
	
	this.init = function(t) {   // t must be ID of div
		this.target = $(t);

		// <br>We are now in TicTacToe trainer mode. <br> 
			// <b>AI: </b>I don't know much about playing TicTacToe. 
			// Before getting into the tournament, I need your guidance. <br>
			// To start, </div>
	}
	
	
}
