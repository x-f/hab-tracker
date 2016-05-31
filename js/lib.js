// http://www.movable-type.co.uk/scripts/latlong.html
function distanceBetweenTwoPoints(lat1, lon1, lat2, lon2) {
  // dbglog("1=" + lat1 + "," + lon1);
  // dbglog("2=" + lat2 + "," + lon2);
  var R = 6371; // km
  var l1 = lat1.toRad();
  var l2 = lat2.toRad();
  var delta_lat = (lat2-lat1).toRad();
  var delta_lon = (lon2-lon1).toRad();

  var a = Math.sin(delta_lat/2) * Math.sin(delta_lat/2) +
          Math.cos(l1) * Math.cos(l2) *
          Math.sin(delta_lon/2) * Math.sin(delta_lon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  var d = R * c;
  return d.toFixed(2);
}
function bearingFromPointToPoint(lat1, lon1, lat2, lon2) {
  var y = Math.sin(lon2-lon1) * Math.cos(lat2);
  var x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1);
  var brng = Math.atan2(y, x).toDegrees();
  if (brng < 0) brng += 360;
  // dbglog("b=" + brng.toFixed(0));
  
  return brng.toFixed(0);
}
/** Extend Number object with method to convert numeric degrees to radians */
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}
/** Extend Number object with method to convert radians to numeric (signed) degrees */
if (typeof Number.prototype.toDegrees == 'undefined') {
    Number.prototype.toDegrees = function() { return this * 180 / Math.PI; };
}
//--------
// https://github.com/jamescoxon/dl-fldigi/blob/master/src/dl_fldigi/location.cxx
function calcDistanceBearingElevation(lat1, lon1, alt1, lat2, lon2, alt2) {
  
  var radius = 6371; // km
  lat1 = lat1.toRad();
  lon1 = lon1.toRad();
  lat2 = lat2.toRad();
  lon2 = lon2.toRad();

  var d_lon = lon2 - lon1;
  var sa = Math.cos(lat2) * Math.sin(d_lon);
  var sb = (Math.cos(lat1) * Math.sin(lat2)) - (Math.sin(lat1) * Math.cos(lat2) * Math.cos(d_lon));
  var bearing = Math.atan2(sa, sb);
  bearing = bearing.toDegrees();
  if (bearing < 0) bearing += 360;
  bearing = Math.round(bearing);
  //document.write("bearing=" + bearing.toFixed(1) + "<br/>");
  // dbglog("e=" + bearing.toFixed(0));
  
  var aa = Math.sqrt((sa * sa) + (sb * sb));
  var ab = (Math.sin(lat1) * Math.sin(lat2)) + (Math.cos(lat1) * Math.cos(lat2) * Math.cos(d_lon));
  var angle_at_centre = Math.atan2(aa, ab);
  var great_circle_distance = angle_at_centre * radius;
  great_circle_distance = great_circle_distance.toFixed(2);

  var ta = radius + alt1 * 0.001; // m to km
  var tb = radius + alt2 * 0.001; // m to km
  var ea = (Math.cos(angle_at_centre) * tb) - ta;
  var eb = Math.sin(angle_at_centre) * tb;
  var elevation = Math.atan2(ea, eb);
  elevation = elevation.toDegrees();
  elevation = elevation.toFixed(1);
  
  var distance = Math.sqrt((ta * ta) + (tb * tb) - 2 * tb * ta * Math.cos(angle_at_centre));
  distance = distance.toFixed(2);
  
  return {
    "distance": distance,
    "great_circle_distance": great_circle_distance,
    "bearing": bearing,
    "elevation": elevation
  };
  // document.write("g-c-distance=" + great_circle_distance + "<br/>");
  // document.write("distance=" + distance + "<br/>");
}

var notify = function (notif_title, notif_body, notif_tag, notif_icon) {
    // Check for notification compatibility.
    if (!'Notification' in window) {
        // If the browser version is unsupported, remain silent.
        return;
    }
    // Log current permission level
    // console.log(Notification.permission);
    
    // If the user has not been asked to grant or deny notifications
    // from this domain...
    if (Notification.permission === 'default') {
        Notification.requestPermission(function () {
            // ...callback this function once a permission level has been set.
            //notify();
        });
    }
    // If the user has granted permission for this domain to send notifications...
    else if (Notification.permission === 'granted') {
        var n = new Notification(
                    notif_title,
                    {
                      'body': notif_body,
                      // ...prevent duplicate notifications
                      'tag' : notif_tag,
                      'sticky': true,
                      'icon': notif_icon,
                    }
                );

        // Remove the notification from Notification Center when clicked.
        n.onclick = function () {
            this.close();
        };
        // Callback function when the notification is closed.
        n.onclose = function () {
            // console.log('Notification closed');
        };
    }
    // If the user does not want notifications to come from this domain...
    else if (Notification.permission === 'denied') {
        // ...remain silent.
        return;
    }
};


function print_r (array, return_val) {
    // http://kevin.vanzonneveld.net
    // +   original by: Michael White (http://getsprink.com)
    // +   improved by: Ben Bryan
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +      improved by: Brett Zamir (http://brett-zamir.me)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // -    depends on: echo
    // *     example 1: print_r(1, true);
    // *     returns 1: 1
    var output = '',
        pad_char = ' ',
        pad_val = 4,
        d = this.window.document,
        getFuncName = function (fn) {
            var name = (/\W*function\s+([\w\$]+)\s*\(/).exec(fn);
            if (!name) {
                return '(Anonymous)';
            }
            return name[1];
        },
        repeat_char = function (len, pad_char) {
            var str = '';
            for (var i = 0; i < len; i++) {
                str += pad_char;
            }
            return str;
        },
        formatArray = function (obj, cur_depth, pad_val, pad_char) {
            if (cur_depth > 0) {
                cur_depth++;
            }

            var base_pad = repeat_char(pad_val * cur_depth, pad_char);
            var thick_pad = repeat_char(pad_val * (cur_depth + 1), pad_char);
            var str = '';

            if (typeof obj === 'object' && obj !== null && obj.constructor && getFuncName(obj.constructor) !== 'PHPJS_Resource') {
                str += 'Array\n' + base_pad + '(\n';
                for (var key in obj) {
                    if (Object.prototype.toString.call(obj[key]) === '[object Array]') {
                        str += thick_pad + '[' + key + '] => ' + formatArray(obj[key], cur_depth + 1, pad_val, pad_char);
                    }
                    else {
                        str += thick_pad + '[' + key + '] => ' + obj[key] + '\n';
                    }
                }
                str += base_pad + ')\n';
            }
            else if (obj === null || obj === undefined) {
                str = '';
            }
            else { // for our "resource" class
                str = obj.toString();
            }

            return str;
        };

    output = formatArray(array, 0, pad_val, pad_char);

    if (return_val !== true) {
        if (d.body) {
            this.echo(output);
        }
        else {
            try {
                d = XULDocument; // We're in XUL, so appending as plain text won't work; trigger an error out of XUL
                this.echo('<pre xmlns="http://www.w3.org/1999/xhtml" style="white-space:pre;">' + output + '</pre>');
            } catch (e) {
                this.echo(output); // Outputting as plain text may work in some plain XML
            }
        }
        return true;
    }
    return output;
}
