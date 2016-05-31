<?php
// funkcijas, kas tiek izmantotas, lai telemetriju dabūtu uz spacenear.us kartes
// chase car un backup

require_once dirname(__FILE__) . "/settee/src/settee.php";

// error_reporting(E_ALL);
// ini_set("display_errors", 1);



$couchDB = null;
$couchDB_client = null;

function connect_couchDB() {
  global $couchDB, $couchDB_client;
  $couch_dsn = "http://habitat.habhub.org/";
  $couch_db = "habitat";
  $server = new SetteeServer($couch_dsn);
  $dname = $couch_db;
  $couchDB = $server->get_db($dname);
  $couchDB_client = $server->rest_client;
}

function habitat_listener_information($data) {
  connect_couchDB();
  global $couchDB, $couchDB_client;
  
  $doc = array(
    'data' => $data,
    'type' => 'listener_information',
    'time_uploaded' => gmdate("c"),
    'time_created' => gmdate("c"),
  );
  
  mylog(__FUNCTION__ . ': send: ' . print_r($doc, true));
  
  if (HABITAT_UPLOAD_ENABLED) {
    $ret = $couchDB->save($doc);

    // stdClass Object
    // (
    //     [data] => Array
    //         (
    //             [callsign] => test
    //             [radio] => HBT tests
    //             [antenna] => HBT tests
    //         )
    //
    //     [type] => listener_information
    //     [time_uploaded] => 2016-05-15T14:42:48+00:00
    //     [time_created] => 2016-05-15T14:42:48+00:00
    //     [_id] => c306e4c38cb93ff02fcb1cde6de0470f
    //     [_rev] => 1-202cdb7f575060e31d1338a4f196ec6b
    // )

    mylog(__FUNCTION__ . ': response: ' . print_r($ret, true));

    if (isset($ret->data)) {
  	  mylog(__FUNCTION__ . ': uploaded');
      return true;
      // saņem atpakaļ _id
    }	else {
  	  mylog(__FUNCTION__ . ': upload failed');
      return false;
    }
  } else {
    mylog(__FUNCTION__ . ': skipping upload');
    return true;
  }
}
function habitat_listener_telemetry($data) {
  connect_couchDB();
  global $couchDB, $couchDB_client;
  
  $doc = array(
    'data' => $data,
    'type' => 'listener_telemetry',
    'time_uploaded' => gmdate("c"),
    'time_created' => gmdate("c"),
  );
  
  mylog(__FUNCTION__ . ': send: ' . print_r($doc, true));
  
  if (HABITAT_UPLOAD_ENABLED) {
    $ret = $couchDB->save($doc);
    // stdClass Object
    // (
    //     [data] => Array
    //         (
    //             [callsign] => test
    //             [time] => 20:07:33
    //             [latitude] => 57.14822
    //             [longitude] => 24.83653
    //             [altitude] => 112
    //             [speed] => 0.56
    //             [chase] => 1
    //             [satellites] => 7
    //         )
    //
    //     [type] => listener_telemetry
    //     [time_uploaded] => 2016-05-15T14:42:48+00:00
    //     [time_created] => 2016-05-15T14:42:48+00:00
    //     [_id] => c306e4c38cb93ff02fcb1cde6de05998
    //     [_rev] => 1-bbc471e213308e0779f38de10bbb4a54
    // )

    mylog(__FUNCTION__ . ': response: ' . print_r($ret, true));

    if (isset($ret->data)) {
  	  mylog(__FUNCTION__ . ': uploaded');
      return true;
      // saņem atpakaļ _id
    }	else {
  	  mylog(__FUNCTION__ . ': upload failed');
      return false;
    }
  } else {
    mylog(__FUNCTION__ . ': skipping upload');
    return true;
  }
}


function habitat_payload_telemetry($callsign, $data, $time_rx = null) {
  connect_couchDB();
  global $couchDB, $couchDB_client;

  $data_b64 = base64_encode($data);
  $doc_id = hash("sha256", $data_b64);
  $url = "habitat/_design/payload_telemetry/_update/add_listener/" . $doc_id;

  // {"data":{"_raw":"JCRpY2FydXMsNzIyLDEyOjE4OjM2LDUyLjA3MjgyMCwwLjI1MDY2NiwyODYwOCwxOS4yNiwxNzguOCwxNy42LC0xNi42KjIwCg=="},"receivers":{"x-f":{"rig_info":{"audio_frequency":1355,"mode":"USB","reversed":false},"time_created":"2014-09-03T12:20:36+03:00","time_uploaded":"2014-09-03T12:20:36+03:00"}}}

  $doc = array(
    'data' => array(
      '_raw' => $data_b64,
    ),
    'receivers' => array(
      "$callsign" => array(
        'time_uploaded' => gmdate("c"),
        'time_created' => ($time_rx ? $time_rx : gmdate("c")),
      ),
    ),
  );
  // var_dump($doc);

  // // $ret = $couchDB_client->http_put($url, json_encode($doc));
  // $ret = array('json');
  // // var_dump($ret);
  //
  // return isset($ret['json']);

  mylog(__FUNCTION__ . ': send: ' . print_r($doc, true));
  
  if (HABITAT_UPLOAD_ENABLED) {
    $ret = $couchDB_client->http_put($url, json_encode($doc));
    // Array
    // (
    //     [json] => OK
    //     [decoded] =>
    // )

    mylog(__FUNCTION__ . ': response: ' . print_r($ret, true));

    if (isset($ret['json'])) {
  	  mylog(__FUNCTION__ . ': uploaded');
      return true;
    }	else {
  	  mylog(__FUNCTION__ . ': upload failed');
      return false;
    }
  } else {
    mylog(__FUNCTION__ . ': skipping upload');
    return true;
  }

}

function habitat_proxy($request) {
  connect_couchDB();
  global $couchDB, $couchDB_client;

  $url = trim($request, "/?");

  $doc = array();

  // mylog(__FUNCTION__ . ': send: ' . print_r($doc, true));
  mylog(__FUNCTION__ . ': uri: ' . print_r($request, true));
  
  //if (HABITAT_UPLOAD_ENABLED) {
  if (true) {
    //$ret = $couchDB_client->http_get($url);
    // Array
    // (
    //     [json] => OK
    //     [decoded] =>
    // )

    $uri = 'http://habitat.habhub.org' . $request;
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_USERAGENT, "Settee CouchDB Client/1.0");
    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_HEADER, 0);
    curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($curl, CURLOPT_TIMEOUT_MS, 2000);
    curl_setopt($curl, CURLOPT_FORBID_REUSE, false); // Connection-pool for CURL
    curl_setopt($curl, CURLOPT_URL, $uri);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'GET');

    $response = curl_exec($curl);

    mylog(__FUNCTION__ . ': response: ' . substr(print_r($response, true), 0, 200));

    return $response;
    
    // if (isset($ret['json'])) {
    //       mylog(__FUNCTION__ . ': uploaded');
    //   return true;
    // }  else {
    //       mylog(__FUNCTION__ . ': upload failed');
    //   return false;
    // }
  } else {
    mylog(__FUNCTION__ . ': skipping upload');
    return "{}";
  }

}

?>