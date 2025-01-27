import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Button,
  Checkbox,
  IconButton,
  Grid,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert
} from '@mui/material';
import { ArrowUpward, ArrowDownward, Delete, Refresh } from '@mui/icons-material';

const BlockchainPerformanceApp = () => {
  const [data, setData] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [graphData, setGraphData] = useState({
    meanLatencyMs: [],
    rps: [],
    averageCpu: [],
    averageMemory: [],
    peakCpu: [],
    peakMemory: []
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState({ message: '', warning: '' });

  const metricDisplayNames = {
    meanLatencyMs: 'Mean Latency (ms)',
    rps: 'Request Per Second',
    averageCpu: 'Average CPU usage (%)',
    averageMemory: 'Average Memory usage (MB)',
    peakCpu: 'Peak CPU usage(%)',
    peakMemory: 'Peak Memory usage (MB)'
  };


  // Fetch networks data
  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const response = await fetch('http://localhost:8080/networks');
        const jsonData = await response.json();
        setNetworks(jsonData.networks);
      } catch (error) {
        console.error('Error fetching networks:', error);
        setNetworks([]); // Set empty array on error
      }
    };
    fetchNetworks();
  }, []);

  // Fetch data from the endpoint
  const fetchResults = async () => {
    try {
      const response = await fetch('http://localhost:8080/results');
      const jsonData = await response.json();
      setSelectedData([]);
      setData(jsonData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Update graphs whenever selection changes
  useEffect(() => {
    updateGraphs();
  }, [selectedData]);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const sortData = (key) => {
    setSortConfig((currentConfig) => {
      const direction = 
        currentConfig.key === key && currentConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc';
      
      const sortedData = [...data].sort((a, b) => {
        if (key === 'timestamp') {
          return direction === 'asc' 
            ? new Date(a[key]) - new Date(b[key])
            : new Date(b[key]) - new Date(a[key]);
        }
        return direction === 'asc'
          ? String(a[key]).localeCompare(String(b[key]))
          : String(b[key]).localeCompare(String(a[key]));
      });

      setData(sortedData);
      return { key, direction };
    });
  };

  const toggleSelection = (item) => {
    setSelectedData(prev => 
      prev.includes(item) 
        ? prev.filter(selected => selected !== item)
        : [...prev, item]
    );
  };

  const selectAll = () => setSelectedData(data);
  const clearSelection = () => setSelectedData([]);

  const updateGraphs = () => {
    const metrics = ['meanLatencyMs', 'rps', 'averageCpu', 'averageMemory', 'peakCpu', 'peakMemory'];
    const newGraphData = {};

    metrics.forEach(metric => {
      // Group data by number of nodes
      const processedData = selectedData.reduce((acc, item) => {
        const existingItem = acc.find(x => x.nodes === item.numberOfNodes);
        if (existingItem) {
          existingItem[item.blockchainName] = item[metric];
        } else {
          acc.push({
            nodes: item.numberOfNodes,
            [item.blockchainName]: item[metric]
          });
        }
        return acc;
      }, []);

      // Sort by number of nodes
      newGraphData[metric] = processedData.sort((a, b) => a.nodes - b.nodes);
    });

    setGraphData(newGraphData);
  };

  const getUniqueBlockchains = () => {
    return [...new Set(selectedData.map(item => item.blockchainName))];
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await fetch(`http://localhost:8080/results/${itemId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setData(prevData => prevData.filter(item => item.id !== itemId));
        setSelectedData(prevSelected => prevSelected.filter(item => item.id !== itemId));
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      // You might want to show an error message to the user here
    }
  };

  const handlePerformTest = async () => {
    if (!selectedNetwork) return;
    
    const [blockchainName, nodes] = selectedNetwork.split('-');
    try {
      const response = await fetch('http://localhost:8080/blockchain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockchainName,
          numberOfNodes: parseInt(nodes)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setDialogContent({
          message: result.message,
          warning: result.warning
        });
        setOpenDialog(true);
      } else {
        throw new Error('Failed to start test');
      }
    } catch (error) {
      console.error('Error performing test:', error);
      setDialogContent({
        message: 'Failed to start test',
        warning: error.message
      });
      setOpenDialog(true);
    }
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  const renderGraph = (metric) => {
    const uniqueBlockchains = getUniqueBlockchains();
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={graphData[metric]}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="nodes"
            label={{ value: 'Number of Nodes', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            label={{
              value: metricDisplayNames[metric],
              angle: -90,
              position: 'insideBottomLeft',
              offset: 10
            }}
          />
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          {uniqueBlockchains.map((blockchain, index) => (
            <Bar
              key={blockchain}
              dataKey={blockchain}
              fill={colors[index % colors.length]}
              name={blockchain}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Blockchain Performance Analysis</h1>
      
      <Grid container spacing={2}>
        {/* Left side - Table */}
        <Grid item xs={5}>
          <div style={{ marginBottom: '20px' }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={selectAll} 
              style={{ marginRight: '10px' }}
            >
              Select All
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={clearSelection}
              style={{ marginRight: '10px' }}
            >
              Clear Selection
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchResults}
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          </div>

          <TableContainer 
            component={Paper} 
            style={{ 
              maxHeight: 'calc(100vh - 300px)', // Adjusted to make room for dropdown
              overflow: 'auto'
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '50px' }}></TableCell>
                  <TableCell style={{ padding: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Blockchain Name
                      <IconButton size="small" onClick={() => sortData('blockchainName')}>
                        {sortConfig.key === 'blockchainName' && sortConfig.direction === 'asc' 
                          ? <ArrowUpward fontSize="small" /> 
                          : <ArrowDownward fontSize="small" />}
                      </IconButton>
                    </div>
                  </TableCell>
                  <TableCell style={{ padding: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Nodes
                      <IconButton size="small" onClick={() => sortData('numberOfNodes')}>
                        {sortConfig.key === 'numberOfNodes' && sortConfig.direction === 'asc' 
                          ? <ArrowUpward fontSize="small" /> 
                          : <ArrowDownward fontSize="small" />}
                      </IconButton>
                    </div>
                  </TableCell>
                  <TableCell style={{ padding: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Timestamp
                      <IconButton size="small" onClick={() => sortData('timestamp')}>
                        {sortConfig.key === 'timestamp' && sortConfig.direction === 'asc' 
                          ? <ArrowUpward fontSize="small" /> 
                          : <ArrowDownward fontSize="small" />}
                      </IconButton>
                    </div>
                  </TableCell>
                  <TableCell style={{ padding: '6px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(item => (
                  <TableRow 
                    key={item.id}
                    hover
                    style={{ height: '40px' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={selectedData.includes(item)}
                        onChange={() => toggleSelection(item)}
                      />
                    </TableCell>
                    <TableCell style={{ padding: '6px' }}>{item.blockchainName}</TableCell>
                    <TableCell style={{ padding: '6px' }}>{item.numberOfNodes}</TableCell>
                    <TableCell style={{ padding: '6px' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell style={{ padding: '6px' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item.id)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Network Selection and Test Button */}
          <Paper style={{ marginTop: '20px', padding: '15px' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={8}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Network</InputLabel>
                  <Select
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                    label="Select Network"
                  >
                    {networks.map((network) => (
                      <MenuItem 
                        key={`${network.blockchainName}-${network.numberOfNodes}`}
                        value={`${network.blockchainName}-${network.numberOfNodes}`}
                      >
                        {`${network.blockchainName} (${network.numberOfNodes} nodes)`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <Button
                  variant="contained"
                  onClick={handlePerformTest}
                  disabled={!selectedNetwork}
                  fullWidth
                >
                  Perform Test
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right side - Graphs */}
        <Grid item xs={7}>
          <Box 
            style={{ 
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto',
              paddingRight: '20px'
            }}
          >
            {/* Latency Graph */}
            <Paper style={{ marginBottom: '20px', padding: '15px' }}>
              <h3 style={{ marginBottom: '10px' }}>{metricDisplayNames.meanLatencyMs}</h3>
              {renderGraph('meanLatencyMs')}
            </Paper>

            {/* Throughput Graph */}
            <Paper style={{ marginBottom: '20px', padding: '15px' }}>
              <h3 style={{ marginBottom: '10px' }}>{metricDisplayNames.rps}</h3>
              {renderGraph('rps')}
            </Paper>

            {/* Other Performance Metrics */}
            {Object.keys(graphData)
              .filter(metric => !['meanLatencyMs', 'rps'].includes(metric))
              .map(metric => (
                <Paper 
                  key={metric} 
                  style={{ 
                    marginBottom: '20px',
                    padding: '15px'
                  }}
                >
                  <h3 style={{ marginBottom: '10px' }}>{metricDisplayNames[metric]}</h3>
                  {renderGraph(metric)}
                </Paper>
              ))}
          </Box>
        </Grid>
      </Grid>
      
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Test Status</DialogTitle>
        <DialogContent>
          <Typography>{dialogContent.message}</Typography>
          {dialogContent.warning && (
            <Alert 
              severity="warning" 
              style={{ marginTop: '16px' }}
            >
              {dialogContent.warning}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BlockchainPerformanceApp;