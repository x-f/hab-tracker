var updates_max = 1000;
// var updates_max = 1;
var updates_lastid = 0;
var updates_interval = 2; // seconds

// ping
// telemetry to habitat upload retries
var ping_interval = 30; // seconds


var map = L.map('map').setView([57, 24], 8);

//------------------------------------------

var osm = new L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 2,
    maxZoom: 19
});
var qst = new L.TileLayer('http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {attribution:'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"/>'});


// var OpenStreetMap_Mapnik = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
// });
var Esri_WorldTopoMap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
});
var Esri_WorldImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// map.addLayer(osm);
map.addLayer(qst);
//map.addLayer(OpenStreetMap_Mapnik);
//map.addLayer(Esri_WorldTopoMap);
//map.addLayer(Esri_WorldImagery);

map.addControl(new L.Control.Scale({width: 100, position: 'bottomleft'}));
// map.addControl(new L.Control.Permalink());
// map.addControl(new L.Control.Edit());

map.addControl(new L.Control.Layers({
  'OSM': osm,
  'MapQuest': qst,
  'Google, Sat': new L.Google(),
  // 'Mapnik': OpenStreetMap_Mapnik,
  'Esri, Sat': Esri_WorldImagery,
  'Esri, Topo': Esri_WorldTopoMap
}));

//--------------------------------------------------------------------

var payloads = {};

var track_colors = new Array("#FF8000", "#D50000", "#00aa00", "#0000ff", "#D50080", "#000000");

var gps_marker = null;
var gps_layer = null;
var gps_marker_icon_car = L.MakiMarkers.icon({icon: "car", color: "#b0b", size: "m"});
var gps_marker_icon_static = L.MakiMarkers.icon({icon: "lighthouse", color: "#b0b", size: "m"});
var gps_position_static = false;

var gps_polyline = null;

var track_payload = "";

var gps_update_on = false;
var gps_upload_on = false;
var gpsupdateintvl = null;
var gpsuploadintvl = null;
var gps_data = {};
var gps_time_prev = "";


function gps_update() {
  //dbglog("gps_update=1");
  $.get("./gps/gps-position.json?" + Math.random(), function(gps) {
    //dbglog("gps_update=2");
    var gps_txt = "";
    if (!gps_position_static) {

      if (gps_time_prev == gps.time) {
        notify("HAB tracker", "GPS has gone away!", "hbt-gps");      
        gps_txt += "<span class='warn'>";
      }
      gps_txt += "<strong>Laiks:</strong> " + gps.time;
      if (gps_time_prev == gps.time) { 
        gps_txt += "</span>";
      }
      gps_txt += "<br/>";

      gps_time_prev = gps.time;
    }
    gps_txt += "<strong>Koordinātas:</strong> " + gps.latitude + " " + gps.longitude;
    gps_txt += "<br/>";
    gps_txt += "<strong>Augstums:</strong> " + gps.altitude + " m";
    gps_txt += "<br/>";
    if (gps_position_static) {
      gps_txt += "<a href='#' onclick='alert(\"dummy link\"); return false;'>labot koordinātas</a>";
    }
    if (!gps_position_static) {
      gps_txt += "<strong>Ātrums:</strong> " + gps.speed + " km/h";
      gps_txt += "<br/>";
      if (gps.satellites < 4)
        gps_txt += "<span class='warn'>";
      gps_txt += "<strong>Satelīti:</strong> " + gps.satellites;
      if (gps.fixq > 1) {
        gps_txt += " (" + gps.fixq + "D)";
        gps_data = gps;
      }
      if (gps.sats < 4)
        gps_txt += '</span>';
    }
    if (gps.fixq > 1) {
      gps_data = gps;

      for (var payload in payloads)
        calculateDistanceBearingElevation(payload);
        
    }
    //dbglog("gps_update=3 " + print_r(gps_data, true));
    
    $("#gps-position").html(gps_txt);
    
    /*var txIcon = L.divIcon({
           iconSize: [50,50],
           className: 'leaflet-txpulse-anim'
       });*/

    if (gps.satellites > 2) {

      if (!gps_marker) {
        gps_marker = L.marker([gps.latitude, gps.longitude], {icon: gps_marker_icon_car});
        //gps_marker_layer = L.layerGroup([gps_marker]);
        //map.addLayer(gps_marker_layer);
        /*markertx = L.marker([gps.latitude, gps.longitude], {
                                        icon: txIcon,
                                        zIndexOffset: -1000
                                    }).addTo(map);*/
      } else {
        gps_marker.setLatLng([gps.latitude, gps.longitude]);
      }
      if (gps_position_static)
        gps_marker.setIcon(gps_marker_icon_static);
      else
        gps_marker.setIcon(gps_marker_icon_car);
      
      if (!gps_position_static) {
        if (!gps_polyline)
          gps_polyline = L.polyline([[gps.latitude, gps.longitude],[gps.latitude, gps.longitude]], {color: '#b0b', weight: 3, opacity: .6});//.addTo(map);
        else
          gps_polyline.addLatLng([gps.latitude, gps.longitude]);
      }
      
      gps_data = gps;

      if (!gps_layer) {
        gps_layer = L.layerGroup([gps_marker]);
        gps_layer.addLayer(gps_polyline);
        map.addLayer(gps_layer);
      }

      if (track_payload == "gps")
        map_panTo("gps");
    }      
  });
}

function gps_loadTrack() {
  $.ajax({
    // data: "max=" + updates_max + "&pid=" + updates_lastid,
    dataType: "json",
    type: "GET",
    url: "./data/listener-telemetry.php?history",
    timeout: 3000,
    beforeSend: function() {
      // clearTimeout(updates_timeout);
      // $("#status_bar").html("<span class='status-default'>Pieprasu atjauninājumus..</span>");
    },
    success: function(positions) {
      // alert(positions);
      if (typeof (positions.length) != "undefined" && positions.length) {

        // alert(print_r(positions, true));
        for (var i = 0; i < positions.length; i++) {
          var gps = positions[i];
          
          // saglabā un zīmē tikai, ja fix ir labs
          if (gps.satellites > 2) {

            if (!gps_marker) {
              gps_marker = L.marker([gps.latitude, gps.longitude], {icon: gps_marker_icon_car});//.addTo(map);
            } else {
              gps_marker.setLatLng([gps.latitude, gps.longitude]);
            }
            if (gps.chase == 0)
              gps_marker.setIcon(gps_marker_icon_static);
            else
              gps_marker.setIcon(gps_marker_icon_car);
      
            if (gps.chase != 0) {
              if (!gps_polyline) {
                gps_polyline = L.polyline([[gps.latitude, gps.longitude],[gps.latitude, gps.longitude]], {color: '#b0b', weight: 3, opacity: .6});//.addTo(map);
                //gps_layer = L.layerGroup([gps_polyline]);
              } else
                gps_polyline.addLatLng([gps.latitude, gps.longitude]);
            }

          
            if (track_payload == "gps")
              map_panTo("gps");
          }
        }
        gps_layer = L.layerGroup([gps_marker]);
        gps_layer.addLayer(gps_polyline);
        map.addLayer(gps_layer);

      } else {
        // $("#status_bar").html("<span class='status-default'>Nav jaunākas informācijas</span>");
      }
      //resizeContainer();
    },
    complete: function() {
      // updates_timeout = setTimeout(payloads_update, updates_interval * 1000);
    }
  });
}


function initPayload(payload, position) {
  // alert(print_r(position, true));
  payloads[payload] = {};
  var color_idx = Object.keys(payloads).length-1 % track_colors.length;
  // payloads[payload].track_color = color_idx;
  // payloads[payload].track_visible = true;
  // payloads[payload].positions = new Array();
  payloads[payload].last_position = new Array();
  
  payloads[payload].track = L.polyline([[position.latitude, position.longitude], [position.latitude, position.longitude]], {color: track_colors[color_idx], weight: 3, opacity: .6});//.addTo(map);

  var marker_icon = L.MakiMarkers.icon({icon: "rocket", color: track_colors[color_idx], size: "m"});
  payloads[payload].marker = L.marker([position.latitude, position.longitude], {icon: marker_icon});//.addTo(map);
  
  payloads[payload].layer = L.layerGroup([payloads[payload].marker]);
  payloads[payload].layer.addLayer(payloads[payload].track);
  map.addLayer(payloads[payload].layer);
        
  // infolodziņš
  var _txt = "";
  _txt += "<div id='" + payload + "' class='payload'>";
  _txt += "<div class='payload-title' onclick='$(\"#" + payload + "\ .payload-container\").toggle(); return false;'>" + payload + "<span></span></div>";
  _txt += "<div class='payload-container'>";
  _txt += "<div class='payload-info'></div>";
  _txt += "<div class='info-links'>";
  _txt += "<a href='#' onclick='return map_panTo(\"" + payload + "\");'>centrēt</a> ";
  _txt += "<a href='#' class='map_follow' onclick='return map_follow(\"" + payload + "\");'>sekot</a> ";
  _txt += "<a href='#' class='map_toggle' onclick='return map_toggle(\"" + payload + "\");'>slēpt</a> ";
  _txt += "</div>"; // links
  _txt += "<div class='dstncbrng'></div>";
  _txt += "</div>"; // container
  _txt += "</div>";
  $("#payloads").append(_txt);
  
  $('.payload#' + payload + ' .payload-title span').css('background-color', track_colors[color_idx]);
  // $('.payload#' + payload + ' .payload-title span').css('box-shadow-color', track_colors[color_idx]);
}

function payloads_update() {
  $.ajax({
    data: "max=" + updates_max + "&pid=" + updates_lastid,
    dataType: "json",
    type: "GET",
    url: "./data/get-decodes.php",
    timeout: 3000,
    beforeSend: function() {
      // clearTimeout(updates_timeout);
      // $("#status_bar").html("<span class='status-default'>Pieprasu atjauninājumus..</span>");
    },
    success: function(positions) {
      // alert(positions);
      if (typeof (positions.length) != "undefined" && positions.length) {

        // alert(print_r(positions, true));
        for (var i = 0; i < positions.length; i++) {
          var position = positions[i];
          // alert(print_r(position, true));
          // pārbauda, vai jau ir tāds aparāts
          // ja nav, pievieno
          // ja ir jauns, izveido jaunu polyline, saglabā referenci
          if (typeof(payloads[position.payload]) == "undefined") {
            initPayload(position.payload, position);
          }

          // saglabā un zīmē tikai, ja fix ir labs
          if (position.satellites > 2) {
            // payloads[position.payload].positions.push(position);
            payloads[position.payload].last_position = position;

            payloads[position.payload].track.addLatLng([position.latitude, position.longitude]);
            payloads[position.payload].marker.setLatLng([position.latitude, position.longitude]);
          }          
          updates_lastid = position.id;
        
          var _txt = "";
          _txt += "<strong>Laiks:</strong> " + position.time;
          _txt += "<br/>";
          _txt += "<strong>Koordinātas:</strong> " + position.latitude + " " + position.longitude;
          _txt += "<br/>";
          _txt += "<strong>Augstums:</strong> " + position.altitude + " m";
          _txt += "<br/>";
          _txt += "<strong>Ātrums:</strong> " + position.speed + " km/h";
          _txt += "<br/>";
          if (position.sats < 4)
            _txt += "<span class='warn'>";
          _txt += "<strong>Satelīti:</strong> " + position.satellites;
          // if (gps.fixq > 1) {
          //   gps_txt += " (" + gps.fixq + "D)";
          //   gps_data = gps;
          // }
          if (position.sats < 4)
            _txt += '</span>';
          $(".payload#" + position.payload + " .payload-info").html(_txt);
          
          if (track_payload == position.payload && position.satellites > 2)
            map_panTo(position.payload);
            
          calculateDistanceBearingElevation(position.payload);
          
          //if (i == 2) break;
        }
        
      } else {
        // $("#status_bar").html("<span class='status-default'>Nav jaunākas informācijas</span>");
      }
      //resizeContainer();
    },
    complete: function() {
      updates_timeout = setTimeout(payloads_update, updates_interval * 1000);
    }
  });
}

function calculateDistanceBearingElevation(payload) {
  if (gps_update_on && typeof gps_data.latitude != "undefined") {
    var position = payloads[payload].last_position;

    var result = calcDistanceBearingElevation(gps_data.latitude, gps_data.longitude, gps_data.altitude, position.latitude, position.longitude, position.altitude);
    
    var txt = "";
    txt += "<span onmouseover='$(this).find(\"span\").text($(this).attr(\"data-gcdistance\"));' onmouseout='$(this).find(\"span\").text($(this).attr(\"data-distance\"));' data-gcdistance='" + result.great_circle_distance + "' data-distance='" + result.distance + "'><strong>Attālums:</strong> <span>" + result.distance + "</span> km</span>";
    //txt += "<br/>";
    txt += ", <strong>virziens:</strong> " + result.bearing + "°";
    txt += "<br/>";
    txt += "<strong>Augstums virs horizonta:</strong> " + result.elevation + "°";
    $("#" + position.payload + " .dstncbrng").html(txt);
  }
  
}

$(document).ready(function () {
  
  gps_loadTrack();
  
  payloads_update();
  // setInterval(function() {
  //   payloads_update();
  // }, 1000 * updates_interval);
  
  $('#gps-update-intvl').change(function() {
    gps_update_ctl();
    return false;
  });
  $('#gps_update').click(function() {
    gps_update_on = !gps_update_on;
    gps_update_ctl();
    return false;
  });
  $('#gps-upload-intvl').change(function() {
    gps_upload_ctl();
    return false;
  });
  
  // ping
  setInterval(function () {
    $.ajax({
      url: "./data/ping.php",
      timeout: 1000,
      beforeSend: function() {},
      success: function() {},
    });
  }, 1000 * ping_interval);
  
});

function map_panTo(payload) {
  if (payload == "gps") {
    //dbglog(print_r(gps_data, true));
    map.panTo([gps_data.latitude, gps_data.longitude]);
  } else {
    map.panTo([payloads[payload].last_position.latitude, payloads[payload].last_position.longitude]);
  }
  return false;
}
function map_follow(payload) {
  if ($('#' + payload + ' .map_follow').hasClass('active') == true) {
    $('#' + payload + ' .map_follow').removeClass('active');
    track_payload = "";
  } else {
    $('.map_follow').removeClass('active');
    $('#' + payload + ' .map_follow').addClass('active');
    track_payload = payload;
  }
  return false;
}
/*function map_showHideTrack(payload) {
  if (payload == "gps") {
    gps_polyline.remove
    //dbglog(print_r(gps_data, true));
    map.panTo([gps_data.latitude, gps_data.longitude]);
  } else {
    map.panTo([payloads[payload].last_position.latitude, payloads[payload].last_position.longitude]);
  }
  return false;
}*/
function map_toggle(payload) {
  //alert("rm");
  //map.removeLayer(gps_layer);
  var _layer = (payload == "gps" ? gps_layer : payloads[payload].layer);
  
  if (map.hasLayer(_layer)) {
    map.removeLayer(_layer);
    $("#" + payload + " a.map_toggle").text("rādīt").addClass("active");
  } else {
    map.addLayer(_layer);
    $("#" + payload + " a.map_toggle").text("slēpt").removeClass("active");
  }
    
  /*if (_layer.hasLayer(gps_polyline)) {
    _layer.removeLayer(gps_polyline);
    $("#" + payload + " a.map_toggle").text("rādīt");
  } else {
    _layer.addLayer(gps_polyline);
    $("#" + payload + " a.map_toggle").text("slēpt");
  }*/
  return false;
}


/*function __gps_update_ctl() {
  if (gpsupdateintvl) {
    clearInterval(gpsupdateintvl);
    gpsupdateintvl = null;
  }
  if (gps_update_on) {
    gps_update();
    gpsupdateintvl = setInterval(function () {
      gps_update();
    }, 1000 * $('#gps-update-intvl option:selected').val());
    $("#gps_update").html("izslēgt");
  } else {
    $("#gps_update").html("ieslēgt");
  }
}*/
function gps_update_ctl() {
  var interval = $('#gps-update-intvl option:selected').val();
  if (gpsupdateintvl) {
    clearInterval(gpsupdateintvl);
    gpsupdateintvl = null;
  }
  gps_position_static = (interval == 9999);

  if (interval > 0) {
    gps_update();
    if (!gps_position_static) {
      gpsupdateintvl = setInterval(function () {
        gps_update();
      }, 1000 * interval);
    }
    gps_update_on = true;
  } else {
    gps_update_on = false;
  }
  // alert(interval + gps_update_on);

  if (gps_position_static)
    $("#gps .map_follow, #gps .map_center").addClass("hidden");
  else if (gps_update_on)
    $("#gps .map_follow, #gps .map_center").removeClass("hidden");

}

function gps_upload_ctl() {
  var interval = $('#gps-upload-intvl option:selected').val();
  if (gpsuploadintvl) {
    clearInterval(gpsuploadintvl);
    gpsuploadintvl = null;
  }
  if (interval > 0) {
    gps_upload();
    gpsuploadintvl = setInterval(function () {
      gps_upload();
    }, 1000 * interval);
    gps_upload_on = true;
  } else {
    gps_upload_on = false;
  }
  // alert(interval + gps_upload_on);
}
function gps_upload() {
  if (gps_update_on) {
    // alert("uploading GPS data");
    $.ajax({
      // _chase
      data: "listener=" + "" + "&time=" + gps_data.time + "&latitude=" + gps_data.latitude + "&longitude=" + gps_data.longitude + "&altitude=" + gps_data.altitude + "&speed=" + gps_data.speed + "&satellites=" + gps_data.satellites + "&chase=" + (gps_position_static ? 0 : 1),
      dataType: "json",
      type: "POST",
      url: "./data/listener-telemetry.php",
      timeout: 1000,
      beforeSend: function() {
        // clearTimeout(updates_timeout);
        // $("#status_bar").html("<span class='status-default'>Pieprasu atjauninājumus..</span>");
      },
      success: function() {},
    });
  }  
}


$(document).ready(function () {
  $("body").append("<div id='dev'></div>");
});
function dbglog(str) {
  $("#dev").append(str + "<br/>");
}


function onMouseMove(e) {
  //console.log(e.latlng.lat + ", " + e.latlng.lng);
  $("#map-coordinates").html(e.latlng.lat.toFixed(5) + ", " + e.latlng.lng.toFixed(5));
}
map.on('mousemove', onMouseMove);