import loadtest from 'loadtest';

// Define the list of available endpoints
const ports = [
  '8501',
  '8502',
  '8503'
];

// Define the map of `from` addresses based on the endpoint
const addressMap = {
  '8501': "0x3E488C51303FdB75F3443848BC1ce0098052CFBc",
  '8502': "0x3ae3f6639beD20F1e51A7eB05c82E86d21A67b27",
  '8503': "0x59e6Cb834fa3B26db583AF4d9F246f8dE6734FaD"
}

function createRequestBody(fromAddress, toAddress) {
  return JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_sendTransaction",
      params: [
      {
          from: fromAddress,
          to: toAddress,
          value: "0x5a0"
      }
      ],
      id: 1
  });
}

function getRandomPort() {
  const randomIndex = Math.floor(Math.random() * ports.length);
  return ports[randomIndex];
}

const options = {
  url: 'http://localhost:8501', // This will be overwritten in the requestGenerator
  method: 'POST',
  concurrency: 100,
  maxRequests: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  requestGenerator: (params, options, client, callback) => {
    const randomPort = getRandomPort();
    const fromAddress = addressMap[randomPort];
    const toAddress = addressMap[getRandomPort()];
    
    // Copy options to avoid mutation
    var customOptions = Object.assign({}, options);
    customOptions.port = randomPort;
    customOptions.body = createRequestBody(fromAddress, toAddress);

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
