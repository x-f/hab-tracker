<?php

// ar kādu vārdu tiek augšuplādēts uz habitat
define("LISTENER_CALLSIGN", "test");
define("LISTENER_RADIO", "test");
define("LISTENER_ANTENNA", "test");

define("HABITAT_UPLOAD_ENABLED", false);
define("HABITAT_UPLOAD_RETRIES", 5);

define("SITEROOT", "http://x-f.dev/_tmp/hab-tracker");

//-----------------------

define("DB_CONN", "mysql://root:root@localhost/habtracker");

define("DEBUG", true);
// define("DEBUG", false);

// ini_set("date.timezone", "Europe/Helsinki");

if (DEBUG)  {
  // ini_set('error_reporting', E_ALL);
  error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
  ini_set('display_errors', 1);
} else {
  error_reporting(0);
  ini_set('error_reporting', 0);
  ini_set('display_errors', 0);
}

ini_set("expose_php", "Off");
ini_set("mbstring.internal_encoding", "UTF-8");

define("LOG", true);
define("LOG_DIR", dirname(__FILE__) . "/../_logs");


require_once dirname(__FILE__) . '/functions.php';

?>