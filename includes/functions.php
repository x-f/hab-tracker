<?php

// https://forums.digitalpoint.com/threads/php-define-function-calculate-crc-16-ccitt.2584389/#post-18178765
// CCITT, X24
define("CRC16POLYN",0x1021);
 
// for "STANDARD" use 0x8005 and 0xA001
 
function CRC16Normal($buffer) {
  $result = 0xFFFF;
  if (($length = strlen($buffer)) > 0) {
    for ($offset = 0; $offset < $length; $offset++) {
      $result ^= (ord($buffer[$offset]) << 8);
      for ($bitwise = 0; $bitwise < 8; $bitwise++) {
        if (($result <<= 1) & 0x10000) $result ^= CRC16POLYN;
        $result &= 0xFFFF; /* gut the overflow as php has no 16 bit types */
      }
    }
  }
  return $result;
}

function mylog($data) {
  //global $webuser, $localhost;
  $log = "";
  // if ($localhost) $log .= "[dev] ";

  // $log .= "[" . getenv('REMOTE_ADDR') ."] ";
  $log .= "HT: ";
  
  $log .= print_r($data, true);
  
  if (LOG) {
    $fp = fopen(LOG_DIR . "/mylog.log", "a");
    fwrite($fp, "[" . date("Y-m-d H:i:s") . "] " . $log . "\n");
    fclose($fp);
  }
  
  //error_log($log);
}

?>