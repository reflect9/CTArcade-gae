/* trainer has three features
 * 1. get sample stage status 
 * 		a. user can modify or capture from game
 * 2. generate multiple examples and key features at the same time
 * 		a. pre-condition filter is generated/specified
 * 3. provide post-condition
 * 		a. using program synthesis or manual selection, generate task
 * 
 */



function Creation() {
	var stage;
	var dict_features;
	var variations;
	var precondition;
	var task_preset;
	
	var baseHTML = $(
			"<div class='head'>" +
			"	<h2>Create your own rule</h2>" +
			"</div>" +
			"<div class='row-fluid'>" +
			"	<div id='stageWrapper' class='span6'>" +
			"		<h3>EXAMPLES</h3>" +
			"		<div id='stagesDIV'></div>" +
			"		<div><button id='btn_newStage'>Add New Example</button></div>" +
			"	</div>" +
			"	<div id='featureWrapper' class='span6'>" +
			"		<h3>CHOOSE INPUT FEATURES</h3>" +
			"		<div class='well' id='featuresDIV' style='padding:10px;'>" +
			"			<div class='' id='features'></div>" +
			"			<button id='btn_newFeature' style='margin-top:5px;' class='btn btn-warning'>CUSTOM FEATURE</button>" +
			"		</div>" +		
			"		<h3>PRECONDITIONS</h3>" +
			"		<div class='well' id='preconditionDIV' style='padding:10px;'>" +
			"			<div class='' id='conditions'>" +
			"			</div>" +
			"			<button id='btn_newPrecondition' class='btn btn-warning'>ADD NEW CONDITION</button> " +
			"		</div>" +
			"		<h3>OUTCOME</h3>" +
			"		<div class='well' id='postconditionDIV' style='padding:10px;'>" +
			"			<div class='btn-group' id='btn_tasks'>" +
			"				<a class='btn dropdown-toggle' data-toggle='dropdown' href='#'>" +
			"					<span id='currentOutcomeTask'>Select a task </span><span class='caret'></span>" +
			"				</a>" +
			"				<ul class='dropdown-menu' id='ul_tasks'>" +
			"				</ul>"+
			"			</div>" +
			"		</div>" +
			"	</div>" +		
			"</div>"
			);
	
	this.init = function(target,selection) {
		$(baseHTML).appendTo(target);
		$('#btn_newStage').click($.proxy(this.createStage,this,selection));
		$("#btn_newPrecondition").click($.proxy(this.createEmptyCondition,this));
		this.dict_features = this.extractFeatures(model);	// load agents[],foods[] information from current model object
		this.displayFeatures(this.dict_features);			// display it
		this.populatePresetTasks(['idle','move','eat','reproduce','message']);

		this.createStage(selection);
	}
	this.createEmptyCondition = function() {
		var target = $("#conditions");
		var html = "<div class='condition clearfix'>" +
				"	<div class='relatedFeatures'>" +
				"		Selected features to be used for this condition" +
				"	</div>" +
				"	<div class='predicate'>" +
				"		predicate" +
				"	</div>" +
				"</div>";
		
		$(html).appendTo(target);
	};
	this.populatePresetTasks = function(list) {
//		alert("populate");
		var target = $("#ul_tasks");
		$.each(list, function(i,taskName) {
			$("<li>"+taskName+"</li>")
				.click(function() {
					$("#currentOutcomeTask").text($(this).text());
				})
				.appendTo(target);
		});
	}
	this.extractFeatures = function(context) {
		// context := model.  Extract all the objects with lists of their features
		// Objects are identified with their 'class' property (='object')
		var listOfObjects = [];
		listOfObjects = recursiveSearch(context,'class','object'); 
		var features= {};
		$.each(listOfObjects, function(i,obj) {
			var type = obj.constructor.name;
			features[type] = Object.keys(obj);
		});
		//console.log(dict_typesOfObjects);
		return features;
	}
	this.displayFeatures = function(dict) {
		var target = $("#features");
		$.each(dict, function(typeName,propertyDict){
			var o = $("<div class='clearfix'><button class='btn btn-small objButton'>"+typeName+"</button></div>").appendTo(target);
			var propertyArea = $("<div class='propertyArea clearfix' id='propertyOf_"+typeName+"'></div>").appendTo(target);
			$.each(propertyDict, function(i,propertyName) {
				var p = $("<button class='btn btn-mini propertyButton disabled'></button>").text(propertyName).appendTo(propertyArea);			
			});
			$(propertyArea).hide();
		});
		// set interaction on the buttons
		$('.objButton').click(function() { 
			$(this).toggleClass('btn-info');
			if ($(this).hasClass('btn-info')) $("#propertyOf_"+$(this).text()).show();
			else	 $("#propertyOf_"+$(this).text()).hide();
		});
		$('.propertyButton').click(function() { $(this).toggleClass('btn-info').toggleClass('disabled'); });
	}
	this.updatePreconditions = function() {
		
	}
	this.createStage = function(selection) {
		var html = "<div class='exampleDIV clearfix'>" +
				"	<div class='exampleStage'>" +
				"		" +
				"	</div>" +
				"</div>";
		var exampleDIV = $(html).appendTo("#stagesDIV");
		for(i in selection) {
			var obj = selection[i];
			$(exampleDIV).find(".exampleStage").append(this.createObject(obj.size,obj.color));
		}
		$(".draggable").draggable({ containment:'parent'});
				
//		var btn_newElement = $("<button></button>",{
//			class:'btn_addElement btn-mini'
//		}).css({
//		}).text("+").appendTo(newStageWrapper);
//		$(btn_newElement).click($.proxy(function() {
//			this.createElement(newStage,10,'gray');
//		},this));

	}
	
	this.createObject = function(size,color) {
		var newObj = $("<div></div>",{
			class:'draggable'
		}).css({
			'width':(size*4)+'px',
			'height':(size*4)+'px',
			'top': (Math.random()*100)+'px',
			'left':(Math.random()*100)+'px',
			'background':color
		});
		return newObj;
	}
	this.generateVariation = function() {
		
	}
	
	
}
