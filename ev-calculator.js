$(function(){
    grid = $('<select name="grid" id="grid" class="calc-basis" />');
    $.each(grids, function(i){
	grid.append(
	    $("<option></option>")
                .attr("value",i)
                .text(grids[i].desc));
    });
    $("#ev-canvas").append(grid);

    batteryCost = $('<select name="batteryCost" id="batteryCost" class="calc-basis" />');
    $.each(batteryCosts, function(i){
	batteryCost.append(
	    $("<option></option>")
		.attr("value",i)
		.text(batteryCosts[i].desc));
    });
    $("#ev-canvas")
	.append(batteryCost)
	.append($('<p>Diesel: <input name="fuel" value="d" type="radio" class="calc-basis" /> Benzin <input name="fuel" value="b" type="radio" class="calc-basis" /></p>'))
    	.append($('<p>Km/l: <input type="range" min="8" max="33" value="16" class="calc-basis" name="kml" id="kml" /></p>'))
	.append($('<div id="ev-table"/>'));

    $('.calc-basis').change(recalc);
    recalc();
});


var recalc = function() {
    $('#ev-table').html('');
    kml = $('input[name=kml]').val();
    if ($('input[name=fuel]:checked').val() == 'd') {
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

    grid = grids[$("select[name=grid]").val()];
    battery = batteryCosts[$("select[name=batteryCost]").val()];

    $('#ev-table').append('<table/>');
    $('#ev-table table').append('<tr><th>Bil</th><th>Udledning, CO2e/km</th><th>Forskel, CO2e/km</th><th>Break/even ved</th>');

    $(cars).each(function(c){
	dataRow = '<td><a href="#" onclick="showCar(' + c + ')">' + cars[c].desc + '</a></td>';
	infoRow = '<td style="display: none;" class="infoRow" id="infoRow' + c + '" colspan="4"><p>' + cars[c].desc + ' har et batteri på ' +
	    cars[c].kwh + ' kWh. ' + 'Med udgangspunkt i batteriproduktionen "' + battery.desc + '" på ' + (battery.gco2e / 1000) +
	    ' kg CO2 pr produceret kWh,vil den have en udledning ved produktion på '
	    + (battery.gco2e * cars[c].kwh / 1000000).toLocaleString('da', {maximumFractionDigits: 2}) + ' ton CO2.</p></td>';

	co2kmEV = grid.co2kwh * cars[c].whkm / 1000;
	dataRow += '<td>' + co2kmEV.toFixed(2) + ' g</td>';
	co2diff = co2kmFuel - co2kmEV;
	dataRow += '<td>' + co2diff.toFixed(2) + ' g</td>';
	diffBreak = (battery.gco2e * cars[c].kwh) / co2diff;

	if (diffBreak > 0) {
	    dataRow += '<td>' + diffBreak.toLocaleString('da', {maximumFractionDigits: 0}) + ' km</td>';
	}
	else {
	    dataRow += '<td>N/A</td>';
	}

	$('#ev-table table').append('<tr>' + dataRow + '</tr>');
	$('#ev-table table').append('<tr>' + infoRow + '</tr>');
    });
}

var showCar = function (i) {
    $('#infoRow' + i).toggle();
    return false;
}

grids = [
    {
	"desc": "Dansk gennemsnitsstrøm",
	"co2kwh": 181
    },
    {
	"desc": "Kulfyring",
	"co2kwh": 820
    },
    {
	"desc": "Naturgas",
	"co2kwh": 490
    },
    {
	"desc": "Solceller",
	"co2kwh": 41
    },
    {
	"desc": "Kernekraft",
	"co2kwh": 12
    },
    {
	"desc": "Vindmøller",
	"co2kwh": 11
    }
];

cars = [
    {
	"desc": "Jaguar I-Pace",
	"whkm": 240,
	"kwh": 90
    },
    {
	"desc": "Model X P100DL",
	"whkm": 220,
	"kwh": 100
    },
    {
	"desc": "Model S 85D",
	"whkm": 192,
	"kwh": 85
    },
    {
	"desc": "Model S 70R",
	"whkm": 192,
	"kwh": 70
    },
    {
	"desc": "Nissan Leaf",
	"whkm": 169,
	"kwh": 24
    },
    {
	"desc": "VW e-UP",
	"whkm": 140,
	"kwh": 16.8
    },
    {
	"desc": "Hyundai Ioniq",
	"whkm": 125,
	"kwh": 27
    },
    {
	"desc": "Hyundai Kona electric",
	"whkm": 160,
	"kwh": 64
    }
];

batteryCosts = [
    {
	"desc": "ADAC high",
	"gco2e": 200000
    },
    {
	"desc": "ADAC low",
	"gco2e": 150000
    },
    {
	"desc": "Varta",
	"gco2e": 120000
    },
    {
	"desc": "Tesla/Panasonic S/X",
	"gco2e": 70000
    },
    {
	"desc": "Tesla/Panasonic 3",
	"gco2e": 40000
    }
];
