<?php
ob_start("ob_gzhandler");
header('Content-Type: application/json');
header('Accept-Encoding: gzip');

// sleep(2);
require_once dirname(__FILE__) . '/../includes/prepend.php';

$position_id = (isset($_GET['pid']) ? intval($_GET['pid']) : 0);
$max_positions = (isset($_GET['max']) ? intval($_GET['max']) : 0);

$sqlstr = '
  SELECT
    *
  FROM
    dlfldigi_proxy
  WHERE
    id > ' . $DB->quoteSmart($position_id) . '
    -- AND satellites > 0
    -- AND payload = "LAASE"
    AND archived = 0
  ORDER BY
    id ASC';
if ($max_positions) 
  $sqlstr .= '
    LIMIT ' . $max_positions;
$res = $DB->getAll($sqlstr);

$data = array();
foreach ($res as $item) {
  unset($item->sentence);
  unset($item->uploaded);
  $item->latitude = (float)$item->latitude;
  $item->longitude = (float)$item->longitude;
  $data[] = $item;
}

$json = json_encode($data);
// header("Content-length: " . strlen($json));
echo $json;

ob_flush();
?>