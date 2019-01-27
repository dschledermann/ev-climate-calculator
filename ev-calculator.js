$(function(){
    grid = $('<select name="grid" id="grid" class="calc-basis" />');
    $.each(grids, function(i){
	grid.append(
	    $("<option/>")
                .attr("value",i)
                .text(grids[i].desc));
    });

    batteryCost = $('<select name="batteryCost" id="batteryCost" class="calc-basis" />');
    $.each(batteryCosts, function(i){
	batteryCost.append(
	    $("<option/>")
		.attr("value",i)
		.text(batteryCosts[i].desc));
    });

    driveStyle = $('<select name="driveStyle" id="driveStyle" class="calc-basis" />');
    $.each(driveStyles, function(i){
	driveStyle.append(
	    $("<option/>")
		.attr("value",i)
		.text(driveStyles[i].desc))
    });

    $("#ev-canvas")
	.append(grid)
	.append(batteryCost)
	.append(driveStyle)
	.append($('<p><label>Kilometer om året:</label><input name="kmyear" value="20000" type="input" class="calc-basis" /></p>'))
	.append($('<label>Diesel:</label><input name="fuel" value="d" type="radio" class="calc-basis" checked="checked" />'))
	.append($('<label>Benzin</label><input name="fuel" value="b" type="radio" class="calc-basis" />'))
    	.append($('<p><label>Km/l:</label><input type="range" min="8" max="33" value="15" class="calc-basis" name="kml" id="kml" /></p>'))
	.append($('<div id="ev-table"/>'));

    $('.calc-basis').change(recalc);
    $.ajax({
	url: 'grids.json',
	datatype: 'json',
	success: function(data) {
	    console.log(data);
	    grids = data;
	    recalc();
	}
    });
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
    driveStyle = driveStyles[$("select[name=driveStyle]").val()];
    kmyear = $("input[name=kmyear]").val();
    chargeLoss = 1.1;

    $('#ev-table').append('<table/>');
    $('#ev-table table').append('<tr><th>Bil</th><th>Udledning, CO2e/km</th><th>Forskel, CO2e/km</th><th>Break/even ved km</th><th>Break/even ved år</th></tr>');

    $(cars).each(function(c){
	dataRow = '<td><a href="#" onclick="showCar(' + c + ')">' + cars[c].desc + '</a></td>';
	infoRow = '<td style="display: none;" class="infoRow" id="infoRow' + c + '" colspan="4">';
	infoRow += '<p>' + cars[c].desc + ' har et batteri på ' +
	    cars[c].kwh + ' kWh. ' + 'Med udgangspunkt i batteriproduktionen "' + battery.desc + '" på ' + (battery.gco2e / 1000) +
	    ' kg CO2 pr produceret kWh,vil den have en udledning ved produktion på '
	    + (battery.gco2e * cars[c].kwh / 1000000).toLocaleString('da', {maximumFractionDigits: 2}) + ' ton CO2.</p>';

	infoRow += '<p>Estimatet er med udgangspunkt i <a href="' + battery.src + '">' + battery.introductory + '</a></p>';
	infoRow += '</td>';

	co2kmEV = chargeLoss * driveStyle.factor * grid.co2kwh * cars[c].whkm / 1000;
	dataRow += '<td>' + co2kmEV.toFixed(2) + ' g</td>';
	co2diff = co2kmFuel - co2kmEV;
	dataRow += '<td>' + co2diff.toFixed(2) + ' g</td>';
	diffBreakKm = (battery.gco2e * cars[c].kwh) / co2diff;

	if (diffBreakKm > 0) {
	    diffBreakYear = diffBreakKm / kmyear;
	    dataRow += '<td>' + diffBreakKm.toLocaleString('da', {maximumFractionDigits: 0}) + ' km</td>';
	    dataRow += '<td>' + diffBreakYear.toLocaleString('da', {maximumFractionDigits: 2, minimumFractionDigits: 2}) + ' år</td>';
	}
	else {
	    dataRow += '<td>Aldrig</td>';
	}

	$('#ev-table table').append('<tr>' + dataRow + '</tr>');
	$('#ev-table table').append('<tr>' + infoRow + '</tr>');
    });
}

var showCar = function (i) {
    $('#infoRow' + i).toggle();
    return false;
}

grids = [];

/*
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
	"desc": "Polsk gennemsnitsstrøm",
	"co2kwh": 650
    },
    {
	"desc": "Tysk gennemsnitsstrøm",
	"co2kwh": 489
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
*/

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
	"desc": "VW eGolf",
	"whkm": 150,
	"kwh": 35.9
    },
    {
	"desc": "Hyundai Ioniq",
	"whkm": 125,
	"kwh": 31
    },
    {
	"desc": "Hyundai Kona electric",
	"whkm": 160,
	"kwh": 64
    },
    {
	"desc": "Renault Zoe R90",
	"whkm": 143,
	"kwh": 41
    },
    {
	"desc": "Renault Zoe Q210",
	"whkm": 143,
	"kwh": 22
    }
];

driveStyles = [
    {
	"desc": "Normal kørsel +6%",
	"factor": 1.06
    },
    {
	"desc": "Driving miss Daisy",
	"factor": 1.0
    },
    {
	"desc": "Frisk kørsel +11%",
	"factor": 1.11
    },
    {
	"desc": "Dæk er min største omkostning +15%",
	"factor": 1.15
    }
];

batteryCosts = [
    {
	"desc": "IVL high",
	"gco2e": 200000,
	"introductory": "svensk undersøgelse fra 2017",
	"src": "https://ing.dk/artikel/svensk-undersoegelse-produktion-elbilers-batterier-udleder-tonsvis-co2-200080"
    },
    {
	"desc": "IVL low",
	"gco2e": 150000,
	"introductory": "svensk undersøgelse fra 2017",
	"src": "https://ing.dk/artikel/svensk-undersoegelse-produktion-elbilers-batterier-udleder-tonsvis-co2-200080"
    },
    {
	"desc": "Ford / LG Chem",
	"gco2e": 140000,
	"introductory": "selvrapporteret af Ford / LG Chem i 2016",
	"src": "https://pubs.acs.org/doi/abs/10.1021/acs.est.6b00830"
    },    
    {
	"desc": "Teslarati",
	"gco2e": 70000,
	"introductory": "Teslarati's ekstrapolering i forhold til det Californiske el-net",
	"src": "https://www.teslarati.com/tesla-greener-think-getting-greener-look-manufacturing/"
    }
];
