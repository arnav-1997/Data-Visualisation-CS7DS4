var width = 1600
var height = 500

function getTemp(minardData) {
    min = Number.MAX_VALUE
    max = 0

    minardData.forEach(function (item, index, array) {
        temp = parseInt(item.TEMP)
        if (temp < min) { min = temp }

        if (temp > max) { max = temp }
    })

    return [min, max]
}

function getSurvivors(minardData) {
    min = Number.MAX_VALUE
    max = Number.MIN_VALUE

    minardData.forEach(function (item, index, array) {
        surv = parseInt(item.SURV)
        if (surv < min) { min = surv }
        if (surv > max) { max = surv }
    })

    return [min, max]
}

function minardsMap() {
    var pathJson = {
        'type': 'FeatureCollection',
        'features': []
    }

    locationJson = {
        'type': 'FeatureCollection',
        'features': []
    }

    d3.json('minard-data.json')
        .then(function (d) {

        temp = getTemp(d)
        minTemp = temp[0]
        maxTemp = temp[1]

        surv = getSurvivors(d)
        minSurv = surv[0]
        maxSurv = surv[1]

        d.forEach(function (item, index, array) {
            if (item.LATC != "" && item.LONC != "") {
                locationJson.features.push({
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [parseFloat(item.LONC), parseFloat(item.LATC)]
                    },
                    'properties': {
                        'name': item.CITY
                    }
                })
            }

            if (index < array.length - 1) {
                pathJson.features.push({
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [[parseFloat(item.LONP), parseFloat(item.LATP)], [parseFloat(array[index + 1].LONP), parseFloat(array[index + 1].LATP)]]
                    },
                    'properties': {
                        'div': item.DIV,
                        'dir': item.DIR,
                        'surv': item.SURV,
                        'temp': item.TEMP
                    }
                })
            }
        });

        var canvas = d3.select('.minards-map').append('svg')
            .attr('width', width)
            .attr('height', height);
        console.log(height);

        var colorScale = d3.interpolateRgb('red', '#ffafaf')

        var centroidLoc = d3.geoCentroid(locationJson);
        var projLoc = d3.geoMercator().center(centroidLoc).scale(4000).translate([width / 3, height / 2]);
        var pathLoc = d3.geoPath().projection(projLoc);

        var centroidTravel = d3.geoCentroid(pathJson);
        var projTravel = d3.geoMercator().center(centroidTravel).scale(4000).translate([width / 3, height / 2]);
        var pathTravel = d3.geoPath().projection(projTravel);

        canvas.selectAll('path')
            .data(pathJson.features)
            .enter()
            .append('path')
            .attr('d', pathTravel)
            .attr('stroke', function (d) {
                var division = d.properties.div
                var temp = d.properties.temp == '' ? minTemp : d.properties.temp
                if (division === '1') return colorScale(temp / minTemp)

                else if (division === '2') return 'green'

                else return 'darkblue'
            })
            .attr('stroke-width', function (d) {
                var surv = parseInt(d.properties.surv)
                console.log(d);
                if (d.properties.div === '1') return (15 * surv / 340000)

                else if (d.properties.div === '2') return (8 * surv / 60000)

                else return (8 * surv / 22000)
            })
            .attr('stroke-dasharray', function (d) {
                if (d.properties.dir === 'R') return [3, 3]

                else return null
            })
            .attr('stroke-opacity', 0.75)
            .attr('fill-opacity', 0.0)

        canvas.append('path')
            .datum(locationJson)
            .attr('d', pathLoc)
            .attr('fill', 'red');
        
        console.log(d);

        var label = canvas.selectAll('text')
            .data(locationJson.features)
            .enter()
            .append('text')
            .attr('transform', function (d) { return "translate(" + pathLoc.centroid(d) + ")"; })
            .attr('dy', 7) // vertical offset
            .attr('dx', 5) // horizontal offset
            .text(function (d) { return d.properties.name; });
    });
}

