var map;
var iconsByReftype = [];
var onclickfn;


function loadMap(options) {
	if (! options) options = {};

	if (options["onclick"])
		onclickfn = options["onclick"];

	//var startView = calculateGoodMapView(options["startobjects"]);


	map = new OpenLayers.Map("map");

	var google = new OpenLayers.Layer.Google("Google Terrain" , {type: G_PHYSICAL_MAP });
	var wms = new OpenLayers.Layer.WMS( "OpenLayers WMS", "http://labs.metacarta.com/wms/vmap0", {layers: 'basic'} );
	var ve = new OpenLayers.Layer.VirtualEarth( "VE");
   	var yahoo = new OpenLayers.Layer.Yahoo( "Yahoo");

    map.addLayers([wms, google, ve, yahoo]);

	var markerLayer = new OpenLayers.Layer.Markers("markers");
	map.addLayer(markerLayer);

	var vectorLayer = new OpenLayers.Layer.Vector("vector");
	map.addLayer(vectorLayer);

	map.addControl(new OpenLayers.Control.LayerSwitcher());
	map.addControl(new OpenLayers.Control.MousePosition());
	map.addControl(new OpenLayers.Control.NavToolbar());

	map.setCenter(new OpenLayers.LonLat(0, 0), 3);



	/* add objects to the map */

	var url = "/heurist/img/reftype/questionmark.gif";

	var sz = new OpenLayers.Size(16, 16);
	var calculateOffset = function(size) {
		return new OpenLayers.Pixel(-(size.w/2), -size.h);
	};
	var baseIcon = new OpenLayers.Icon(url, sz, null, calculateOffset);


	for (var i in HEURIST.tmap.geoObjects) {
		var geo = HEURIST.tmap.geoObjects[i];
		var record = HEURIST.tmap.records[geo.bibID];

		var highlight = false;
		if (options["highlight"]) {
			for (var h in options["highlight"]) {
				if (geo.bibID ==  options["highlight"][h]) highlight = true;
			}
		}

		if (! iconsByReftype[record.reftype]) {
			iconsByReftype[record.reftype] = baseIcon.clone();
			iconsByReftype[record.reftype].setUrl("/heurist/img/reftype/" + record.reftype + ".gif");
		}

		var marker = null;
		var polygon = null;
		switch (geo.type) {
		    case "point":
			marker = new OpenLayers.Marker(new OpenLayers.LonLat(geo.geo.x, geo.geo.y), getIcon(record).clone());
			markerLayer.addMarker(marker);
			break;

		    case "circle":
			if (window.heurist_useLabelledMapIcons) {
				addPointMarker(new GLatLng(geo.geo.y, geo.geo.x), record);
			}

			var points = [];
			for (var i=0; i < 40; ++i) {
				var x = geo.geo.x + geo.geo.radius * Math.cos(i * 2*Math.PI / 40);
				var y = geo.geo.y + geo.geo.radius * Math.sin(i * 2*Math.PI / 40);
				points.push(new OpenLayers.Geometry.Point(x, y));
			}
			polygon = new OpenLayers.Geometry.Polygon(new OpenLayers.Geometry.LinearRing(points));
			if (highlight) {
				vectorLayer.addFeatures([new OpenLayers.Feature.Vector(polygon)]); //, "#ff0000", 1, 0.5, "#ffaaaa", 0.3);
			} else {
				vectorLayer.addFeatures([new OpenLayers.Feature.Vector(polygon)]); //, "#0000ff", 1, 0.5, "#aaaaff", 0.3);
			}
			break;

		    case "rect":
			if (window.heurist_useLabelledMapIcons) {
				addPointMarker(new GLatLng((geo.geo.y0+geo.geo.y1)/2, (geo.geo.x0+geo.geo.x1)/2), record);
			}

			var points = [];
			points.push(new OpenLayers.Geometry.Point(geo.geo.x0, geo.geo.y0));
			points.push(new OpenLayers.Geometry.Point(geo.geo.x0, geo.geo.y1));
			points.push(new OpenLayers.Geometry.Point(geo.geo.x1, geo.geo.y1));
			points.push(new OpenLayers.Geometry.Point(geo.geo.x1, geo.geo.y0));
			polygon = new OpenLayers.Geometry.Polygon(new OpenLayers.Geometry.LinearRing(points));
			if (highlight) {
				vectorLayer.addFeatures([new OpenLayers.Feature.Vector(polygon)]); //, "#ff0000", 1, 0.5, "#ffaaaa", 0.3);
			} else {
				vectorLayer.addFeatures([new OpenLayers.Feature.Vector(polygon)]); //, "#0000ff", 1, 0.5, "#aaaaff", 0.3);
			}
			break;

		    case "polygon":
			if (window.heurist_useLabelledMapIcons) {
				addPointMarker(new GLatLng(geo.geo.points[1].y, geo.geo.points[1].x), record);
			}

			var points = [];
			for (var i=0; i < geo.geo.points.length; ++i) {
				points.push(new OpenLayers.Geometry.Point(geo.geo.points[i].x, geo.geo.points[i].y));
			}
			polygon = new OpenLayers.Geometry.Polygon(new OpenLayers.Geometry.LinearRing(points));
			if (highlight) {
				vectorLayer.addFeatures([new OpenLayers.Feature.Vector(polygon)]); //, "#ff0000", 1, 0.5, "#ffaaaa", 0.3);
			} else {
				vectorLayer.addFeatures([new OpenLayers.Feature.Vector(polygon)]); //, "#0000ff", 1, 0.5, "#aaaaff", 0.3);
			}
			break;

		    case "path":
			//var points = [];
			//for (var i=0; i < geo.geo.points.length; ++i)
			//	points.push(new GLatLng(geo.geo.points[i].y, geo.geo.points[i].x));
			if (highlight) {
				polygon = new GPolyline.fromEncoded({ color: "#ff0000", weight: 3, opacity: 0.8, points: geo.geo.points, zoomFactor: 3, levels: geo.geo.levels, numLevels: 21 });
			} else {
				polygon = new GPolyline.fromEncoded({ color: "#0000ff", weight: 3, opacity: 0.8, points: geo.geo.points, zoomFactor: 3, levels: geo.geo.levels, numLevels: 21 });
			}

			if (window.heurist_useLabelledMapIcons) {
				addPointMarker(polygon.getVertex(Math.floor(polygon.getVertexCount() / 2)), record);
			}

			break;
		}

/*
		if (marker) {
			marker.record = record;
			if (! record.overlays) record.overlays = [];
			record.overlays.push(marker);
			map.addOverlay(marker);
			GEvent.addListener(marker, "click", markerClick);
		}
		else if (polygon) {
			polygon.record = record;
			if (! record.overlays) record.overlays = [];
			record.overlays.push(polygon);
			map.addOverlay(polygon);
			GEvent.addListener(polygon, "click", polygonClick);
		}
*/
	}
}


function calculateGoodMapView(geoObjects) {
	var minX, minY, maxX, maxY;
	if (! geoObjects) geoObjects = HEURIST.tmap.geoObjects;
	for (var i=0; i < geoObjects.length; ++i) {
		var geo = geoObjects[i];
		var bbox = (geo.type == "point")? { n: geo.geo.y, s: geo.geo.y, w: geo.geo.x, e: geo.geo.x } : geo.geo.bounds;

		if (i > 0) {
			if (bbox.w < minX) minX = bbox.w;
			if (bbox.e > maxX) maxX = bbox.e;
			if (bbox.s < minY) minY = bbox.s;
			if (bbox.n > maxY) maxY = bbox.n;
		}
		else {
			minX = bbox.w;
			maxX = bbox.e;
			minY = bbox.s;
			maxY = bbox.n;
		}
	}

	var centre = new GLatLng(0.5 * (minY + maxY), 0.5 * (minX + maxX));
	if (maxX-minX < 0.000001  &&  maxY-minY < 0.000001) {       // single point, or very close points
		var sw = new GLatLng(minY - 0.1, minX - 0.1);
		var ne = new GLatLng(maxY + 0.1, maxX + 0.1);
	}
	else {
		var sw = new GLatLng(minY - 0.1*(maxY - minY), minX - 0.1*(maxX - minX));
		var ne = new GLatLng(maxY + 0.1*(maxY - minY), maxX + 0.1*(maxX - minX));
	}
	var zoom = map.getBoundsZoomLevel(new GLatLngBounds(sw, ne));

	return { latlng: centre, zoom: zoom };
}


function markerClick() {
	var record = this.record;

	if (onclickfn) {
		onclickfn(record, this, this.getPoint());
	} else {
		var html = "<b>" + record.title + "&nbsp;&nbsp;&nbsp;</b>";
		if (record.description) html += "<p style='height: 128px; overflow: auto;'>" + record.description + "</p>";
		html += "<p><a target=_new href='/heurist/resource/" + record.bibID + "'>/heurist/resource/" + record.bibID + "</a></p>";
		this.openInfoWindowHtml(html);
	}
}

function polygonClick(point) {
	var record = this.record;
	if (onclickfn) {
		onclickfn(record, this, point);
	} else {
		var html = "<b>" + record.title + "&nbsp;&nbsp;&nbsp;</b>";
		if (record.description) html += "<p style='height: 128px; overflow: auto;'>" + record.description + "</p>";
		html += "<p><a target=_new href='/heurist/resource/" + record.bibID + "'>/heurist/resource/" + record.bibID + "</a></p>";
		map.openInfoWindowHtml(point, html);
	}
}



var iconNumber = 0;
var legendIcons;
function getIcon(record) {
	if (! window.heurist_useLabelledMapIcons) {
		return iconsByReftype[record.reftype];
	}
	if (! legendIcons) {
		var protoLegendImgs = document.getElementsByTagName("img");
		var legendImgs = [];
		legendIcons = {};

		var mainLegendImg;
		for (var i=0; i < protoLegendImgs.length; ++i) {
			if (protoLegendImgs[i].className === "main-map-icon") {
				mainLegendImg = protoLegendImgs[i];
			}
			else if (protoLegendImgs[i].className === "map-icons") {
				legendImgs.push(protoLegendImgs[i]);
			}
		}

		var baseIcon = new GIcon();
			baseIcon.image = url;
			baseIcon.shadow = "/heurist-test/img/maps-icons/circle-shadow.png";
			baseIcon.iconAnchor = new GPoint(10, 10);
			baseIcon.iconWindowAnchor = new GPoint(10, 10);
			baseIcon.iconSize = new GSize(20, 20);
			baseIcon.shadowSize = new GSize(29, 21);

		if (mainLegendImg) {
			var icon = new GIcon(baseIcon);
			icon.image = "/heurist-test/img/maps-icons/circleStar.png";
			var bibID = (mainLegendImg.id + "").replace(/icon-/, "");
			legendIcons[bibID] = icon;
			icon.associatedLegendImage = mainLegendImg;

			mainLegendImg.style.backgroundImage = "url(" + icon.image + ")";
		}

		for (i=0; i < legendImgs.length; ++i) {
			var iconLetter;
			if (i < 26) {
				iconLetter = String.fromCharCode(0x41 + i);
			}
			else {
				iconLetter = "Dot";
			}
			var url = "/heurist-test/img/maps-icons/circle" + iconLetter + ".png";

			var icon = new GIcon(baseIcon);
			icon.image = url;

			var bibID = (legendImgs[i].id + "").replace(/icon-/, "");

			legendIcons[ bibID ] = icon;
			legendImgs[i].style.backgroundImage = "url(" + url + ")";
		}
	}

	if (legendIcons[ record.bibID ]) {
		if (legendIcons[record.bibID].associatedLegendImage) {
			legendIcons[record.bibID].associatedLegendImage.style.display = "";
		}
		return legendIcons[ record.bibID ];
	}
	else {
		return iconsByReftype[record.reftype];
	}
}


function addPointMarker(latlng, record) {
	var marker = new GMarker(latlng, getIcon(record));
	if (! record.overlays) { record.overlays = []; }
	record.overlays.push(marker);
	map.addOverlay(marker);
}
