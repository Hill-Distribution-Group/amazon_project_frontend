import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
  styled,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
} from '@mui/material';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DownloadIcon from '@mui/icons-material/Download';
import { io } from 'socket.io-client';
import { useMemo } from 'react';

let theme = createTheme({
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
  palette: {
    primary: {
      main: '#2962FF',
    },
    secondary: {
      main: '#F50057',
    },
    background: {
      default: '#b0c4de',
    },
  },
});

theme = responsiveFontSizes(theme);

const LogContainer = styled(Box)(({ theme }) => ({
  maxHeight: '400px',
  overflow: 'hidden',
  overflowY: 'auto',
}));

const AppContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(4),
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  alignItems: 'center',
}));

const FormSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 8,
  backgroundColor: '#fff',
}));

const InputContainer = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
  '&:hover': {
    backgroundColor: '#0039CB',
  },
}));

const CancelButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.secondary.main,
  color: '#fff',
  '&:hover': {
    backgroundColor: '#C4002B',
  },
}));

const ResultBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 8,
  backgroundColor: '#ffffff',
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(5),
  width: '100%',
  minHeight: '400px',
  overflow: 'auto',
}));

const LogBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 8,
  backgroundColor: '#ffffff',
  marginBottom: theme.spacing(2),
  minHeight: 200,
}));

const UploadButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#00C853',
  color: '#fff',
  '&:hover': {
    backgroundColor: '#009626',
  },
}));

const LogMessage = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'logType',
})(({ theme, logType }) => ({
  color:
    logType === 'error'
      ? theme.palette.error.main
      : logType === 'warning'
      ? theme.palette.warning.main
      : logType === 'success'
      ? theme.palette.success.main
      : theme.palette.text.primary,
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
}));

const LogIcon = ({ logType }) => {
  switch (logType) {
    case 'error':
      return <ErrorOutlineIcon color="error" />;
    case 'warning':
      return <WarningAmberIcon color="warning" />;
    case 'success':
      return <CheckCircleOutlineIcon color="success" />;
    default:
      return null;
  }
};

function App() {
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
  const [downloadLink, setDownloadLink] = useState('');
  const cancelTokenSource = useRef(axios.CancelToken.source());
  const socket = useMemo(() => io(`${process.env.REACT_APP_BACKEND_URL}`, {
    transports: ['websocket'],
    withCredentials: true,
    extraHeaders: {
      "my-custom-header": "abcd"
    }
  }), []); 

  useEffect(() => {
    socket.on('log_message', (log) => {
      console.log(log);
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
    if (logContainer.scrollHeight > logContainer.clientHeight) {
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

  const pollProcessingStatus = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/process_status`
      );
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
      addLog(
        `Error checking processing status: ${error.message}`,
        'error'
      );
      setLoading(false);
    }
  };

  const handleDownloadResult = async () => {
    try {
      const resultResponse = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/get_result`,
        {
          responseType: processType === 'url' ? 'blob' : 'json',
        }
      );

      if (processType === 'url') {
        const downloadUrl = window.URL.createObjectURL(
          new Blob([resultResponse.data])
        );
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `results_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        addLog(`Download successful`, 'success');
      } else {
        setResults(resultResponse.data);
        setDownloadLink(
          `${process.env.REACT_APP_BACKEND_URL}/get_result`
        );
        addLog(`Download successful`, 'success');
      }
    } catch (error) {
      addLog(`Error downloading results: ${error.message}`, 'error');
    }
  };

  const handleUrlSubmit = async () => {
    if (!url) {
      addLog('URL is required', 'warning');
      return;
    }

    setLoading(true);
    setLogs([]);  // Clear logs
    setResults(null);  // Clear results
    cancelTokenSource.current = axios.CancelToken.source();
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/process_url`,
        { url },
        {
          cancelToken: cancelTokenSource.current.token,
        }
      );
      pollProcessingStatus();
    } catch (error) {
      handleError(error, 'processing URL');
      setLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!inputValue || !costOfGoods) {
      addLog('All fields are required', 'warning');
      return;
    }

    setLoading(true);
    setLogs([]);  // Clear logs
    setResults(null);  // Clear results
    cancelTokenSource.current = axios.CancelToken.source();
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/process_text`,
        {
          input_type: inputType,
          input_value: inputValue,
          cost_of_goods: costOfGoods,
          vat,
        },
        {
          cancelToken: cancelTokenSource.current.token,
        }
      );
      pollProcessingStatus();
    } catch (error) {
      handleError(error, 'processing text');
      setLoading(false);
    }
  };

  const handleImageSubmit = async () => {
    if (!image) {
      addLog('Image is required', 'warning');
      return;
    }

    setLoading(true);
    setLogs([]);  // Clear logs
    setResults(null);  // Clear results
    cancelTokenSource.current = axios.CancelToken.source();
    const formData = new FormData();
    formData.append('image', image);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/process_image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          cancelToken: cancelTokenSource.current.token,
        }
      );
      setResults(response.data);
      addLog(`Processed Image: ${image.name}`, 'info');
    } catch (error) {
      handleError(error, 'processing image');
    } finally {
      setLoading(false);
    }
  };

  const handleStopRequest = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/stop_process`
      );
      addLog('Stop request sent successfully.', 'warning');
    } catch (error) {
      addLog(
        `Error sending stop request: ${error.message}`,
        'error'
      );
    }
  };

  const cancelRequest = () => {
    if (loading) {
      cancelTokenSource.current.cancel(
        'Operation canceled by the user.'
      );
      handleStopRequest();
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
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

  return (
    <ThemeProvider theme={theme}>
      <AppContainer maxWidth="xl">
        <Typography variant="h4" fontWeight="bold" gutterBottom align="center" style={{ marginBottom: '2rem' }}>
          Amazon Product Matching
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={6} style={{ marginBottom: '2rem' }}>
            <FormSection>
              <FormControl fullWidth>
                <InputLabel htmlFor="process-type-select">Processing Type</InputLabel>
                <Select
                  id="process-type-select"
                  value={processType}
                  onChange={(e) => setProcessType(e.target.value)}
                  label="Processing Type"
                  startAdornment={
                    <InputAdornment position="start">
                      <CloudUploadIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="url">Process URL</MenuItem>
                  <MenuItem value="text">Process Text</MenuItem>
                  <MenuItem value="image">Process Image</MenuItem>
                </Select>
              </FormControl>
            </FormSection>

            {processType === 'url' && (
              <FormSection>
                <Typography variant="h6" gutterBottom>
                  Process URL
                </Typography>
                <InputContainer>
                  <TextField
                    label="Enter Costco Catalog URL"
                    fullWidth
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </InputContainer>
                <SubmitButton
                  variant="contained"
                  fullWidth
                  onClick={handleUrlSubmit}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit'}
                </SubmitButton>
                <CancelButton
                  variant="contained"
                  fullWidth
                  onClick={cancelRequest}
                  disabled={!loading}
                >
                  Cancel Request
                </CancelButton>
              </FormSection>
            )}

            {processType === 'text' && (
              <FormSection>
                <Typography variant="h6" gutterBottom>
                  Process Text
                </Typography>
                <InputContainer>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={inputType}
                      onChange={(e) => setInputType(e.target.value)}
                    >
                      <FormControlLabel
                        value="title"
                        control={<Radio />}
                        label="Product Title"
                      />
                      <FormControlLabel
                        value="asin"
                        control={<Radio />}
                        label="ASIN"
                      />
                    </RadioGroup>
                  </FormControl>
                </InputContainer>
                <InputContainer>
                  <TextField
                    label={inputType === 'title' ? "Product Title" : "ASIN"}
                    fullWidth
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    required
                  />
                </InputContainer>
                <InputContainer>
                  <TextField
                    label="Cost of Goods"
                    fullWidth
                    value={costOfGoods}
                    onChange={(e) => setCostOfGoods(e.target.value)}
                    required
                  />
                </InputContainer>
                <InputContainer>
                  <FormControl fullWidth>
                    <InputLabel htmlFor="vat-select">VAT</InputLabel>
                    <Select
                      id="vat-select"
                      value={vat}
                      onChange={(e) => setVat(e.target.value)}
                      label="VAT"
                      required
                    >
                      <MenuItem value="0">0%</MenuItem>
                      <MenuItem value="0.167">16.7%</MenuItem>
                    </Select>
                  </FormControl>
                </InputContainer>
                <SubmitButton
                  variant="contained"
                  fullWidth
                  onClick={handleTextSubmit}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit'}
                </SubmitButton>
                <CancelButton
                  variant="contained"
                  fullWidth
                  onClick={cancelRequest}
                  disabled={!loading}
                >
                  Cancel Request
                </CancelButton>
              </FormSection>
            )}

            {processType === 'image' && (
              <FormSection>
                <Typography variant="h6" gutterBottom>
                  Process Image
                </Typography>
                <InputContainer>
                  <UploadButton
                    variant="contained"
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
                  </UploadButton>
                  {image && (
                    <Typography variant="body2" color="textSecondary">
                      Selected file: {image.name}
                    </Typography>
                  )}
                </InputContainer>
                <SubmitButton
                  variant="contained"
                  fullWidth
                  onClick={handleImageSubmit}
                  disabled={loading || !image}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit'}
                </SubmitButton>
                <CancelButton
                  variant="contained"
                  fullWidth
                  onClick={cancelRequest}
                  disabled={!loading}
                >
                  Cancel Request
                </CancelButton>
              </FormSection>
            )}
          </Grid>

          <Grid item xs={12} md={6} lg={6}>
            <LogBox style={{ height: '500px' }}>
              <Typography variant="h6" gutterBottom>
                Logs
              </Typography>
              <LogContainer id="log-container">
                {logs.map((log, index) => (
                  <LogMessage key={index} logType={log.type}>
                    <LogIcon logType={log.type} />
                    <span style={{ marginLeft: 8 }}>{log.timestamp} - {log.message}</span>
                  </LogMessage>
                ))}
              </LogContainer>
            </LogBox>
          </Grid>
        </Grid>

        <Grid container justifyContent="center">
          <Grid item xs={12} md={8}>
            <ResultBox>
              <Typography variant="h6" gutterBottom>
                Results
                {downloadLink && (
                  <IconButton
                    href={downloadLink}
                    download={`result_${new Date().toISOString().replace(/[:.]/g, '-')}.json`}
                    style={{ float: 'right' }}
                  >
                    <DownloadIcon />
                  </IconButton>
                )}
              </Typography>
              {loading && <LinearProgress />}
              {results && <pre>{JSON.stringify(results, null, 2)}</pre>}
            </ResultBox>
          </Grid>
        </Grid>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
