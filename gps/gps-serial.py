#!/usr/bin/python
import serial
import re
import sys, os
import demjson

GPS_DEV = '/dev/cu.BTGPS-SPPslave'
GPS_DEV = '/dev/cu.NokiaLD-3W-DevB'



# http://us.cactii.net/~bb/gps.py
def gps_DegreeConvert(degrees):
  deg_min, dmin = degrees.split('.')
  degrees = int(deg_min[:-2])
  minutes = float('%s.%s' % (deg_min[-2:], dmin))
  decimal = degrees + (minutes/60)
  return decimal

try:

    print "Opening serial port " + GPS_DEV + ".."
    GPS = serial.Serial(GPS_DEV, 9600, timeout=1)
    print "Port opened"


    gpsdata = {
      'date': 0,
      'time': 0,
      'latitude': 0,
      'longitude': 0,
      'altitude': 0,
      'speed': 0,
      'course': 0,
      'fixq': 0,
      'satellites': 0,
    }
    
    while True:
      try:
        data_line = GPS.readline().strip()
        if (data_line.__len__() > 0):
            
            print(data_line)
            nmeastr = data_line
            if nmeastr[:3] == '$GP' and "*" in nmeastr: #and nmeastr[len(nmeastr)-2:] == '\r\n':
              nmeatype = nmeastr[3:6]
              # print nmeatype
              if nmeatype == 'RMC' or nmeatype == 'GGA' or nmeatype == 'GSA':
                tmp = nmeastr.split(',')
                # print tmp
                
                if nmeatype == 'RMC':
                  tmp_time = tmp[1]
                  tmp_time = float(tmp_time)
                  string = "%06i" % tmp_time
                  hours = string[0:2]
                  minutes = string[2:4]
                  seconds = string[4:6]
                  tmp_time = hours + ':' + minutes + ':' + seconds 
                  gpsdata["time"] = tmp_time

                  tmp_date = tmp[9]
                  tmp_date = int(tmp_date)
                  string = "%06i" % tmp_date
                  day = string[0:2]
                  month = string[2:4]
                  year = 2000 + int(string[4:6])
                  tmp_date = str(year) + '-' + month + '-' + day
                  if year >= 2014:
                    gpsdata["date"] = tmp_date

                  if tmp[3] != "":
                    lat = gps_DegreeConvert(tmp[3])
                    if tmp[4] == "S": lat *= -1
                    gpsdata["latitude"] = round(lat, 5)
                    lon = gps_DegreeConvert(tmp[5])
                    if tmp[6] == "W": lon *= -1
                    gpsdata["longitude"] = round(lon, 5)

                  if tmp[7] != "":
                    gpsdata['speed'] = round(float(tmp[7]) * 1.852)
                  if tmp[8] != "":
                    gpsdata['course'] = round(float(tmp[8]))

                if nmeastr[3:6] == 'GGA':
                  tmp_time = tmp[1]
                  tmp_time = float(tmp_time)
                  string = "%06i" % tmp_time
                  hours = string[0:2]
                  minutes = string[2:4]
                  seconds = string[4:6]
                  tmp_time = hours + ':' + minutes + ':' + seconds 
                  gpsdata["time"] = tmp_time

                  if tmp[2] != "":
                    lat = gps_DegreeConvert(tmp[2])
                    if tmp[3] == "S": lat *= -1
                    gpsdata["latitude"] = round(lat, 5)
                    lon = gps_DegreeConvert(tmp[4])
                    if tmp[5] == "W": lon *= -1
                    gpsdata["longitude"] = round(lon, 5)

                  gpsdata['satellites'] = int(tmp[7])
                  if tmp[9] != "":
                    gpsdata['altitude'] = float(tmp[9])

                if nmeastr[3:6] == 'GSA':
                  gpsdata['fixq'] = int(tmp[2])
            
                # print gpsdata
                
                ts_filename = os.path.dirname(os.path.abspath(__file__)) + '/gps-position.json'
                open(ts_filename, 'w').write(demjson.encode(gpsdata))
      
      # GPS stopped working?
      except serial.SerialException, e:
        print "serial error (2): ", e
        # os.system('echo -e "\a"')
        os.system('tput bel')
        sys.exit()
        
      except Exception, e:
        print(data_line)
        print e
        print "------------"
        continue

except Exception, e:
    print "serial error (1): ", e
    
except KeyboardInterrupt:
    print " Quitting.."
    GPS.close() # Close serial port
    sys.exit()
    