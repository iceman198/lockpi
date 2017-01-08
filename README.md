Using the Sainsmart RFID-RC522 module - some change here safdasd
    
    Pi Pin1     <--   3.3V  -->    Pin1 RC522
    Pi Pin25    <--   GND   -->    Pin3 RC522
    Pi Pin23    <--   SCLK  -->    Pin7 RC522
    Pi Pin19    <--   MOSI  -->    Pin6 RC522
    Pi Pin21    <--   MISO  -->    Pin5 RC522
    Pi Pin24    <--   SS    -->    Pin8 RC522
    Pi Pin22    <--   RST   -->    Pin2 RC522

Make sure you have Nodejs installed on your Pi
    
    $sudo apt-get install nodejs

Install latest version of node:

    $wget http://node-arm.herokuapp.com/node_latest_armhf.deb
    $sudo dpkg -i node_latest_armhf.deb

Update your Pi:
    
    $sudo apt-get Update
    -- anything else you'd like for your dist maybe

Make sure to enable SPI in raspi-config as well.

Not quite sure this is needed but lets configure the SPI group: (taken from http://www.hacker-maker.com/2015/12/rfid-rc522-on-raspberry-pi-with-nodejs.html)

    $sudo groupadd -f --system spi
    $sudo adduser pi spi
    $sudo nano /etc/udev/rules.d/90-spi.rules
    --- Then add this to the file :
    SUBSYSTEM=="spidev", GROUP="spi"

Install GCC compiler:
    
    $sudo apt-get install build-essential

Install node-gyp globally in node:
    
    $sudo npm install -g node-gyp

Snag and compile the spi_bcm2835 driver:
    
    $wget http://www.airspayce.com/mikem/bcm2835/bcm2835-1.49.tar.gz
    $tar -zxf bcm2835-1.49.tar.gz
    $cd bcm2835-1.49
    $./configure
    $make
    $sudo make check
    $sudo make install
    $sudo modprobe spi_bcm2835

If using this for another nodejs project, you'll want to include the rc522 module as part of the project:

    $npm install --save rc522

Everything previously mentioned is taken from https://www.npmjs.com/package/rc522 and http://geraintw.blogspot.de/2014/01/rfid-and-raspberry-pi.html

For the lock relay, you'll need pi-gpio: https://www.npmjs.com/package/pi-gpio#installation << don't use this one
Might go with https://www.npmjs.com/package/rpi-gpio instead...<< yup, going with this one

