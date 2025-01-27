import loadtest from 'loadtest';

const options = {
  url: 'http://localhost:8502', // This will be overwritten in the requestGenerator
  method: 'POST',
  concurrency: 50,
  maxRequests: 1000,
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
            from: '0xf4b36d549e480a555fecab9634d47cebe93266bd',
            to: '0xe6e6c441f2a62ece60041bc6410a2d55f96a2aae',
            value: "0x5a0"
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
