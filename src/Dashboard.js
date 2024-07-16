import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Container, TextField, Button, Typography, Paper, CircularProgress, Grid, Box, MenuItem, Select,
  FormControl, InputLabel, InputAdornment, LinearProgress, RadioGroup, FormControlLabel, Radio,
  IconButton, Tabs, Tab, Tooltip, Autocomplete
} from '@mui/material';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SaveIcon from '@mui/icons-material/Save';
import HistoryIcon from '@mui/icons-material/History';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/system';
import ResultTable from './ResultTable';
import api from './api';
import axios from 'axios';
import { useSnackbar } from './SnackbarContext';

let theme = createTheme({
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  palette: {
    primary: { main: '#2196f3' },
    secondary: { main: '#ff9800' },
    background: { default: '#f4f6f8' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

const AppContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  flexDirection: 'column',
}));

const FormSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const CancelButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.secondary.main,
  color: '#fff',
  '&:hover': {
    backgroundColor: theme.palette.secondary.dark,
  },
}));

const LogBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '500px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}));

const LogContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  '&::-webkit-scrollbar': { width: '0.4em' },
  '&::-webkit-scrollbar-track': {
    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
    webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(0,0,0,.1)',
    outline: '1px solid slategrey'
  }
}));

const LogMessage = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'logType',
})(({ theme, logType }) => ({
  color:
    logType === 'error' ? theme.palette.error.main :
    logType === 'warning' ? theme.palette.warning.main :
    logType === 'success' ? theme.palette.success.main :
    theme.palette.text.primary,
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
}));

const LogIcon = ({ logType }) => {
  switch (logType) {
    case 'error': return <ErrorOutlineIcon color="error" />;
    case 'warning': return <WarningAmberIcon color="warning" />;
    case 'success': return <CheckCircleOutlineIcon color="success" />;
    default: return null;
  }
};

const ResultBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(3),
  minHeight: '400px',
  overflow: 'auto',
  '& pre': {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  },
}));

const Dashboard = ({ isLoggedIn, checkLoginStatus }) => {
  const [processType, setProcessType] = useState('url');
  const [inputType, setInputType] = useState('title');
  const [url, setUrl] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [costOfGoods, setCostOfGoods] = useState('');
  const [vat, setVat] = useState('');
  const [image, setImage] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const cancelTokenSource = useRef(axios.CancelToken.source());
  const navigate = useNavigate();
  const [counterParty, setCounterParty] = useState('');
  const [counterParties, setCounterParties] = useState([]);
  const [loadingCounterParties, setLoadingCounterParties] = useState(false);
  const [counterPartyError, setCounterPartyError] = useState(null);
  const { showSnackbar } = useSnackbar();
  const [localLoading, setLocalLoading] = useState(false);

  // --- Socket.io Setup ---
  const socket = useMemo(() => io(`${process.env.REACT_APP_BACKEND_URL}`, {
    transports: ['websocket'],
    withCredentials: true,
    extraHeaders: {
      "my-custom-header": "abcd"
    }
  }), []);

  // --- Data Fetching Functions ---

  const fetchSearchResults = useCallback(async () => {
    try {
      const response = await api.get('/api/dashboard/get_search_results');
      if (response.data) {
        setResults(response.data);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
      showSnackbar('Error fetching search results', 'error');
    }
  }, [showSnackbar]);

  const fetchCounterParties = useCallback(async () => {
    setLoadingCounterParties(true);
    setCounterPartyError(null);
    try {
      const response = await api.get('/api/to_procure/get_suppliers');
      const sortedCounterParties = response.data.sort((a, b) => a.name.localeCompare(b.name));
      setCounterParties(sortedCounterParties);
    } catch (error) {
      console.error('Error fetching counter parties:', error);
      setCounterPartyError('Failed to load counter parties. Please try again.');
      showSnackbar('Error fetching counter parties', 'error');
    } finally {
      setLoadingCounterParties(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchCounterParties();
    fetchSearchResults();
  }, [fetchCounterParties, fetchSearchResults]);
 

  // --- Log Handling ---
  const addLog = useCallback((message, type = 'info', timestamp = new Date().toLocaleString()) => {
    setLogs((logs) => [...logs, { message, type, timestamp }]);
    if (type === 'warning' || type === 'error') {
      showSnackbar(message, type);
    }
  }, [showSnackbar]);

  useEffect(() => {
    socket.on('log_message', (log) => {
      if (typeof log === 'string') {
        const logData = JSON.parse(log);
        addLog(logData.message, logData.type, logData.timestamp);
      } else {
        addLog(log.message, log.type, log.timestamp);
      }
    });
  
    return () => {
      socket.off('log_message');
    };
  }, [socket, addLog]);

  // Auto-scroll log container
  useEffect(() => {
    const logContainer = document.getElementById('log-container');
    if (logContainer) { 
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }, [logs]); 

  // --- Data Handling Functions ---
  const handleSaveSelected = async (selectedItems) => {
    try {
      const response = await api.post('/api/dashboard/save_flagged', { items: selectedItems });
      if (response.data && response.data.message) {
        setResults(prevResults => prevResults.map(item => {
          if (selectedItems.some(selectedItem => selectedItem.ASIN === item.ASIN)) {
            return { ...item, is_sent_for_approval: true };
          }
          return item;
        }));
        showSnackbar(response.data.message, 'success');
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Error sending items for approval. Please try again.', 'error');
      return { success: false, message: error.response?.data?.message || 'Error sending items for approval' };
    }
  };

  const handleRemoveSelected = async (selectedItems) => {
    try {
      const asinList = selectedItems.map(item => item.ASIN);
      await api.post('/api/dashboard/remove_results', { asin_list: asinList });
      setResults(prevResults => prevResults.filter(item => !asinList.includes(item.ASIN)));
      showSnackbar('Selected items removed successfully', 'success');
    } catch (error) {
      console.error('Error removing items:', error);
      showSnackbar('Error removing items. Please try again.', 'error');
    }
  };

  const handleDashboardDecisionUpdate = async (updatedItem) => {
    try {
      const response = await api.post('/api/dashboard/update_decision', {
        asin: updatedItem.ASIN,
        decision: updatedItem.Decision,
      });
      if (response.status === 200) {
        setResults(prevResults => prevResults.map(item => 
          item.ASIN === updatedItem.ASIN ? { ...item, Decision: updatedItem.Decision } : item
        ));
        showSnackbar('Decision updated successfully', 'success');
      } else {
        showSnackbar('Failed to update decision', 'error');
      }
    } catch (error) {
      console.error('Error updating decision:', error);
      showSnackbar('Failed to update decision', 'error');
    }
  };

  const handleCommentUpdate = async (updatedItem) => {
    try {
      const response = await api.post('/api/dashboard/update_comment', {
        asin: updatedItem.ASIN,
        comment: updatedItem.Comment,
      });
      if (response.status === 200) {
        setResults(prevResults => prevResults.map(item => 
          item.ASIN === updatedItem.ASIN ? { ...item, Comment: updatedItem.Comment } : item
        ));
        showSnackbar('Comment updated successfully', 'success');
      } else {
        showSnackbar('Failed to update comment', 'error');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      showSnackbar('Failed to update comment', 'error');
    }
  };

  // --- Form Submission and Processing ---
  const pollProcessingStatus = useCallback(async () => {
    try {
      const response = await api.get('/api/dashboard/process_status');
      const { status } = response.data;

      if (status === 'completed') {
        const resultResponse = await api.get('/api/dashboard/get_result');
        setResults(Array.isArray(resultResponse.data) ? resultResponse.data : [resultResponse.data]);
        showSnackbar('Processing completed successfully', 'success');
        setLocalLoading(false);
        setLoading(false);
      } else if (status === 'stopped' || status === 'error') {
        addLog(`Process ${status}`, 'error');
        setLocalLoading(false);
        setLoading(false);
      } else {
        setTimeout(pollProcessingStatus, 2000);
      }
    } catch (error) {
      addLog(`Error checking processing status: ${error.message}`, 'error');
      setLocalLoading(false);
      setLoading(false);
    }
  }, [addLog, showSnackbar, setLoading]);

  const handleSubmit = useCallback(async () => {
    try {
      if (localLoading) return;
      if (!counterParty && tabValue === 1) {
        showSnackbar('Please select a Counter Party', 'error');
        return;
      }

      setLocalLoading(true);
      setLoading(true);
      setLogs([]);
      setResults([]);
      cancelTokenSource.current = api.CancelToken.source();

      let response;
      if (processType === 'url') {
        response = await api.post(
          '/api/dashboard/process_url',
          { url },
          { cancelToken: cancelTokenSource.current.token }
        );
      } else if (processType === 'text') {
        response = await api.post(
          '/api/dashboard/process_text',
          { 
            input_type: inputType, 
            input_value: inputValue, 
            cost_of_goods: costOfGoods, 
            vat, 
            counter_party: counterParty
          },
          { cancelToken: cancelTokenSource.current.token }
        );
      } else if (processType === 'image') {
        const formData = new FormData();
        formData.append('image', image);
        response = await api.post(
          '/api/dashboard/process_image',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            cancelToken: cancelTokenSource.current.token,
          }
        );
      } else {
        throw new Error('Invalid process type');
      }

      if (response.data && response.data.message === "Processing started") {
        pollProcessingStatus();
      } else {
        setResults(response.data);
        showSnackbar('Processing completed successfully', 'success');
        setLocalLoading(false);
        setLoading(false);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        showSnackbar('Request was cancelled', 'info');
      } else {
        showSnackbar(`Error processing ${processType}: ${error.message}`, 'error');
        console.error('Error details:', error);
      }
      setLocalLoading(false);
      setLoading(false);
    }
  }, [localLoading, counterParty, tabValue, processType, url, inputType, 
      inputValue, costOfGoods, vat, image, showSnackbar, setLoading, pollProcessingStatus]);

  const handleCancel = () => {
    if (cancelTokenSource.current) {
      cancelTokenSource.current.cancel('Operation canceled by the user.');
    }
    setLocalLoading(false);
    setLoading(false);
    showSnackbar('Processing cancelled', 'info');
  };

  // --- UI Handling Functions ---
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setProcessType(['url', 'text', 'image'][newValue]);
  };


  return (
    <ThemeProvider theme={theme}>
      <AppContainer maxWidth="xl">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4">
            Amazon Product Matching
          </Typography>
          <Box>
            <Tooltip title="View To Approve">
              <IconButton onClick={() => navigate('/to-approve')}>
                <SaveIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Past Searches">
              <IconButton onClick={() => navigate('/past-searches')}>
                <HistoryIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormSection>
              <Tabs value={tabValue} onChange={handleTabChange} centered>
                <Tab label="URL" />
                <Tab label="Text" />
                <Tab label="Image" />
              </Tabs>

              {tabValue === 0 && (
                <Box mt={3}>
                  <TextField
                    label="Enter Costco Catalog URL"
                    fullWidth
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    variant="outlined"
                  />
                </Box>
              )}

              {tabValue === 1 && (
                <Box mt={3}>
                  <RadioGroup
                    row
                    value={inputType}
                    onChange={(e) => setInputType(e.target.value)}
                  >
                    <FormControlLabel value="title" control={<Radio />} label="Product Title" />
                    <FormControlLabel value="asin" control={<Radio />} label="ASIN" />
                  </RadioGroup>
                  <TextField
                    label={inputType === 'title' ? "Product Title" : "ASIN"}
                    fullWidth
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    required
                    margin="normal"
                    variant="outlined"
                  />
                  <TextField
                    label="Cost of Goods"
                    fullWidth
                    value={costOfGoods}
                    onChange={(e) => setCostOfGoods(e.target.value)}
                    required
                    margin="normal"
                    variant="outlined"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">£</InputAdornment>,
                    }}
                  />
                  <FormControl fullWidth margin="normal" variant="outlined">
                    <InputLabel>VAT</InputLabel>
                    <Select
                      value={vat}
                      onChange={(e) => setVat(e.target.value)}
                      label="VAT"
                      required
                    >
                      <MenuItem value="0">0%</MenuItem>
                      <MenuItem value="0.2">20%</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth margin="normal" variant="outlined">
                    <Autocomplete
                      value={counterParty}
                      onChange={(event, newValue) => {
                        setCounterParty(newValue);
                      }}
                      disablePortal
                      options={counterParties}
                      getOptionLabel={(option) => option?.name || ''}
                      isOptionEqualToValue={(option, value) => option.id === value?.id}
                      loading={loadingCounterParties}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Counter Party"
                          required
                          error={!!counterPartyError}
                          helperText={counterPartyError}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingCounterParties ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      ListboxProps={{
                        style: { maxHeight: 200, overflow: 'auto' }
                      }}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          {option.name}
                        </li>
                      )}
                      fullWidth
                      noOptionsText="No counter parties found"
                    />
                  </FormControl>
                </Box>
              )}

              {tabValue === 2 && (
                <Box mt={3}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                  >
                    Upload Image
                    <input
                      type="file"
                      hidden
                      onChange={(e) => setImage(e.target.files[0])}
                      accept="image/*"
                    />
                  </Button>
                  {image && (
                    <Typography variant="body2" color="textSecondary" mt={1}>
                      Selected file: {image.name}
                    </Typography>
                  )}
                </Box>
              )}

              <SubmitButton
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Submit'}
              </SubmitButton>
              <CancelButton
                variant="contained"
                fullWidth
                onClick={handleCancel}
                disabled={!loading}
              >
                Cancel Request
              </CancelButton>
            </FormSection>
          </Grid>

          <Grid item xs={12} md={6}>
            <LogBox>
              <Typography variant="h6" gutterBottom>
                Logs
              </Typography>
              <LogContainer id="log-container">
                {logs.map((log, index) => (
                  <LogMessage key={index} logType={log.type}>
                    <LogIcon logType={log.type} />
                    <Box ml={1}>
                      <Typography variant="caption" color="textSecondary">
                        {log.timestamp}
                      </Typography>
                      <Typography variant="body2">{log.message}</Typography>
                    </Box>
                  </LogMessage>
                ))}
              </LogContainer>
            </LogBox>
          </Grid>
        </Grid>

        <ResultBox>
          <Typography variant="h6">Results</Typography>
          {localLoading && <LinearProgress />}
          {!localLoading && results.length > 0 && (
            <ResultTable 
              data={results} 
              setData={setResults}
              onSaveSelected={handleSaveSelected}
              onRemoveSelected={handleRemoveSelected}
              onDecisionUpdate={handleDashboardDecisionUpdate}
              onCommentUpdate={handleCommentUpdate}
              isSavedResults={false}
            />
          )}
        </ResultBox>
      </AppContainer>
    </ThemeProvider>
  );
};

export default Dashboard;