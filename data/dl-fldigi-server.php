<?php
// http://habitat.habhub.org

require_once dirname(__FILE__) . '/../includes/prepend.php';
require_once dirname(__FILE__) . "/../includes/functions-habitat.php";


$logfile = dirname(__FILE__) . '/../_logs/dl-fldigi-server.log';

if (isset($_POST['data'])) {
  $str = $_POST['data'];
} else {
  // PUT data comes in on the stdin stream
  $putdata = fopen("php://input", "r");
  // Read the data 1 KB at a time and write to the file
  $str = "";
  while ($data = fread($putdata, 1024))
    $str .= $data;
  fclose($putdata);
}

$log = "\n[" . gmdate('Y-m-d H:i:s') . "] ";
if (isset($_SERVER['PATH_INFO'])) $log .= "path=" . print_r($_SERVER['PATH_INFO'], true) . "\n";
if (isset($_SERVER['QUERY_STRING'])) $log .= "query=" . print_r($_SERVER['QUERY_STRING'], true) . "\n";
// $log .= print_r($_SERVER, true) . "\n";
//$log .= print_r($_POST, true) . "\n";
//$log .= print_r($_GET, true) . "\n";
$log .= "data=" . $str . "\n";

$fp = fopen($logfile, "a");
fwrite($fp, $log);
fclose($fp);


$data = json_decode($str);

// not my type of telemetry!
if (!isset($data->data->_raw)) { 
  //echo "proxy to habitat"; 

  $request = $_SERVER['PATH_INFO'] . ($_SERVER['QUERY_STRING'] ? "?" . rawurldecode($_SERVER['QUERY_STRING']) : "");

  try {
    $response = habitat_proxy($request);
  } catch (Exception $e) {
    mylog('Caught exception: ' . $e->getMessage());//, "\n";
    $habitat_upload = false;
  }


  $fp = fopen($logfile, "a");
  fwrite($fp, "proxy to habitat\n");
  fwrite($fp, "request=" . $request . "\n");
  fwrite($fp, "response=" . substr(print_r($response, true), 0, 200) . "\n");
  fclose($fp);
  
  header('Content-Type: application/json');
  echo $response;
  exit;
}


// saformē pieteikumu
$tm = base64_decode($data->data->_raw);
$tm = trim($tm);
$tmd = "";

if (strpos($tm, "*") !== false && strpos($tm, "\n") === false) {
  $tm_sentence = substr($tm, 2, strpos($tm, "*")-2);
  $tm_checksum = substr($tm, strpos($tm, "*")+1);
  // $tmd .= "\nsentence=" . $tm_sentence;
  // $tmd .= "\nchecksum=" . $tm_checksum;
  
  $cs = str_pad(strtoupper(dechex(CRC16Normal($tm_sentence))), 4, "0", STR_PAD_LEFT);
  if ($cs == $tm_checksum) {
    // $tmd .= "\nOK";
    
    $fields = explode(",", $tm_sentence);
    $payload = $fields[0];
    $sequence = $fields[1];
    $time = $fields[2];
    $lat = $fields[3];
    $lon = $fields[4];
    $alt = $fields[5];
    $speed = $fields[6];
    $sats = $fields[7];
    
    $sqlstr = '
      INSERT INTO
        dlfldigi_proxy
      SET
        ts = NOW(),
        sentence = ' . $DB->quoteSmart($tm) . ',
        payload = ' . $DB->quoteSmart($payload) . ',
        sequence = ' . $DB->quoteSmart($sequence) . ',
        time = ' . $DB->quoteSmart($time) . ',
        latitude = ' . $DB->quoteSmart($lat) . ',
        longitude = ' . $DB->quoteSmart($lon) . ',
        altitude = ' . $DB->quoteSmart($alt) . ',
        speed = ' . $DB->quoteSmart($speed) . ',
        satellites = ' . $DB->quoteSmart($sats);
    $DB->query($sqlstr);
    $row_id = mysql_insert_id();

    /*
    $payload = $fields[0] . '-2';
    $time = date("H:i:s", strtotime(date("Y-m-d ") . $fields[2]) + 15*60+3*60*60);
    $lat = $fields[3] + 0.123;
    $lon = $fields[4] - 0.123;
    $alt = $fields[5] + rand(10, 50);
    
    $sqlstr = '
      INSERT INTO
        dlfldigi_proxy
      SET
        ts = NOW(),
        sentence = ' . $DB->quoteSmart($tm) . ',
        payload = ' . $DB->quoteSmart($payload) . ',
        time = ' . $DB->quoteSmart($time) . ',
        latitude = ' . $DB->quoteSmart($lat) . ',
        longitude = ' . $DB->quoteSmart($lon) . ',
        altitude = ' . $DB->quoteSmart($alt);
    $DB->query($sqlstr);
    */

    //$callsign = "test";
    $callsign = LISTENER_CALLSIGN;
    
    mylog("payload_telemetry");
    mylog($tm);
    
    // nosūta habitat
    if (habitat_payload_telemetry($callsign, $tm)) {
      $sqlstr = '
        UPDATE
          dlfldigi_proxy
        SET
          uploaded = 1
        WHERE
          id = ' . $DB->quoteSmart($row_id);
      $DB->query($sqlstr);
    }
    //mylog($vehicle . " data uploaded");

    $fp = fopen($logfile, "a");
    fwrite($fp, $tm . $tmd);
    fclose($fp);

  } else {
    //echo "\nFAIL $cs";
  }
}


?>{}