function init(numSources = 1) {
	element = document.getElementById("canvas1");
	canvas = element.getContext("2d");

	// read the width and height of the canvas
	var width = element.width;
	var height = element.height;

	var xfocus = Math.round(width / 5); // offsets to "center"
	var yfocus = Math.round(height / 2);
	var sources = new Array;
	
	generateSources(numSources);

	// create a new pixel array
	var imageData = canvas.createImageData(width, height);

	var mu0 = 4 * Math.PI * 1e-7;
	var mu = mu0;
	var c = 299792458;
	var eps0 = 1 / (mu * c * c);
	var eps = eps0;
	var delta = 1e-6;
	var S = 1/(Math.sqrt(2));
	var deltat = S*delta/c;

	var pmlWidth = 25;
	var gradingOrder = 6;
	var gamma = 1e-6;
	var sigmaMax = (-Math.log(gamma)/Math.LN10*(gradingOrder+1)*eps*c)/(2*pmlWidth*delta);
	var boundfact = sigmaMax/(Math.pow(pmlWidth,gradingOrder) * (gradingOrder+1));

	var sigmax = new Float32Array(width * height);
	var sigmay = new Float32Array(width * height);

	var G = new Float32Array(width * height);
	var H = new Float32Array(width * height);
	var A = new Float32Array(width * height);
	var B = new Float32Array(width * height);

	var C = new Float32Array(width * height);
	var D = new Float32Array(width * height);
	var E = new Float32Array(width * height);
	var F = new Float32Array(width * height);

	var sigma = 4;
	var As = ((mu - 0.5 * deltat * sigma) / (mu + 0.5 * deltat * sigma));
	var Bs = (deltat / delta) / (mu + 0.5 * deltat * sigma);
	var Cs = ((eps - 0.5 * deltat * sigma) / (eps + 0.5 * deltat * sigma));
	var Ds = (deltat / delta) / (eps + 0.5 * deltat * sigma);

	for (y = 0; y < height; y++) {
		for (x = 0; x < width; x++) {
			var index = y * width + x;

			if (x <= pmlWidth) {
				var xFromEdge = pmlWidth - x;
				if (xFromEdge == 0) {
					sigmax[index] = boundfact * (Math.pow(xFromEdge + 0.5, gradingOrder + 1) - Math.pow(xFromEdge, gradingOrder + 1))
				}
				else {
					sigmax[index] = boundfact * (Math.pow(xFromEdge + 0.5, gradingOrder + 1) - Math.pow(xFromEdge - 0.5, gradingOrder + 1))
				}
			}
			else if ((width - 1 - x) <= pmlWidth) {
				var xFromEdge = pmlWidth - (width - 1 - x);
				if (xFromEdge == 0) {
					sigmax[index] = boundfact * (Math.pow(xFromEdge + 0.5, gradingOrder + 1) - Math.pow(xFromEdge, gradingOrder + 1))		
				}
				else {
					sigmax[index] = boundfact * (Math.pow(xFromEdge + 0.5, gradingOrder + 1) - Math.pow(xFromEdge - 0.5, gradingOrder + 1))
				}
			}
			else {
				sigmax[index] = 0.0;
			}

			if (y <= pmlWidth) {
				var yFromEdge = pmlWidth - y;
				if (yFromEdge == 0) {
					sigmay[index] = boundfact * (Math.pow(yFromEdge + 0.5, gradingOrder + 1) - Math.pow(yFromEdge, gradingOrder + 1))
				}
				else {
					sigmay[index] = boundfact * (Math.pow(yFromEdge + 0.5, gradingOrder + 1) - Math.pow(yFromEdge - 0.5, gradingOrder + 1))
				}
			}
			else if ((height - 1 - y) <= pmlWidth) {
				var yFromEdge = pmlWidth - (height - 1 - y);
				if (yFromEdge == 0) {
					sigmay[index] = boundfact * (Math.pow(yFromEdge + 0.5, gradingOrder + 1) - Math.pow(yFromEdge, gradingOrder + 1))
				}
				else {
					sigmay[index] = boundfact * (Math.pow(yFromEdge + 0.5, gradingOrder + 1) - Math.pow(yFromEdge - 0.5, gradingOrder + 1))
				}
			}
			else {
				sigmay[index] = 0.0;
			}

			var sigmaxstar = sigmax[index] * mu / eps;
			var sigmaystar = sigmay[index] * mu / eps;

			G[index] = ((mu - 0.5 * deltat * sigmaxstar) / (mu + 0.5 * deltat * sigmaxstar));
			H[index] = (deltat/delta) / (mu + 0.5 * deltat * sigmaxstar);
			A[index] = ((mu - 0.5 * deltat * sigmaystar) / (mu + 0.5 * deltat * sigmaystar));
			B[index] = (deltat/delta) / (mu + 0.5 * deltat * sigmaystar);

			C[index] = ((eps - 0.5 * deltat * sigmax[index]) / (eps + 0.5 * deltat * sigmax[index]));
			D[index] = (deltat/delta) / (eps + 0.5 * deltat * sigmax[index]);
			E[index] = ((eps - 0.5 * deltat * sigmay[index]) / (eps + 0.5 * deltat * sigmay[index]));
			F[index] = (deltat/delta) / (eps + 0.5 * deltat * sigmay[index]);

//			console.log("A: " + x + " " + y + " : " + A[index]);
		}
	}

	var Ezx = new Float32Array(width * height);
	var Ezy = new Float32Array(width * height);
	var Hy = new Float32Array(width * height);
	var Hx = new Float32Array(width * height);
	for (y = 0; y < height; y++) {
		for (x = 0; x < width; x++) {
			var index = y * width + x;
			Ezx[index] = 0.0;
			Ezy[index] = 0.0;
			Hy[index] = 0.0;
			Hx[index] = 0.0;
		}
	}

	var t = 0;

	var dishOffset = 20;
	var dishRadius = 100;
	var focalLength = xfocus - dishOffset;

	var dish = new Dish(dishOffset, yfocus, focalLength, dishRadius);

    window.setInterval(update, 0);

	var lastDate = new Date;
	var fpsSum = 0.0;

	function stepWorld() {
		for (y = 0; y < height; y++) {
			var xDish = dish.getX(y);
			var startY = y * width;
			var startMinY, startPlusY;
			if (y < height - 1)
				startPlusY = startY + width;
			else
				startPlusY = startY;
			if (y > 0)
				startMinY = startY - width;
			else
				startMinY = startY;
			

			for (x = 0; x < width; x++) {
				var index = startY + x;
				var indexMinY = startMinY + x;
				var indexPlusY = startPlusY + x;
				var indexMinX, indexPlusX;
				if (x > 0)
					indexMinX = index - 1;
				else
					indexMinX = index;
				if (x < width - 1)
					indexPlusX = index + 1;
				else
					indexPlusX = index;

				// Maxwell equation update
				Hy[index] *= A[index];
				Hy[index] += B[index] * (Ezx[indexPlusY] - Ezx[index] + Ezy[indexPlusY] - Ezy[index]);
				Hx[index] *= G[index]
				Hx[index] += -H[index] * (Ezx[indexPlusX] - Ezx[index] + Ezy[indexPlusX] - Ezy[index]);
				Ezx[index] *= C[index]
				Ezx[index] += D[index] * (-Hx[index] + Hx[indexMinX]);
				Ezy[index] *= E[index]
				Ezy[index] += F[index] * (Hy[index] - Hy[indexMinY]);
				
				if (Math.abs(x - xDish) < 1.0 && Math.abs(y - yfocus) < dishRadius) {
					Ezx[index] = 0.0;
					Ezy[index] = 0.0;
				}
			}
		}
		for (var s = 0; s < sources.length; s++) {
			var index = sources[s].index();
			var value = sources[s].getValue(t);
			Ezx[index] = value;
			Ezy[index] = value;
		}
		t++;
	}
	
	function generateSources(numSources) {
		sources.length = numSources;
		for (var i = 0; i < numSources; i++) {
			var ypos =  yfocus + 10 * (i - (numSources - 1.0)/ 2.0);
			sources[i] = new Source(xfocus, ypos, ypos * width + xfocus, 2.0, 0.5 * Math.PI * i);
		}	
	}

	function updateImageData() {
		pos = 0; // index position into imagedata array
		for (y = 0; y < height; y++) {
			var startY = y * width;
			for (x = 0; x < width; x++) {
				var index = startY + x;

				var Emag = Ezx[index] + Ezy[index];
				if (Emag < -1) Emag = -1;
				if (Emag > 1) Emag = 1;

				var colorMapIndex = Math.round((Emag + 1) * 0.5 * colorMapLength) * 3;
				var r = colorMap[colorMapIndex + 0];
				var g = colorMap[colorMapIndex + 1];
				var b = colorMap[colorMapIndex + 2];

				imageData.data[pos++] = r;
				imageData.data[pos++] = g;
				imageData.data[pos++] = b;
				imageData.data[pos++] = 255; // opaque alpha
			}
		}
	}

	var changed = true;
	function update() {
		// copy the image data back onto the canvas
		if (changed) {
			generateSources(document.querySelector('#sourcesVal').value);
		}
		
		stepWorld();
		updateImageData();

		canvas.putImageData(imageData, 0, 0); // at coords 0,0
		dish.drawOn(canvas);

		var thisDate = new Date;
		var fps = 1000 / (thisDate - lastDate);
		fpsSum += fps;
		lastDate = thisDate;

		canvas.fillText(fpsSum / t, 10, 10);
	}
}
