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
