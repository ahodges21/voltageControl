config = {};

// SPI requires a shared mosi and clock (we are ignoring miso as we have a simplex channel)
config.mosiPin = 5;
config.sclkPin = 6;

// [Panel Name, Datasheet Voltage, GPIO PIN Number, [coefficent, offsett]]
config.positionList = [
  ["OH-2-01",69.34,04, [-0.0152 , 70.809]],
  ["IH-1-16",68.61,03, [-0.0151 , 69.262]],
  ["OH-1-15",69.31,02, [-0.0151 , 70.367]],
  ["IH-2-12",68.59,14, [-0.0152 , 68.750]]
];

//Route location is coming form load balancer
config.routeLocation = "/api/hardware";
config.port = 8000; // set our port

module.exports = config;