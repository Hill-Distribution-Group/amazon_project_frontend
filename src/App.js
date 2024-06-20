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
} from '@mui/material';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { io } from 'socket.io-client';
import { useMemo } from 'react';

// Updated theme with new colors and font
let theme = createTheme({
  typography: {
    fontFamily: 'Roboto, sans-serif', // Changed font to Roboto
  },
  palette: {
    primary: {
      main: '#2962FF', // Updated primary color
    },
    secondary: {
      main: '#F50057', // Updated secondary color
    },
    background: {
      default: '#b0c4de', // Updated background color
    },
  },
});

theme = responsiveFontSizes(theme);

const LogContainer = styled(Box)(({ theme }) => ({
  maxHeight: '400px', // Maximum height before scrolling is enabled
  overflow: 'hidden', // Initially disable scrolling
  overflowY: 'auto', // Make sure overflowY is set to 'auto' to enable scrolling
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
  // Removed width: '100%' to allow for narrower input section
}));

const InputContainer = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
  '&:hover': {
    backgroundColor: '#0039CB', // Updated hover color
  },
}));

const CancelButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.secondary.main,
  color: '#fff',
  '&:hover': {
    backgroundColor: '#C4002B', // Updated hover color
  },
}));

const ResultBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(),
  borderRadius: 8,
  backgroundColor: '#ffffff',
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(5),
  minHeight: 400, // Increased initial height for results
}));

const LogBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 8,
  backgroundColor: '#ffffff',
  marginBottom: theme.spacing(2),
  minHeight: 200, // Increased initial height for results
}));

const UploadButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#00C853', // Updated button color
  color: '#fff',
  '&:hover': {
    backgroundColor: '#009626', // Updated hover color
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
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [counterParty, setCounterParty] = useState('');
  const [costOfGoods, setCostOfGoods] = useState('');
  const [image, setImage] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const cancelTokenSource = useRef(axios.CancelToken.source());
  const socket = useMemo(() => io(`${process.env.REACT_APP_BACKEND_URL}`, {
    transports: ['websocket'],
    withCredentials: true,
    extraHeaders: {
      "my-custom-header": "abcd"
    }
  }), []); // Only re-create the socket if the URL changes, which normally wouldn't happen

  useEffect(() => {
    socket.on('log_message', (log) => {
      console.log(log);
      if (typeof log === 'string') {
        const logData = JSON.parse(log);
        addLog(logData.message, logData.type);
      } else {
        addLog(log.message, log.type);
      }
    });
  
    return () => {
      socket.off('log_message');
    };
  }, [socket]); // Include `socket` in the dependencies array

  useEffect(() => {
    const logContainer = document.getElementById('log-container');
    if (logContainer.scrollHeight > logContainer.clientHeight) {
      logContainer.style.overflowY = 'scroll'; // Enable scrolling if content overflows
    }
  }, [logs]); // Depend on logs so it runs every time logs update

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
          responseType: 'blob',
        }
      );
      const downloadUrl = window.URL.createObjectURL(
        new Blob([resultResponse.data])
      );
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'results.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();

      addLog(`Download successful`, 'success');
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
    cancelTokenSource.current = axios.CancelToken.source(); // Reset token here
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
    if (!title || !counterParty || !costOfGoods) {
      addLog('All fields are required', 'warning');
      return;
    }

    setLoading(true);
    cancelTokenSource.current = axios.CancelToken.source();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/process_text`,
        {
          title,
          counter_party: counterParty,
          cost_of_goods: costOfGoods,
        },
        {
          cancelToken: cancelTokenSource.current.token,
        }
      );
      setResults(response.data);
      addLog(
        `Processed Text: ${title}, ${counterParty}, ${costOfGoods}`,
        'info'
      );
    } catch (error) {
      handleError(error, 'processing text');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSubmit = async () => {
    if (!image) {
      addLog('Image is required', 'warning');
      return;
    }

    setLoading(true);
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

  const addLog = (message, type = 'info') => {
    setLogs((logs) => [...logs, { message, type }]);
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
          {/* Input Section - Now narrower and with spacing */}
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
                  <TextField
                    label="Title"
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </InputContainer>
                <InputContainer>
                  <TextField
                    label="Counter Party"
                    fullWidth
                    value={counterParty}
                    onChange={(e) => setCounterParty(e.target.value)}
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

          {/* Logs Column - Now wider and taller */}
          <Grid item xs={12} md={6} lg={6}>
            <LogBox style={{ height: '500px' }}>
              <Typography variant="h6" gutterBottom>
                Logs
              </Typography>
              <LogContainer id="log-container">
                {logs.map((log, index) => (
                  <LogMessage key={index} logType={log.type}>
                    <LogIcon logType={log.type} />
                    <span style={{ marginLeft: 8 }}>{log.message}</span>
                  </LogMessage>
                ))}
              </LogContainer>
            </LogBox>
          </Grid>
        </Grid>

        {/* Results Section - Now smaller and centered */}
        <Grid container justifyContent="center"> {/* Centered content */}
          <Grid item xs={12} md={8}>
            <ResultBox>
              <Typography variant="h6" gutterBottom>
                Results
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
