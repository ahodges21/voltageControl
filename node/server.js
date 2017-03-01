//Nodejs server contoling GPIO for HV/LV

//Config.js file has all the settings
var config = require('./config')

console.log("Server started");
var GPIO = require('onoff').Gpio;

// Express handles our dynamic data pages
var express = require('express');
var app = express();

//Place all availible clients in array
var clients = [];
for (device in config.positionList) {
  //Create SPI Client where spiSetup(csPin, mosiPin, sclkPin)
  clients.push(spiSetup(config.positionList[device][2], config.mosiPin, config.sclkPin));
}

// Turn off all the modules
for (var client in clients) {
  spiSend(numToByte(0), clients[client]);
}

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();          // get an instance of the express Router

// Base route with info
router.get("/", function (req, res) {
  res.send("<p>Welcome to the API '/', availible options are /modules , /modules/2/set-byte, /modules/2/set-voltage</p>");
}); 

router.get("/modules", function (req, res) {
  res.json(config.positionList);
});

// ex: localhost/api/hardware/modules/14
router.get('/modules/:gpio', function (req, res) {
  var gpio = Number(req.params.gpio);

  if(gpio == undefined){
    res.send("ex: localhost/api/hardware/modules/14");
  } else {
    // Find the position in the clients list based off the gpio
    for (port in config.positionList) {
      if (config.positionList[port][2] == gpio) {
        res.json(config.positionList[port]);
        break;
      } else if(port == config.positionList.length -1){
        res.json({status: "Error", error: "Pin not found"});
      }
    }
  }
});

// ex: localhost/api/hardware/modules/14/set-byte?byte=128
router.post('/modules/:gpio/set-byte', function (req, res) {
  var byte = Number(req.query.byte);
  var gpio = Number(req.params.gpio);

  if (byte == undefined || gpio == undefined) {
    res.send("ex: localhost/api/hardware/modules/14/set-byte?byte=128");
  } else if (byte > 255 || byte < 0 ){
    res.json({status: "Error", error: "Byte out of range."});
  } else {
    // Find the position in the clients list based off the gpio
    for (port in config.positionList) {
      if (config.positionList[port][2] == gpio) {
        spiSend(numToByte(byte), clients[port]);
        var voltage = byteToVoltage(byte, config.positionList[port][3]);
        res.json({ status: "Success", gpio: gpio, voltage: voltage, byte: byte });
        break;
      } else if(port == config.positionList.length -1){
        res.json({status: "Error", error: "Pin not found"});
      }
    }
  }
});

// ex: localhost/api/hardware/modules/14/set-voltage?voltage=55.4
router.post('/modules/:gpio/set-voltage', function (req, res) {
  var voltage = Number(req.query.voltage);
  var gpio = Number(req.params.gpio);

  if (voltage == undefined || gpio == undefined) {
    res.send("ex: localhost/api/hardware/modules/14/set-voltage?voltage=55.4");
  } else {
    // Find the position in the clients list based off the gpio
    for (port in config.positionList) {
      if (config.positionList[port][2] == gpio) {
        var byte = voltageToByte(voltage, config.positionList[port][3]);
        if(byte < 1 || byte > 255){
          res.json({status: "Error", error: "Voltage out of range."});          
        }
        voltage = byteToVoltage(byte, config.positionList[port][3]);
        spiSend(numToByte(byte), clients[port]);
        res.json({ status: "Success", gpio: gpio, voltage: voltage, byte: byte });
        break;
      } else if(port == config.positionList.length -1){
        res.json({status: "Error", error: "Pin not found"});
      }
    }
  }
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with the route location
app.use(config.routeLocation, router);

// START THE SERVER
// =============================================================================
app.listen(config.port);
console.log("Voltage Control running on port: " + config.port);

function spiSetup(csPin, mosiPin, sclkPin) {
  this.cs = new GPIO(csPin, 'out');
  this.mosi = new GPIO(mosiPin, 'out');
  this.sclk = new GPIO(sclkPin, 'out');
  this.device = { cs: cs, mosi: mosi, sclk: sclk };
  return device;
}

function spiSend(data, device) {
  // select device
  device.sclk.writeSync(0);
  device.cs.writeSync(0);
  // send bits 7..0
  for (i = 0; i < 8; i++) {
    // set line high if bit is 1, low if bit is 0
    if (data[i] === '1') {
      device.mosi.writeSync(1);
    } else {
      device.mosi.writeSync(0);
    }
    // pull clock to indicate that bit value should be read
    device.sclk.writeSync(1);
    device.sclk.writeSync(0);
  }
  // deselect device
  device.cs.writeSync(1);
}

function voltageToByte(voltage, calibration) {
  voltageNumber = Math.round((voltage-calibration[1])/calibration[0]);
  return voltageNumber;
}

function byteToVoltage(byte, calibration) {
  voltage = (calibration[0]*byte+calibration[1]);
  return voltage;
}

function numToByte(number) {
  var byteString = number.toString(2);
  var paddedByteString = ('00000000' + byteString).substring(byteString.length);
  var byte = paddedByteString.split('');
  return byte;
}
