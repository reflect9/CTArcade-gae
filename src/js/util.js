var color = {
		"paleGreen" : "rgb(43, 140, 190)",
		"violetPink" : "rgb(197, 27, 138)"
		
};

function getColor(name,alpha) {
	if (name==undefined) return "rgb(200,200,200)";
	var c = "rgb(30,30,30)";
	try {
		c = color[name];
	} catch(err) {
		c = "rgb(30,30,30)";
	}
	return c.replace("rgb","rgba").replace(")",","+alpha+")");
}

function botIconOffset(botKind) {
	var num = parseInt(botKind.replace('bot_',""));
	var x_offset_org = -63;   var y_offset_org = -66;
    var x_offset_step = (117-63);
    var x_offset = (x_offset_org-(x_offset_step*num));
    var background_position =  x_offset + "px " + y_offset_org + "px";
	return background_position;
}


function showModal(target,modalType,position,contentHTML) {
	var targetHandle = $(target);
	$(target).parent().css('position','relative');
	var graymat = $("<div></div>",{
		style: '	position:absolute;\
					z-index: 999;\
					width: '+ targetHandle.width() +'px;\
					height: '+ targetHandle.height() +'px;\
					left: '+targetHandle.offset()['left']+'px;\
					top: '+targetHandle.offset()['top']+'px;'
	}).attr("class","grayMat").appendTo("html");
	graymat.click(function() {
		$(".grayMat").fadeOut().remove();
		$("#modal_message_wrapper").fadeOut().remove();
	});
	// create modal based on modalType
	if(modalType=='message') {
		var modal_message_wrapper = $("<div></div>",{
			class : 'modal_message_wrapper',
			style : '	position:absolute;\
						top:50%;\
						width:100%;\
						z-index:1001;\
				'
		}).appendTo(targetHandle);
		var modal_message = $("<div class='modal_message'></div>").appendTo(modal_message_wrapper);
		$(modal_message).html(contentHTML);
	}
	// fade out timer
	$(graymat).fadeOut("slow").remove();
	$(modal_message_wrapper).fadeOut("slow").remove();
}


/* get rotation, flip variations of n-by-n matrix */
function getBoardVariations(board) {
	var variations = [];
	// rotation variation
	variations.push(matrix_transform(board,'rotate_90'));
	variations.push(matrix_transform(matrix_transform(board,'rotate_90'),'rotate_90'));
	variations.push(matrix_transform(matrix_transform(matrix_transform(board,'rotate_90'),'rotate_90'),'rotate_90'));
	// flip variation
	$(variations).each(function(iB,b) {
		variations.push(matrix_transform(b,'flip_horizontal'));
	});
	$(variations).each(function(iB,b) {
		variations.push(matrix_transform(b,'flip_vertical'));
	});		
	return variations;
}

function matrix_transform(matrix,operation) {
	var rowNum = matrix.length;
	var colNum = matrix[0].length;
	var result_matrix = new Array(rowNum);
	for(var row=0;row<rowNum;row++) {
		result_matrix[row] = new Array(colNum);
		for (var col=0;col<colNum;col++) {
			if (operation=="rotate_90")
				result_matrix[row][col] = matrix[rowNum-col-1][row];
			else if(operation=="flip_horizontal") 
				result_matrix[row][col] = matrix[row][colNum-col-1];
			else if(operation=="flip_vertical") 
				result_matrix[row][col] = matrix[rowNum-row-1][col];
		}
	}
	return result_matrix;
}


//log in & sign up module
//function showLogIn() {
//	var blackMat = $("<DIV class='blackMat'></DIV>");
//	var logInDIV = $("<DIV id='logIn' class='panel_floating' style='position:absolute; z-index:1001; top:50%; left:50%; margin:-150px 0 0 -150px; width:300px; height:300px;'></DIV>");
//	$("body").append(blackMat);
//	$("body").append(logInDIV);
//	$("#logIn").append("<DIV class='button_close'></DIV>");
//	$('.button_close').click(function() {$(this).parent.remove();});
//	var html = "<DIV>Log In</DIV>"
//			+ "<form name='login' id='login_form' action='#'>"
//			+ 	"<div><span style='width:50px'>User name</span><input type='text' id='userID' name='id' size='20'/></div>"
//			+ 	"<div><span style='width:50px'>Password</span><input type='password' id='password' name='password' size='20'/></div>"
//			+	"<div style='text-align:center'><input type='submit' id='button_login' name='submit' value='log in'/></div>"
//			+ "</form>";
//	$("#logIn").append(html);
//	$("#button_login").click(function() {
//		var id = $("input#userID").val();
//		var password = $("input#password").val();
//		if (id=="" || password=="") { alert("id and password must be filled in."); return; }
//		var param = 'name=' + id + "&password=" + password;
//		$.get("LogIn",param,function(response) {
//			if(response.indexOf("You are now logged in ")!=-1) {
//				p1 = response.replace("You are now logged in as","");
//				$(".blackMat").remove();
//			} else {
//				$("#logIn").append("<DIV>"+response+"</DIV>");
//			}
//		});
//	});
//}





//Read a page's GET URL variables and return them as an associative array.
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
