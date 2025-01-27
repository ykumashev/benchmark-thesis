import loadtest from 'loadtest';

const options = {
  url: 'http://localhost:22002',
  method: 'POST',
  concurrency: 50,
  maxRequests: 500,
  headers: {
    'Content-Type': 'application/json',
  },
  requestGenerator: (params, options, client, callback) => {
    var customOptions = Object.assign({}, options);
    customOptions.body = JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_sendTransaction",
      params: [
        {
          to: '0xed9d02e382b34818e88b88a309c7fe71e65f419d',
          from: '0xca843569e3427144cead5e4d5999a3d0ccf92b8e',
          value: "0x225a0"
        }
      ],
      id: 1
    });
    const request = client(customOptions, callback);
    request.write(customOptions.body);

    return request;
  },
  statusCallback: (error, result) => {
    if (error) {  
      console.error('Request error:', error); 
    } 
    // else {
    //   console.log(`Response Code: ${result.statusCode}`); // Log status code
    //   console.log(`Request Body: ${options.body}`); // Log the request body
    //   console.log('Response:', result.body); // Log the response body
    // }
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
