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


/* assuming that dA and dB (jquery selection) are within a same parent DIV, 
 * it creates a new canvas DIV and draw line connecting the center of dA and dB
 * */
function drawlinebetweenDIV(dA,dB) {
	var dParent = $(dA).parent();
	var dCanvas = $(dParent).append("<canvas style='z-index:1000; width:100%; height:100%; background-color:#e1d1d1;'></canvas>");
	var c = $(dCanvas)[0];
	var cxt = c.getContext("2d");
	cxt.moveTo(dA.position.left+(dA.position.width/2),dA.position.top+(dA.position.height/2));
	cxt.lineTo(dB.position.left+(dB.position.width/2),dB.position.top+(dB.position.height/2));
	cxt.stroke();
}

function testCanvas() {
	var $ctx = $( '<canvas />', {width:'100', height:'100'} );
	$(document).append($ctx);                                  
	c = $ctx[0].getContext('2d');   
	c.moveTo(10,10);
	c.lineTo(150,50);
	c.lineTo(10,50);
	c.stroke();
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

// subfunction for sugiyama algorithm
function extractConnectivity(rA,rB) {
	// create a dictionary of matchIndex to a nested-dictionary of boardShapes(key)
	var matchDic={'upward':{},'downward':{}};
	$.each(rA, function(shapeA,matchesA) {
		$.each(rB, function(shapeB,matchesB) {
			$.each(matchesA, function(i,matchNumA) {
				$.each(matchesB, function(j,matchNumB){
					if(matchNumA==matchNumB) {
						// connect shapeA and shapeB
//						alert(matchDic['upward']);
						if (!(shapeA in matchDic['downward'])) matchDic['downward'][shapeA]={};
						matchDic['downward'][shapeA][shapeB]=true;
						if (!(shapeB in matchDic['upward'])) matchDic['upward'][shapeB]={};
						matchDic['upward'][shapeB][shapeA]=true;					
					}
				});
			});
		});	
	});
	// convert object keys to array
	$.each(matchDic, function(i,eachDirectionObj) {
		$.each(eachDirectionObj, function(j,shape) {
			matchDic[i][j] = getKeysFromObject(shape);
		});
	});
	return matchDic;
}

function calculateEdgeCrossing(cM, orderA, orderB) {
	var totalCrossing = 0;
	$.each(orderA, function(iA, shapeA) {
		if (iA==orderA.length-1) return true; // dont need if shapeA is the right-most node in orderA 
		var shapesInBConnectedToA = cM['downward'][shapeA];
		$.each(shapesInBConnectedToA, function(iB, shapeB) {
			var indexShapeB = $.inArray(shapeB, orderB);
			// traverse next elements in orderA, checking their connection to orderB is crossing the orderShapeB
			for(var jA=iA+1;jA<orderA.length;jA++){
				var tempShapeA = orderA[jA];
				var shapesInBConnectedToTheOneNextToA = cM['downward'][tempShapeA];
				$.each(shapesInBConnectedToTheOneNextToA, function(jB, shapeBB) {
					var indexShapeBB = $.inArray(shapeBB, orderB);
					// if orderShapeBB is smaller than orderShapeB, then there's a crossing.
					if (indexShapeBB<indexShapeB) {
						totalCrossing++;
					}
				});
			}
		});
	});
	return totalCrossing;
}
function calculateBarycenter(cM,orderA,orderB) {
	var barycenter = {'a':{},'b':{}};
	$.each(orderA, function(iA,shapeA) {
		var bCshapeA = 0; var counter=0;
		if (cM['downward'][shapeA]==undefined) {
			bCshapeA = iA;
		} else {
			$.each(cM['downward'][shapeA], function(iB,shapeB) {
				var indexShapeB = $.inArray(shapeB,orderB);
				bCshapeA += indexShapeB;
				counter++;
			});
			bCshapeA = bCshapeA/counter;
		}
		barycenter['a'][shapeA]=bCshapeA;
	});
	$.each(orderB, function(iB,shapeB) {
		var bCshapeB = 0; var counter=0;
		if (cM['upward'][shapeB]==undefined) {
			bCshapeB=iB;
		} else{
			$.each(cM['upward'][shapeB], function(iA,shapeA) {
				var indexShapeA = $.inArray(shapeA,orderA);
				bCshapeB += indexShapeA;
				counter++;
			});
			bCshapeB = bCshapeB/counter;
		}
		barycenter['b'][shapeB]=bCshapeB;
	});
	return barycenter;
}
function getKeysFromObject(obj) {
	var keys = [];		for(var key in obj)	keys.push(key);		return keys; 		}
function getKeysSortedByValue(obj) {
	var tempArray = [];
	for (var key in obj) tempArray.push([key,obj[key]]);
	tempArray.sort(function() { return arguments[0][1]>arguments[1][1]});
	var output = [];
	for(node in tempArray) {
		output.push(tempArray[node][0]);
	}
	if(output.length!=tempArray.length) {
		alert("oh");
	}
	return output;
}
function getKeysSwappedBySameValue(obj) {
	var tempArray = [];  var resultArray=[];
	for (var key in obj) tempArray.push([key,obj[key]]);
	for (var i=0;i<tempArray.length-1;i++) {
		if(tempArray[i][1]==tempArray[i+1][1]) {
			var tt = tempArray[i];
			tempArray[i]=tempArray[i+1];
			tempArray[i+1]=tt;
		}
	}
	for (i in tempArray) {
		resultArray.push(tempArray[i][0]);
	}
	if(resultArray.length!=tempArray.length) {
		alert("oh");
	}
	return resultArray;
}
function reorder_barycenter(direction,upperOrder,lowerOrder,connectivity){
	// calculate barycenters
	var barycenters = calculateBarycenter(connectivity,upperOrder,lowerOrder);  // ['a','b']->shape
	if(direction=='down') {
		var newLowerOrder= getKeysSortedByValue(barycenters['b']);
		return newLowerOrder;
	} else {
		var newUpperOrder = getKeysSortedByValue(barycenters['a']);
		return newUpperOrder;
	}
}
function swap_eq_barycenter(direction,upperOrder,lowerOrder,connectivity) {
	var barycenters = calculateBarycenter(connectivity,upperOrder,lowerOrder);  // ['a','b']->shape
	if(direction=="down") return getKeysSwappedBySameValue(barycenters['b']);
	else return getKeysSwappedBySameValue(barycenters['a']);
}
function ordering_phase1(oM,cM){	// downward->upward run of reordering by barycenter
	for (var rI=0;rI<graph.length-1;rI++) {
		oM[rI+1] = reorder_barycenter('down',oM[rI],oM[rI+1],cM[rI]); // modify below row based on its barycenter of above row(oM[rI])
	}
	for (var rI=graph.length-2;rI>-1;rI--) {
		oM[rI] = reorder_barycenter('up',oM[rI],oM[rI+1],cM[rI]);  // upward
	}
	return oM;
}
function ordering_phase2(oM,cM) {
	var counter = 0;	var maxCounter = 3;	// try 5 times to maximum
	while(true) {
		var newOM = jQuery.extend(true, {}, oM);
		// downward run of swapping equal barycenter nodes
		for (var rI=0;rI<graph.length-1;rI++) {
			newOM[rI+1] = swap_eq_barycenter('down',oM[rI],oM[rI+1],cM[rI]);
		}
		if (JSON.stringify(newOM)!=JSON.stringify(oM)) {	// run phase1-downward to refresh
			for (var rI=0;rI<graph.length-1;rI++) {
				newOM[rI+1] = reorder_barycenter('down',newOM[rI],newOM[rI+1],cM[rI]); // modify below row based on its barycenter of above row(oM[rI])
			}
		}
		var newOM2 = jQuery.extend(true, {}, newOM);
		// upward run
		for (var rI=graph.length-2;rI>-1;rI--) {
			newOM2[rI] = swap_eq_barycenter('up',newOM2[rI],newOM2[rI+1],cM[rI]);
		}
		if (JSON.stringify(newOM2)!=JSON.stringify(newOM)) {	// run phase1-downward to refresh
			for (var rI=0;rI<graph.length-1;rI++) {
				newOM2[rI+1] = reorder_barycenter('down',newOM2[rI],newOM2[rI+1],cM[rI]); // modify below row based on its barycenter of above row(oM[rI])
			}
		}
		
		// check if there's things to be sorted with barycenter?  if yes, then run again from phase 1
		if (JSON.stringify(newOM2)==JSON.stringify(oM)) return oM;
		if (counter<maxCounter) counter++;
		else return newOM2;
		oM = jQuery.extend(true, {}, newOM2);
	}
}

// hierarchical graph layout algorithm
// input: graph > [{[[0,0,"ben"][][]]:listOfMatches}, round2,..]
// output: [{[shapeofBoard]:{position:{x,y},matches}}, round2, ...]
function sugiyama(graph) {
	var cM = []; 	// connectivity;  cM[1] = r1 key->[r2 keys] 
	var oM = [];	// horizontal order; oM[1] := array of keys(shapeString) in r1
	var bC = [];	// bC[roundIndex] := 
	// create basic datastructure
	for (var rI=0;rI<graph.length;rI++) {  // for each round, 
		if (rI<graph.length-1) {
			var new_cM = extractConnectivity(graph[rI],graph[rI+1]);   // create connectivity graph
		}
		var new_oM=[];
		for (boardShape in graph[rI]) {
			new_oM.push(boardShape);
		}
		cM.push(new_cM);
		oM.push(new_oM);
	}
	
	// step1. ordering
		// downRun. 1-2,2-3,...,(n-1)-n. modify the latter based on barycenter order
	oM = ordering_phase1(oM,cM);
	// step2. swapping rows/columns of equal barycenters
	oM = ordering_phase2(oM,cM);
	// apply result into graph
	for (var rI=0;rI<graph.length;rI++) {
		var curRound = graph[rI];
		var newRound = {};
		for (var shape in curRound) {
			newRound[shape]={};
			newRound[shape]['matches'] = curRound[shape];
			if($.inArray(shape,oM[rI])==-1) {
				alert(rI + " th round doesn't have "+shape);
			}
			newRound[shape]['order']= oM[rI][shape];
		}
		graph[rI] = newRound;
	}
	return {'graph':graph,'connectivity':cM};
	
	// step2. horizontal positioning
	
	
	// step3. add x position and return graph
}



//log in & sign up module
function showLogIn() {
	var blackMat = $("<DIV class='blackMat'></DIV>");
	var logInDIV = $("<DIV id='logIn' class='panel_floating' style='position:absolute; z-index:1001; top:50%; left:50%; margin:-150px 0 0 -150px; width:300px; height:300px;'></DIV>");
	$("body").append(blackMat);
	$("body").append(logInDIV);
	$("#logIn").append("<DIV class='button_close'></DIV>");
	$('.button_close').click(function() {$(this).parent.remove();});
	var html = "<DIV>Log In</DIV>"
			+ "<form name='login' id='login_form' action='#'>"
			+ 	"<div><span style='width:50px'>User name</span><input type='text' id='userID' name='id' size='20'/></div>"
			+ 	"<div><span style='width:50px'>Password</span><input type='password' id='password' name='password' size='20'/></div>"
			+	"<div style='text-align:center'><input type='submit' id='button_login' name='submit' value='log in'/></div>"
			+ "</form>";
	$("#logIn").append(html);
	$("#button_login").click(function() {
		var id = $("input#userID").val();
		var password = $("input#password").val();
		if (id=="" || password=="") { alert("id and password must be filled in."); return; }
		var param = 'name=' + id + "&password=" + password;
		$.get("LogIn",param,function(response) {
			if(response.indexOf("You are now logged in ")!=-1) {
				p1 = response.replace("You are now logged in as","");
				$(".blackMat").remove();
			} else {
				$("#logIn").append("<DIV>"+response+"</DIV>");
			}
		});
	});
}





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
