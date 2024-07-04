import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { io } from 'socket.io-client';
import ResultTable from './ResultTable';
import { styled } from '@mui/system';
import api from './api';
import axios from 'axios';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';


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

function Dashboard({ isLoggedIn, checkLoginStatus }) {
  const [processType, setProcessType] = useState('url');
  const [inputType, setInputType] = useState('title');
  const [url, setUrl] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [costOfGoods, setCostOfGoods] = useState('');
  const [vat, setVat] = useState('');
  const [image, setImage] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const cancelTokenSource = useRef(axios.CancelToken.source());
  const navigate = useNavigate();

  const socket = useMemo(() => io(`${process.env.REACT_APP_BACKEND_URL}`, {
    transports: ['websocket'],
    withCredentials: true,
    extraHeaders: {
      "my-custom-header": "abcd"
    }
  }), []);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

const handleSaveSelected = async (selectedItems) => {
  try {
    const response = await api.post('/save_flagged', { items: selectedItems });
    console.log('Save response:', response);
    
    setResults(prevResults => {
      if (!Array.isArray(prevResults)) {
        console.error('prevResults is not an array:', prevResults);
        return [];
      }
      return prevResults.filter(item => !selectedItems.some(selectedItem => selectedItem.ASIN === item.ASIN));
    });
    
    return response;
  } catch (error) {
    console.error('Error saving items:', error);
    throw error;
  }
};

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
  }, [socket]);

  useEffect(() => {
    const logContainer = document.getElementById('log-container');
    if (logContainer && logContainer.scrollHeight > logContainer.clientHeight) {
      logContainer.style.overflowY = 'scroll';
    }
  }, [logs]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (loading) {
        event.preventDefault();
        event.returnValue = '';
        return 'You have an ongoing process. Are you sure you want to leave? This will stop the process.';
      }
    };

    const handleUnload = () => {
      if (loading) {
        navigator.sendBeacon(`${process.env.REACT_APP_BACKEND_URL}/stop_process`, JSON.stringify({
          reason: "User closed the tab or refreshed",
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [loading]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setProcessType(['url', 'text', 'image'][newValue]);
    setResults(null);
  };

  const pollProcessingStatus = async () => {
    try {
      const response = await api.get('/process_status');
      const { status } = response.data;

      if (status === 'completed') {
        handleDownloadResult();
        setLoading(false);
      } else if (status === 'stopped' || status === 'error') {
        addLog(`Process ${status}`, 'error');
        setLoading(false);
      } else {
        setTimeout(pollProcessingStatus, 2000);
      }
    } catch (error) {
      addLog(`Error checking processing status: ${error.message}`, 'error');
      setLoading(false);
    }
  };

  const handleDownloadResult = async () => {
    try {
      const resultResponse = await api.get('/get_result', { responseType: 'json' });
      setResults(Array.isArray(resultResponse.data) ? resultResponse.data : [resultResponse.data]);
    } catch (error) {
      addLog(`Error downloading results: ${error.message}`, 'error');
      setResults([]);
    }
  };

  const handleDashboardDecisionUpdate = (updatedItem) => {
    setResults(prevResults => {
      if (!Array.isArray(prevResults)) {
        console.error('prevResults is not an array:', prevResults);
        return [updatedItem];
      }
      return prevResults.map(item => 
        item.ASIN === updatedItem.ASIN ? { ...item, Decision: updatedItem.Decision } : item
      );
    });
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setLogs([]);
    setResults(null);
    cancelTokenSource.current = axios.CancelToken.source();

    try {
      switch (processType) {
        case 'url':
          await api.post(
            '/process_url',
            { url },
            { cancelToken: cancelTokenSource.current.token }
          );
          break;
        case 'text':
          await api.post(
            '/process_text',
            { input_type: inputType, input_value: inputValue, cost_of_goods: costOfGoods, vat },
            { cancelToken: cancelTokenSource.current.token }
          );
          break;
        case 'image':
          const formData = new FormData();
          formData.append('image', image);
          await api.post(
            '/process_image',
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
              cancelToken: cancelTokenSource.current.token,
            }
          );
          break;
        default:
          throw new Error('Invalid process type');
      }
      pollProcessingStatus();
    } catch (error) {
      handleError(error, `processing ${processType}`);
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (loading) {
      cancelTokenSource.current.cancel('Operation canceled by the user.');
      try {
        addLog('Cancelling process...', 'warning');
        await api.post('/stop_process');
        addLog('Process stopped successfully', 'warning');
      } catch (error) {
        addLog(`Error stopping process: ${error.message}`, 'error');
      }
      setLoading(false);
    }
  };

  const addLog = (message, type = 'info', timestamp = new Date().toLocaleString()) => {
    setLogs((logs) => [...logs, { message, type, timestamp }]);
    if (type === 'warning' || type === 'error') {
      setSnackbarSeverity(type);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    }
  };

  const handleError = (error, action) => {
    if (axios.isCancel(error)) {
      addLog('Request canceled by the user.', 'info');
    } else {
      addLog(`Error ${action}: ${error.message}`, 'error');
      setResults(null);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <AppContainer maxWidth="xl">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4">
            Amazon Product Matching
          </Typography>
          <Box>
            <Tooltip title="View Saved Results">
              <IconButton onClick={() => navigate('/saved-results')}>
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
          {loading && <LinearProgress />}
          {results && (
  <ResultTable 
    data={results} 
    setData={setResults}
    onSaveSelected={handleSaveSelected}
    onDecisionUpdate={handleDashboardDecisionUpdate}
    isSavedResults={false}
  />
)}
        </ResultBox>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} elevation={6} variant="filled">
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </AppContainer>
    </ThemeProvider>
  );
}

export default Dashboard;
