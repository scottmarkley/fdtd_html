function Dish(xCenter, yCenter, focalLength, radius) {
	this.xCenter = xCenter;
	this.yCenter = yCenter;
	this.focalLength = focalLength;
	this.radius = radius;
}

Dish.prototype.getX = function(y) {
	return (y - this.yCenter) * (y - this.yCenter) / (4 * this.focalLength) + this.xCenter;
}

Dish.prototype.drawOn = function(canvas) {
	
	canvas.beginPath();

	var yDishTop = this.yCenter - this.radius;
	var xDishTop = this.getX(yDishTop);
	var yDishBot = this.yCenter + this.radius;
	var xDishBot = this.getX(yDishBot);
	var height = this.yCenter * 2;

	canvas.moveTo(xDishTop, yDishTop);
	canvas.quadraticCurveTo(xDishTop - this.radius * this.radius * 0.5 / this.focalLength, this.yCenter, xDishBot, yDishBot);

	canvas.moveTo(this.xCenter, this.yCenter);

	canvas.lineTo(this.xCenter, this.yCenter + 20);
	canvas.lineTo(this.xCenter - 15, height);
	canvas.moveTo(this.xCenter, this.yCenter + 20);
	canvas.lineTo(this.xCenter + 15, height);

	//struts
	var nStruts = 3;
	for (var s = 1; s <= nStruts; s++) {
		var interp = s / (nStruts + 1);
		var strutHeight = this.yCenter + (height - this.yCenter) * interp;
		canvas.moveTo(this.xCenter - 15 * interp, strutHeight);
		canvas.lineTo(this.xCenter + 15 * interp, strutHeight);
	}

	canvas.closePath();

	canvas.lineWidth=2;
	canvas.strokeStyle="#ffffff";

	canvas.stroke();
}
