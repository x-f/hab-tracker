<?php

require_once dirname(__FILE__) . '/../includes/config.php';
require_once dirname(__FILE__) . '/../includes/functions.php';
// require_once dirname(__FILE__) . '/../includes/functions-output.php';
error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);

require_once "DB.php";
$DB =& DB::Connect(DB_CONN);
if (PEAR::isError($DB)){
  mylog("prepend#" . __LINE__ .": " . $DB->getUserInfo());
  errormsg($DB->getUserInfo(), __FILE__ . ':' . __FUNCTION__ . '():' . __LINE__);
}
$DB->setFetchMode(DB_FETCHMODE_OBJECT);
$DB->query('SET NAMES utf8');


$uri = isset($_GET['page']) ? $_GET['page'] : '';
$uri = preg_replace('|^/+|', '', $uri);
$uri = preg_replace('|/+$|', '', $uri);
//$uri = mb_strtolower($uri);
$uri = explode('/', $uri);


@header("X-Powered-By: x-f");

$notices = $errors = array();

error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);

?>