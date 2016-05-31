<?php
require_once dirname(__FILE__) . '/../includes/prepend.php';
require_once dirname(__FILE__) . '/../includes/functions-habitat.php';

// error_log(gmdate("c"));
// exit;

$sqlstr = '
  SELECT
    *
  FROM
    dlfldigi_proxy
  WHERE
    uploaded = 0
    AND upload_retries < ' . HABITAT_UPLOAD_RETRIES . '
    AND archived = 0
  ORDER BY
    ts DESC
  LIMIT
    1';
$res = $DB->getRow($sqlstr);

// print_r($res);

if ($res) {

  $callsign = LISTENER_CALLSIGN;

  $data = $res->sentence;
  $time_rx = gmdate("c", strtotime($res->ts));
  
  try {
    $habitat_upload = habitat_payload_telemetry($callsign, $data, $time_rx);
  } catch (Exception $e) {
    mylog('Caught exception: ' . $e->getMessage());//, "\n";
    $habitat_upload = false;
  }
  // var_dump($habitat_upload);
  
  if ($habitat_upload) {
    $sqlstr = '
      UPDATE
        dlfldigi_proxy
      SET
        uploaded = 1
      WHERE
        id = ' . $DB->quoteSmart($res->id);
  } else {
    $sqlstr = '
      UPDATE
        dlfldigi_proxy
      SET
        upload_retries = upload_retries + 1
      WHERE
        id = ' . $DB->quoteSmart($res->id);
  }
  $DB->query($sqlstr);
  // echo $sqlstr;
}

?>