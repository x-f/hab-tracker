<?php

require_once dirname(__FILE__) . '/../includes/prepend.php';


$logfile = dirname(__FILE__) . '/../_logs/listener.log';

$log = "\n--------------------------";
$log .= "\n[" . gmdate('Y-m-d H:i:s') . "] ";
$log .= print_r($_GET, true);// . "\n";
$log .= print_r($_POST, true) . "\n";

$fp = fopen($logfile, "a");
fwrite($fp, $log);
fclose($fp);


if (isset($_GET['history'])) {

  $position_id = (isset($_GET['pid']) ? intval($_GET['pid']) : 0);
  $max_positions = (isset($_GET['max']) ? intval($_GET['max']) : 0);

  $sqlstr = '
    SELECT
      *
    FROM
      listener_positions
    WHERE
      id > ' . $DB->quoteSmart($position_id) . '
      -- AND payload = "LAASE"
    ORDER BY
      id ASC';
  if ($max_positions) 
    $sqlstr .= '
      LIMIT ' . $max_positions;
  $res = $DB->getAll($sqlstr);

  $data = array();
  foreach ($res as $item) {
    // unset($item->sentence);
    // unset($item->uploaded);
    $item->latitude = (float)$item->latitude;
    $item->longitude = (float)$item->longitude;
    $data[] = $item;
  }

  echo json_encode($data);
}


if (isset($_POST['listener']) && isset($_POST['satellites']) && intval($_POST['satellites']) > 2) {
    
  // $listener = $_POST['listener'];
  $listener = LISTENER_CALLSIGN;
  $time = $_POST['time'];
  $latitude = $_POST['latitude'];
  $longitude = $_POST['longitude'];
  $altitude = $_POST['altitude'];
  $speed = $_POST['speed'];
  $satellites = $_POST['satellites'];
  // vai tā ir kustīga pozīcija
  $chase = isset($_POST['chase']) && intval($_POST['chase']) == 1 ? 1 : 0;
  
  // $listener = "Dream";
  //$latitude += 1.11;
  //$longitude += 1.21;
  
  $sqlstr = '
    INSERT INTO
      listener_positions
    SET
      listener = ' . $DB->quoteSmart($listener) . ',
      time = ' . $DB->quoteSmart($time) . ',
      latitude = ' . $DB->quoteSmart($latitude) . ',
      longitude = ' . $DB->quoteSmart($longitude) . ',
      altitude = ' . $DB->quoteSmart($altitude) . ',
      speed = ' . $DB->quoteSmart($speed) . ',
      satellites = ' . $DB->quoteSmart($satellites) . ',
      chase = ' . $DB->quoteSmart($chase) . ',
      ts = NOW()';
  $DB->query($sqlstr);


  require_once dirname(__FILE__) . '/../includes/functions-habitat.php';

  $data = array(
    "callsign" => $listener,
    // "name" => $listener,
    // "location" => "test location",
    "radio" => LISTENER_RADIO,
    "antenna" => LISTENER_ANTENNA,
  );

  mylog("listener_information");
  // mylog(print_r($data, true));

  try {
    $habitat_upload = habitat_listener_information($data);
  } catch (Exception $e) {
    mylog('Caught exception: ' . $e->getMessage());//, "\n";
    $habitat_upload = false;
  }

  //-------------------------------
  
  $data = array(
    "callsign" => $listener,
    "time" => $time,
    "latitude" => $latitude,
    "longitude" => $longitude,
    "altitude" => $altitude,
    // "altitude" => -12,
    "speed" => round($speed / 3.6, 2), // km -> m/s
    "chase" => ($chase ? true : false),
    "satellites" => $satellites,
  );
	
  mylog("upload listener_telemetry");
  // mylog(print_r($data, true));

  try {
    $habitat_upload = habitat_listener_telemetry($data);
  } catch (Exception $e) {
    mylog('Caught exception: ' . $e->getMessage());//, "\n";
    $habitat_upload = false;
  }


  $fp = fopen($logfile, "a");
  fwrite($fp, $sqlstr . "\n");
  fwrite($fp, mysql_error());
  fwrite($fp, print_r($data, true));
  fwrite($fp, $habitat_upload ? "ok" : "fail");
  fclose($fp);

}
  
?>