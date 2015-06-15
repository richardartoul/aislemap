var renderAisleMap = function(aisleMap){
	var canvas = document.getElementById('pathCanvas');
	var context = canvas.getContext('2d');
	var backgroundCanvas = document.getElementById('backgroundCanvas');
	var backgroundContext = backgroundCanvas.getContext('2d');
	var counter = 0;
	var lastAisleWithItem = -1;
	var fade = 0;
	var grow = 0;
	var xOffset = 200;
	var yOffset = 500;
	fadeDirection = 0.01;
	var growDirection = 0.1;
	var tweenedPath = [];

	context.beginPath();
	context.moveTo(xOffset + aisleMap.path[0].x * 40, yOffset + aisleMap.path[0].y * 40);

	//determine the last aisle that has an item
	var findLastAisleWithItem = function() {
		for (var i = 0; i < aisleMap.aislesWithItems.length; i++) {
			if (aisleMap.aislesWithItems[i]) {
				lastAisleWithItem = i;
			}
		}
	}

	//handles the fading in and out of the items - next time use sin function instead
	var updateFade = function() {
		if (fade >= 1) {
			fadeDirection = -0.01;
		}
		else if (fade <= 0.01) {
			fadeDirection = 0.01;
		}
		fade += fadeDirection;
	}

	//handles growing and shrinking of nav diamong - next time use sin function instead
	var updateGrow = function() {
		if (grow >= 5) {
			growDirection = -0.1;
		}
		else if (grow <= 0) {
			growDirection = 0.1;
		}
		grow += growDirection;
	}

	//determines which direction the current route is moving in
	var determineDirection = function(array, index, property) {
		if (!array[index+1] && property === 'y') {
			if (index > aisleMap.aisleLength-1) {
				return 1;
			}
			else {
				return -1;
			}
		}
		else if (!array[index+1]) {
			return 0;
		}
		if (array[index+1][property] > array[index][property]) {
			return 1;
		}
		else if (array[index+1][property] < array[index][property]) {
			return -1;
		}
		else {
			return 0;
		}
	}

	//adds two addition frames inbetween each set of coordinates to smooth out the animation
	var preTween = function() {
		for (var i = 0; i < aisleMap.path.length; i++) {
			for (var j = 0; j < 20; j++) {
				x = aisleMap.path[i].x;
				y = aisleMap.path[i].y;
				var tweenedCoordinates = {};
				var xDirection = determineDirection(aisleMap.path, i, 'x');
				var yDirection = determineDirection(aisleMap.path, i, 'y');
				tweenedCoordinates.x = x+0.05*xDirection*j;
				tweenedCoordinates.y = y+0.05*yDirection*j;
				tweenedPath.push(tweenedCoordinates);
			}
		}
	}

	//clears the canvas between frames
	var clearCanvas = function() {
		context.clearRect(0,0,canvas.width, canvas.height);
	}

	//draws the diamond at the specified coordinates
	var drawDiamond = function(context, x, y) {
		context.moveTo(x+7.5,y-grow);
		context.lineTo(x+15+grow,y+10);
	 	context.lineTo(x+7.5, y+20+grow);
	 	context.lineTo(x-grow,y+10);
		context.fillStyle = "orange"; 
		context.lineWidth = 1+0.2*grow; 
		context.strokeStyle = "orange";
		context.closePath(); 
		context.fill();
		context.stroke();
	}
	
	//determines where to draw the diamond each frame	
	var drawPath = function() {
		context.beginPath();
		var x = xOffset-6 + tweenedPath[counter].x * 40;
		var y = yOffset - tweenedPath[counter].y * 40
		drawDiamond(context,x,y);	
	}

	/* optimization opportunity: Change this so that instead of drawing hundreds of tiny line fragments, it instead draws
	much longer line fragments, creating a new fragment only when the direction changes */
	//draws the path that has already been traveled behind the diamond each frame
	var drawTraveledPath = function() {
		context.beginPath();
		context.moveTo(xOffset + tweenedPath[0].x * 40+2, yOffset - tweenedPath[0].y * 40);
		for (var i = 0; i < counter; i++) {
			//makes it so the line isn't "in" the diamond
			if (i > 20) {
				if (determineDirection(tweenedPath,i-6, 'y') === 1) {
	  				context.lineTo(xOffset + tweenedPath[i-6].x*40+2, yOffset - tweenedPath[i-6].y*40+12);
				}
				else {
	  				context.lineTo(xOffset + tweenedPath[i-6].x*40+2, yOffset - tweenedPath[i-6].y*40+12)
				}
			}
		}
		context.lineWidth = 2;
		context.strokeStyle = 'blue';
		context.stroke();
	}		

	//draws the aisles in a background canvas so they dont need to re-render each frame
	var drawAisles = function() {
		backgroundContext.beginPath();
		for (var i = 0; i < aisleMap.numAisles; i++) {
			backgroundContext.strokeRect(xOffset-25+40*i, 135,12, yOffset-130)
			backgroundContext.strokeStyle = 'black';
			backgroundContext.stroke();
			backgroundContext.font ="18px serif";
			backgroundContext.fillText((i+1).toString(), xOffset-5+40*i, yOffset+23);
		}
	} 

	//draws the items each frame
	var drawItems = function() {
		//save state of context before setting globalAlpha
		context.save();
		for (var i = 0; i < aisleMap.items.length; i++) {
			//set transparency based on current fade
			context.globalAlpha = fade;
			var x = xOffset+20 + 40*aisleMap.items[i].x;
			var y = yOffset - 40*aisleMap.items[i].y;
			context.beginPath();
			context.fillStyle = "red";
			context.strokeStyle = "black";
			context.lineWidth = 0.5
			//prevents items from being drawn on right side in last aisle
			if (i % 2 === 1 && aisleMap.items[i].x !== lastAisleWithItem) {
				backgroundContext.clearRect(x-4,y-4,6, 6);
				context.fillRect(x-4,y-4,6, 6);
				context.strokeRect(x-4,y-4,6, 6);
			}
			else {
				backgroundContext.clearRect(x-40,y-4,6, 6);
				context.fillRect(x-40,y-4,6, 6);
				context.strokeRect(x-40,y-4,6, 6);
			}
		}
		//remove transparency
		context.restore();
	}

	//run every frame to create animation
	var render = function() {
		//restart animation
		if (counter === tweenedPath.length - 20) {
			counter = 0;
		}
		clearCanvas();
		drawItems();
		drawPath();
		drawTraveledPath();
		updateFade();
		updateGrow();
		counter++;
		requestAnimationFrame(render);
	}

	//initialize animation
	drawAisles();
	preTween();
	findLastAisleWithItem();
	render();
	console.log(lastAisleWithItem);
}