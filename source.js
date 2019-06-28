function Source(xCenter, yCenter, index, magnitude, phase) {
	this.xCenter = xCenter;
	this.yCenter = yCenter;
	this.magnitude = magnitude;
	this.phase = phase;
	this.eIndex = index;
}

Source.prototype.getValue = function(t) {
	if (t % 500 < 100)
		return Math.sin(t / 100 * 2 * Math.PI + this.phase) * this.magnitude;
	else
		return 0.0;
}

Source.prototype.index = function() {
	return this.eIndex;
}
