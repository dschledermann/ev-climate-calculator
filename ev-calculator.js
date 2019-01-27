
// Load the resources
// Attempt to draw at each load
$(function(){
    $.ajax({
	url: 'grids.json',
	datatype: 'json',
	success: function(data) {
	    grids = data;
	    draw();
	}
    });

    $.ajax({
	url: 'cars.json',
	datatype: 'json',
	success: function(data) {
	    cars = data;
	    draw();
	}
    });

    $.ajax({
	url: 'driveStyles.json',
	datatype: 'json',
	success: function(data) {
	    driveStyles = data;
	    draw();
	}
    });

    $.ajax({
	url: 'batteries.json',
	datatype: 'json',
	success: function(data) {
	    batteries = data;
	    draw();
	}
    });
});

// Stub for the resources
var grids = [];
var cars = [];
var driveStyles = [];
var batteries = [];

// Draw the actual form
var draw = function() {

    // Only do so if there is data in each of the resources
    if (grids.length == 0 ||
	cars.length == 0 ||
	driveStyles == 0 ||
	batteries.length == 0) {
	return;
    }

    grid = $('<select name="grid" id="grid" class="calc-basis" />');
    $.each(grids, function(i, e){
	grid.append(
	    $("<option/>")
                .attr("value",e.name)
                .text(e.desc));
    });

    battery = $('<select name="battery" id="battery" class="calc-basis" />');
    $.each(batteries, function(i, e){
	battery.append(
	    $("<option/>")
		.attr("value", e.name)
		.text(e.desc));
    });

    driveStyle = $('<select name="driveStyle" id="driveStyle" class="calc-basis" />');
    $.each(driveStyles, function(i, e){
	driveStyle.append(
	    $("<option/>")
		.attr("value",e.factor)
		.text(e.desc))
    });

    $("#ev-canvas")
	.append(grid)
	.append(battery)
	.append(driveStyle)
	.append($('<p><label>Kilometer om året:</label><input id="kmyear" name="kmyear" value="20000" type="input" class="calc-basis" /></p>'))
	.append($('<p><label>Brændstof:</label><select id="fuel" name="fuel" class="calc-basis"><option value="d">Diesel</option><option value="b">Benzin</option></select></p>'))
    	.append($('<p><label>Km/l:</label><input type="range" min="8" max="33" value="15" class="calc-basis" name="kml" id="kml" /></p>'))
	.append($('<div id="ev-table"/>'))
	.append($('<div id="ev-link"/>'));

    $('.calc-basis').change(recalc);

    // Get query parts, if any
    var url = new URL(window.location.href);
    $.each(['grid', 'battery', 'driveStyle', 'kmyear', 'kml', 'fuel'], function(i, e) {
	val = url.searchParams.get(e);
	$("#" + e).val(val);
    });

    recalc();
};

// Fill the table with the results
var recalc = function() {
    $('#ev-table').html('');
    kml = $('input[name=kml]').val();

    // The CO2 / liter fuel is hardcoded
    // They're based on the CO2-content plus a margin for production and transport
    fuel = $('#fuel').val();
    if (fuel == 'd') {
	co2kmFuel = 3250 / kml;
	fuelType = 'diesel';
    }
    else {
	co2kmFuel = 2750 / kml;
	fuelType = 'benzin';
    }

    $('#ev-table')
	.append('<p>Brændstofbil der kører: ' + kml + ' km/l ' + fuelType + '</p>')
	.append('<p>Dette udleder ca. ' + co2kmFuel.toFixed(2) + ' gCO2 / km, inklusiv udvinding, transport og raffinering af brændstoffet.</p>');

    grid = grids.find(function(e){
	return e.name == $("select[name=grid]").val();
    });

    battery = batteries.find(function(e){
	return e.name == $("select[name=battery]").val();
    });

    driveStyle = $("select[name=driveStyle]").val();
    kmyear = $("input[name=kmyear]").val();
    chargeLoss = 1.1;

    $('#ev-table').append('<table/>');
    $('#ev-table table').append('<tr><th>Bil</th><th>Udledning, CO2e/km</th><th>Forskel, CO2e/km</th><th>Break/even ved km</th><th>Break/even ved år</th></tr>');

    $(cars).each(function(i, car){
	dataRow = '<td><a href="#" onclick="showCar(' + i + ')">' + car.desc + '</a></td>';
	infoRow = '<td style="display: none;" class="infoRow" id="infoRow' + i + '" colspan="4">';
	infoRow += '<p>' + car.desc + ' har et batteri på ' +
	    car.kwh + ' kWh. ' + 'Med udgangspunkt i batteriproduktionen "' + battery.desc + '" på ' + (battery.gco2e / 1000) +
	    ' kg CO2 pr produceret kWh,vil den have en udledning ved produktion på '
	    + (battery.gco2e * car.kwh / 1000000).toLocaleString('da', {maximumFractionDigits: 2}) + ' ton CO2.</p>';

	infoRow += '<p>Estimatet er med udgangspunkt i <a href="' + battery.src + '">' + battery.introductory + '</a></p>';
	infoRow += '</td>';

	co2kmEV = chargeLoss * driveStyle * grid.co2kwh * car.whkm / 1000;
	dataRow += '<td>' + co2kmEV.toFixed(2) + ' g</td>';
	co2diff = co2kmFuel - co2kmEV;
	dataRow += '<td>' + co2diff.toFixed(2) + ' g</td>';
	diffBreakKm = (battery.gco2e * car.kwh) / co2diff;

	if (diffBreakKm > 0) {
	    diffBreakYear = diffBreakKm / kmyear;
	    dataRow += '<td>' + diffBreakKm.toLocaleString('da', {maximumFractionDigits: 0}) + ' km</td>';
	    dataRow += '<td>' + diffBreakYear.toLocaleString('da', {maximumFractionDigits: 2, minimumFractionDigits: 2}) + ' år</td>';
	}
	else {
	    dataRow += '<td>Aldrig</td><td>Aldrig</td>';
	}

	$('#ev-table table').append('<tr>' + dataRow + '</tr>');
	$('#ev-table table').append('<tr>' + infoRow + '</tr>');
    });

    myLocation = window.location.origin + window.location.pathname
	+ '?battery=' + battery.name + '&grid=' + grid.name + '&driveStyle=' + driveStyle
	+ '&kmyear=' + kmyear + '&kml=' + kml + '&fuel=' + fuel;

    $('#ev-link').html('<a href="' + myLocation + '">Link til denne visning</a>');
}

var showCar = function (i) {
    $('#infoRow' + i).toggle();
    return false;
}
