import loadtest from 'loadtest';
import http from 'http';

// Define the list of available endpoints
const ports = [
  '22000',
  '22001',
  '22002'
];

function getRandomPort() {
  const randomIndex = Math.floor(Math.random() * ports.length);
  return ports[randomIndex];
}

// Define the map of `from` addresses based on the endpoint
const addressMap = {
  'http://localhost:22000': "0xed9d02e382b34818e88b88a309c7fe71e65f419d",
  'http://localhost:22001': "0xca843569e3427144cead5e4d5999a3d0ccf92b8e",
  'http://localhost:22002': "0x0fbdc686b912d7722dc86510934589e0aaf3b55a",
  'http://localhost:22003': "0x9186eb3d20cbd1f5f992a950d808c4495153abd5",
  'http://localhost:22004': "0x0638e1574728b6d862dd5d3a3e0942c3be47d996"
}

function createRequestBody(fromAddress) {
  return JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_sendTransaction",
      params: [
      {
          from: fromAddress,
          to: fromAddress,
          value: "0x225a0"
      }
      ],
      id: 1
  });
}

const options = {
  url: 'http://localhost:22002', // This will be overwritten in the requestGenerator
  method: 'POST',
  concurrency: 100,
  maxRequests: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
  requestGenerator: (params, options, client, callback) => {
    const randomPort = getRandomPort();
    const fromAddress = addressMap['http://localhost:'+randomPort];

    // Copy options to avoid mutation
    var customOptions = Object.assign({}, options);
    customOptions.port = randomPort;
    customOptions.body = createRequestBody(fromAddress);

    const request = client(customOptions, callback);
    request.write(customOptions.body);
    
    return request;
  },
  statusCallback: (error, result) => {
    if (error) {  
      console.error('Request error:', error); 
    }
  }
};


loadtest.loadTest(options, (error, results) => {
  if (error) {
    return console.error('Error:', error);
  }

  console.log('--- Results ---');
  console.log(`Total Requests: ${results.totalRequests}`);
  console.log(`Total Errors: ${results.totalErrors}`);
  console.log(`Total Timeouts: ${results.totalTimeouts}`);
  console.log(`Requests per Second: ${results.rps}`);
  console.log(`Mean Latency: ${results.meanLatencyMs} ms`);
  console.log(`Percentiles:`);
  console.log(`  50%: ${results.percentiles['50']} ms`);
  console.log(`  90%: ${results.percentiles['90']} ms`);
  console.log(`  95%: ${results.percentiles['95']} ms`);
  console.log(`  99%: ${results.percentiles['99']} ms`);
});
