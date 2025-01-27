import express from 'express';
import { readFile, writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import loadtest from 'loadtest';
import cors from 'cors';


const execAsync = promisify(exec);
const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

function parseMemory(memString) {
    if (!memString) return 0;
    
    // Remove any spaces and split the memory string
    memString = memString.trim();
    
    // Docker stats usually returns memory in format "123.4MiB / 456.7GiB"
    // We only want the first part (used memory)
    const usedMemory = memString.split('/')[0].trim();
    
    // Extract the numeric value and unit
    const match = usedMemory.match(/^([\d.]+)\s*([A-Za-z]+)$/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    // Convert to MiB
    switch (unit) {
        case 'B':
            return value / (1024 * 1024);
        case 'KIB':
        case 'KB':
            return value / 1024;
        case 'MIB':
        case 'MB':
            return value;
        case 'GIB':
        case 'GB':
            return value * 1024;
        case 'TIB':
        case 'TB':
            return value * 1024 * 1024;
        default:
            return 0;
    }
}

class DockerStats {
    constructor() {
        this.cpuStats = [];
        this.memoryStats = [];
        this.shouldMonitor = false;
    }

    async startMonitoring() {
        console.log('Starting Docker stats monitoring...');
        this.shouldMonitor = true;
        this.monitoringPromise = this.monitor();
    }

    async monitor() {
        while (this.shouldMonitor) {
            try {
                const { stdout } = await execAsync("docker stats --no-stream --format '{{.CPUPerc}};{{.MemUsage}}'");
                const containers = stdout.trim().split('\n');
                
                for (const container of containers) {
                    const [cpu, mem] = container.split(';');
                    this.cpuStats.push(parseFloat(cpu.replace('%', '')));
                    
                    // Get memory value before the '/' (used memory, not limit)
                    const usedMem = mem.split('/')[0];
                    const memoryInMiB = parseMemory(usedMem);
                    this.memoryStats.push(memoryInMiB);
                }
            } catch (error) {
                console.error('Error collecting Docker stats:', error);
            }
            await new Promise(resolve => setTimeout(resolve, 250));
        }
    }

    async stopMonitoring() {
        console.log('Stopping Docker stats monitoring...');
        this.shouldMonitor = false;
        if (this.monitoringPromise) {
            await this.monitoringPromise;
        }
    }

    getStats() {
        if (this.cpuStats.length === 0 || this.memoryStats.length === 0) {
            console.log('No stats collected yet');
            return {
                averageCpu: "0",
                averageMemory: "0",
                peakCpu: "0",
                peakMemory: "0"
            };
        }

        const avgCpu = this.cpuStats.reduce((a, b) => a + b, 0) / this.cpuStats.length;
        const avgMem = this.memoryStats.reduce((a, b) => a + b, 0) / this.memoryStats.length;
        const peakCpu = Math.max(...this.cpuStats);
        const peakMem = Math.max(...this.memoryStats);

        return {
            averageCpu: avgCpu.toFixed(2),
            averageMemory: avgMem.toFixed(2),
            peakCpu: peakCpu.toFixed(2),
            peakMemory: peakMem.toFixed(2)
        };
    }

    resetStats() {
        console.log('Resetting Docker stats...');
        this.cpuStats = [];
        this.memoryStats = [];
    }
}

async function saveResults(results) {
    try {
        let data;
        try {
            data = JSON.parse(await readFile('results.json', 'utf8'));
        } catch {
            data = { data: [] };
        }
        data.data.push(results);
        await writeFile('results.json', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving results:', error);
    }
}

async function runTendermintLoadTest(blockchainConfig, batchId) {
    console.log(`Starting Tendermint loadtest batch ${batchId}...`);
    return new Promise((resolve, reject) => {
        let txIndex = 0;
        
        const options = {
            url: blockchainConfig.endpoint,
            maxRequests: 10000, // Fixed at 10000 transactions
            concurrency: 50,
            method: 'GET',
            requestGenerator: (params, options, client, callback) => {
                const tx = `tx_batch${batchId}_${txIndex++}`;
                const path = `/broadcast_tx_async?tx="${tx}"`;
                const request = client(options, callback);
                request.path = path;
                return request;
            }
        };

        loadtest.loadTest(options, (error, result) => {
            if (error) {
                console.error('Loadtest error:', error);
                reject(error);
            } else {
                console.log('Loadtest completed successfully');
                resolve(result);
            }
        });
    });
}

function runLoadTest(blockchainConfig) {
    console.log('Starting Quorum loadtest...');
    return new Promise((resolve, reject) => {
        const options = {
            url: blockchainConfig.endpoint,
            maxRequests: 10000, // Fixed at 10000 transactions
            concurrency: 50,
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify(blockchainConfig.requestBody),
            headers: {
                'Content-Type': 'application/json'
            }
        };

        loadtest.loadTest(options, (error, result) => {
            if (error) {
                console.error('Loadtest error:', error);
                reject(error);
            } else {
                console.log('Loadtest completed successfully');
                resolve(result);
            }
        });
    });
}

async function executeCommand(command) {
    try {
        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd()
        });
        console.log('Command output:', stdout);
        if (stderr) console.error('Command errors:', stderr);
        return { success: true, output: stdout };
    } catch (error) {
        console.error('Error executing command:', error);
        return { success: false, error: error.message };
    }
}

app.post('/blockchain', async (req, res) => {
    const { blockchainName, numberOfNodes } = req.body;
    console.log('Received request for:', blockchainName, 'with', numberOfNodes, 'nodes');

    try {
        const configFile = await readFile('blockchain_config.json', 'utf8');
        const config = JSON.parse(configFile);
        
        const blockchainConfig = config.blockchains.find(
            b => b.name === blockchainName && b.nodes === numberOfNodes
        );

        if (!blockchainConfig) {
            return res.status(404).json({ message: 'Configuration not found' });
        }

        res.status(200).json({ 
            message: 'Starting blockchain network and tests',
            warning: blockchainConfig.warning 
        });

        console.log('Starting blockchain...');
        await executeCommand(blockchainConfig.startCommand);
        
        console.log('Waiting 120 seconds for network initialization...');
        await new Promise(resolve => setTimeout(resolve, 120000));
        console.log('Initialization wait complete');

        // Arrays to store results from all iterations
        const allResults = {
            errors: [],
            rps: [],
            latency: [],
            cpuAvg: [],
            memoryAvg: [],
            cpuPeak: [],
            memoryPeak: []
        };

        // Run 5 iterations
        for (let i = 1; i <= 5; i++) {
            console.log(`\nStarting iteration ${i}/5...`);
            const dockerStats = new DockerStats();
            await dockerStats.startMonitoring();

            try {
                let result;
                if (blockchainName.toLowerCase() === 'tendermint') {
                    result = await runTendermintLoadTest(blockchainConfig, i);
                } else {
                    result = await runLoadTest(blockchainConfig);
                }

                const stats = dockerStats.getStats();
                await dockerStats.stopMonitoring();

                // Store results from this iteration
                allResults.errors.push(result.totalErrors || 0);
                allResults.rps.push(Math.round(result.rps));
                allResults.latency.push(result.meanLatencyMs);
                allResults.cpuAvg.push(parseFloat(stats.averageCpu));
                allResults.memoryAvg.push(parseFloat(stats.averageMemory));
                allResults.cpuPeak.push(parseFloat(stats.peakCpu));
                allResults.memoryPeak.push(parseFloat(stats.peakMemory));

                if (i < 5) {
                    console.log('Waiting 60 seconds before next iteration...');
                    await new Promise(resolve => setTimeout(resolve, 60000));
                }
            } catch (error) {
                console.error(`Error in iteration ${i}:`, error);
            }
        }

        // Calculate averages for final results
        const finalResults = {
            id: randomUUID(),
            blockchainName,
            numberOfNodes,
            timestamp: new Date().toISOString(),
            totalErrors: Math.round(allResults.errors.reduce((a, b) => a + b, 0) / 5),
            rps: Math.round(allResults.rps.reduce((a, b) => a + b, 0) / 5),
            meanLatencyMs: parseFloat((allResults.latency.reduce((a, b) => a + b, 0) / 5).toFixed(2)),
            averageCpu: parseFloat((allResults.cpuAvg.reduce((a, b) => a + b, 0) / 5).toFixed(2)),
            averageMemory: parseFloat((allResults.memoryAvg.reduce((a, b) => a + b, 0) / 5).toFixed(2)),
            peakCpu: parseFloat((allResults.cpuPeak.reduce((a, b) => a + b, 0) / 5).toFixed(2)),
            peakMemory: parseFloat((allResults.memoryPeak.reduce((a, b) => a + b, 0) / 5).toFixed(2))
        };

        await saveResults(finalResults);
        console.log('Results saved to file');

        console.log('\nStopping blockchain...');
        await executeCommand(blockchainConfig.stopCommand);
        console.log('Blockchain stopped');

    } catch (error) {
        console.error('Error:', error);
    }
});

// Get results endpoint
app.get('/results', async (req, res) => {
    try {
        const data = JSON.parse(await readFile('results.json', 'utf8'));
        res.json(data);
    } catch (error) {
        res.status(404).json({ message: 'No results found' });
    }
});

// Delete result by ID endpoint
app.delete('/results/:id', async (req, res) => {
    try {
        const data = JSON.parse(await readFile('results.json', 'utf8'));
        const resultIndex = data.data.findIndex(item => item.id === req.params.id);
        
        if (resultIndex === -1) {
            return res.status(404).json({ message: 'Result not found' });
        }

        data.data.splice(resultIndex, 1);
        await writeFile('results.json', JSON.stringify(data, null, 2));
        res.json({ message: 'Result deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting result' });
    }
});

app.get('/networks', async (req, res) => {
    try {
        const configFile = await readFile('blockchain_config.json', 'utf8');
        const config = JSON.parse(configFile);
        
        const networks = config.blockchains.map(blockchain => ({
            blockchainName: blockchain.name,
            numberOfNodes: blockchain.nodes
        }));

        res.json({ networks });
    } catch (error) {
        console.error('Error reading network configurations:', error);
        res.status(500).json({ 
            message: 'Error reading network configurations',
            error: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});