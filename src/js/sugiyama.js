<script type="text/javascript">

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
	for(var node in tempArray) {
		output.push(tempArray[node][0]);
	}
	if(output.length!=tempArray.length) {
		alert("ohh");
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
	for (var i in tempArray) {
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
	for (var rI=0;rI<cM.length-1;rI++) {
		oM[rI+1] = reorder_barycenter('down',oM[rI],oM[rI+1],cM[rI]); // modify below row based on its barycenter of above row(oM[rI])
	}
	for (var rI=cM.length-2;rI>-1;rI--) {
		oM[rI] = reorder_barycenter('up',oM[rI],oM[rI+1],cM[rI]);  // upward
	}
	return oM;
}
function ordering_phase2(oM,cM) {
	var counter = 0;	var maxCounter = 5;	// try 5 times to maximum
	while(true) {
		var newOM = jQuery.extend(true, {}, oM);
		// downward run of swapping equal barycenter nodes
		for (var rI=0;rI<cM.length-1;rI++) {
			newOM[rI+1] = swap_eq_barycenter('down',oM[rI],oM[rI+1],cM[rI]);
		}
		if (JSON.stringify(newOM)!=JSON.stringify(oM)) {	// run phase1-downward to refresh
			for (var rI=0;rI<cM.length-1;rI++) {
				newOM[rI+1] = reorder_barycenter('down',newOM[rI],newOM[rI+1],cM[rI]); // modify below row based on its barycenter of above row(oM[rI])
			}
		}
		var newOM2 = jQuery.extend(true, {}, newOM);
		// upward run
		for (var rI=cM.length-2;rI>-1;rI--) {
			newOM2[rI] = swap_eq_barycenter('up',newOM2[rI],newOM2[rI+1],cM[rI]);
		}
		if (JSON.stringify(newOM2)!=JSON.stringify(newOM)) {	// run phase1-downward to refresh
			for (var rI=0;rI<cM.length-1;rI++) {
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

function findKeyOfValueInObject(value,obj) {
	var index = -1;
	for (key in obj) {
		if(obj[key]==value) index = key;
	} 
	return index;
}
function commonElementsFromArrays(arrA,arrB) {
	var cE = [];
	$.each(arrA, function(iA,a) {
		$.each(arrB,function(iB,b) {
			if(a==b & a!="") cE.push(a);
		});
	});
	return cE;
}
//Array.prototype.remove= function(){
//    var what, a= arguments, L= a.length, ax;
//    while(L && this.length){
//        what= a[--L];
//        while((ax= this.indexOf(what))!= -1){
//            this.splice(ax, 1);
//        }
//    }
//    return this;
//}


// 
function position_row(upDown,rI,oM,cM,xM) {
	var tempXM = jQuery.extend(true, {}, xM);
	var numberOfConnectedNodes = {};
	var dir = upDown;  
	if (dir=='downward') {
		var rdir = 'upward';
		var srcIndex = rI;  var tarIndex = rI+1;
	} else {
		var rdir='downward';
		var srcIndex = rI+1;  var tarIndex = rI;
	}
	for (shape in cM[rI][rdir])  numberOfConnectedNodes[shape] = cM[rI][rdir][shape].length;  // check priority
	var shapesOrderByPriority = getKeysSortedByValue(numberOfConnectedNodes);
	for (i in shapesOrderByPriority) {
		// get target position
		var shape = shapesOrderByPriority[i];
		var current_position = parseInt(tempXM[tarIndex][shape]);
		var current_priority = numberOfConnectedNodes[shape];
		var connectedShapes = cM[rI][rdir][shape];
		var avg_position = 0;	
		for (cS in connectedShapes) 
			avg_position += parseInt(tempXM[srcIndex][connectedShapes[cS]]);
		var target_position = Math.round(avg_position/connectedShapes.length);
		// push it to the target position
		while(true) {
			if(target_position > current_position) var direction=1;
			else if(target_position < current_position) var direction=-1;
			else 	{tempXM[tarIndex][shape]=current_position;	break;}
			var pointer= current_position; var blocked=false;	var emptyFound=undefined;	
			while(true) {	// 	iterate toward direction until there's empty slot and 
							//	check it's blocked by higher priority node
				pointer += direction;
				if(findKeyOfValueInObject(pointer,tempXM[tarIndex])==-1) {  
					emptyFound=pointer;  break; 
				}	else{
					var adjacentShape = findKeyOfValueInObject(pointer,tempXM[tarIndex]);
					var adj_shape_priority = numberOfConnectedNodes[adjacentShape];
					if(current_priority<=adj_shape_priority) { blocked=true;  break;}
				}
			}
			if (typeof emptyFound != 'undefined') {  /* push one step toward the direction */
				pointer = emptyFound;
				var counter=0;
				while(true) {
					pointer+=direction*(-1);	// move cursor opposite direction 
					tempXM[tarIndex][findKeyOfValueInObject(pointer,tempXM[tarIndex])] += direction; // push the adjacent node to the direction
					if (pointer==current_position) break;
					if (counter<50) counter++; else {alert("omg"); break;}
				}
				current_position += direction;	// move the cursor to the direction, for next round
			}
			if (blocked==true) {
				break;
			}
		}
	}
	return tempXM;
}

function horizontal_positioning(oM,cM,graph) {
	var xM = [];
	for (rI in oM) {	// initialize xM(position) to integers(1,2,3,4...)
		var xRow={};
		for (shapeIndex in oM[rI]) {
			xRow[oM[rI][shapeIndex]]= parseInt(shapeIndex);	// key:shape, value:horizontal position
		}
		xM.push(xRow);
	}
	for(var i=0; i<3;i++) {
		for (var rI=0;rI<cM.length-1;rI++) {  // downrun
			xM = position_row('downward',rI,oM,cM,xM);
//			visualize_positioning_step(graph,xM,oM,cM);
		}
		for (var rI=cM.length-2;rI>-1;rI--) {  // uprun
			xM = position_row('upward',rI,oM,cM,xM);
//			visualize_positioning_step(graph,xM,oM,cM);
		}
		for (var rI=4;rI<cM.length-1;rI++) {  // t- downrun
			xM = position_row('downward',rI,oM,cM,xM);
//			visualize_positioning_step(graph,xM,oM,cM);
		}
	}
	return xM; // return array(rounds) of array(horizontal positions)
}

// hierarchical graph layout algorithm
// input: graph > [{[[0,0,"ben"][][]]:listOfMatches}, round2,..]
// output: [{[shapeofBoard]:{position:{x,y},matches}}, round2, ...]
function sugiyama(graph) {
	var cM = []; 	// connectivity;  cM[1] = r1 key->[r2 keys] 
	var oM = [];	// horizontal order; oM[1] := array of keys(shapeString) in r1
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

	// step2. horizontal positioning
	var xM = []; 	// horizontal position of every row
	// downrun from 2nd to the last round
	xM = horizontal_positioning(oM,cM,graph);

	// step3. add x position and return graph
	// apply result into graph
	for (var rI=0;rI<graph.length;rI++) {
		var curRound = graph[rI];
		var newRound = {};
		for (var shape in curRound) {
			newRound[shape]={};	newRound[shape]['connection']={};
			newRound[shape]['matches'] = curRound[shape];
			if($.inArray(shape,oM[rI])==-1) {
				alert(rI + " th round doesn't have "+shape);
			}
			newRound[shape]['order']= $.inArray(shape,oM[rI]);
			newRound[shape]['position']= xM[rI][shape];
			newRound[shape]['connection']['down']= cM[rI]['downward'][shape];
			if(rI>0) newRound[shape]['connection']['up']=cM[rI-1]['upward'][shape];
		}
		graph[rI] = newRound;
	}
	return {'graph':graph,'connectivity':cM};
}

</script>
