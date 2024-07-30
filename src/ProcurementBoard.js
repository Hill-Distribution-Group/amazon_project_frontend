import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  TextField, Button, Typography, Paper, CircularProgress, Grid, Box, MenuItem, Select,
  FormControl, InputLabel, InputAdornment, LinearProgress, RadioGroup, FormControlLabel, Radio,
  Tabs, Tab, Autocomplete, Drawer, Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HistoryIcon from '@mui/icons-material/History';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/system';
import ResultTable from './ResultTable';
import api from './api';
import axios from 'axios';
import { useSnackbar } from './SnackbarContext';
import {
  PageContainer,
  ContentContainer,
  ResultsContainer,
  StyledHeader,
  StyledButton,
  HeaderTitle,
  HeaderActions
} from './themes/globalTheme';

const LogDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '300px',
    overflow: 'auto',
  },
}));

const ProcurementBoard = ({ isLoggedIn, checkLoginStatus }) => {
  const [processType, setProcessType] = useState('text');
  const [inputType, setInputType] = useState('title');
  const [url, setUrl] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [costOfGoods, setCostOfGoods] = useState('');
  const [vat, setVat] = useState('');
  const [image, setImage] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [tabValue, setTabValue] = useState(1); // Default to 'text' tab
  const cancelTokenSource = useRef(axios.CancelToken.source());
  const navigate = useNavigate();
  const [counterParty, setCounterParty] = useState('');
  const [counterParties, setCounterParties] = useState([]);
  const [loadingCounterParties, setLoadingCounterParties] = useState(false);
  const [counterPartyError, setCounterPartyError] = useState(null);
  const { showSnackbar } = useSnackbar();
  const [localLoading, setLocalLoading] = useState(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [resultTabValue, setResultTabValue] = useState(0);
  const [pendingResults, setPendingResults] = useState([]);
  const [rejectedResults, setRejectedResults] = useState([]);
  const [approvedResults, setApprovedResults] = useState([]);
  const [cantProcureResults, setCantProcureResults] = useState([]);
  const [cantListedResults, setCantListedResults] = useState([]);

  const handleResultTabChange = (event, newValue) => {
    setResultTabValue(newValue);
  };

  const resetInputValues = useCallback(() => {
    setUrl('');
    setInputValue('');
    setCostOfGoods('');
    setVat('');
    setImage(null);
    setCounterParty('');
  }, []);

  const LogIcon = ({ logType }) => {
    switch (logType) {
      case 'error': return <ErrorOutlineIcon color="error" />;
      case 'warning': return <WarningAmberIcon color="warning" />;
      case 'success': return <CheckCircleOutlineIcon color="success" />;
      default: return null;
    }
  };

  const toggleLogDrawer = useCallback(() => {
    setLogDrawerOpen((prev) => !prev);
  }, []);

  // Socket.io Setup
  const socket = useMemo(() => io(`${process.env.REACT_APP_BACKEND_URL}`, {
    transports: ['websocket'],
    withCredentials: true,
    extraHeaders: {
      "my-custom-header": "abcd"
    }
  }), []);

  // Data Fetching Functions
  const fetchSearchResults = useCallback(async () => {
    try {
      const response = await api.get('/api/procurement_board/get_search_results');
      if (response.data) {
        const allResults = response.data;
        setResults(allResults.filter(item => item['Approval Status'] === 'not_sent'));
        setPendingResults(allResults.filter(item => item['Approval Status'] === 'pending'));
        setRejectedResults(allResults.filter(item => item['Approval Status'] === 'rejected'));
        setApprovedResults(allResults.filter(item => item['Approval Status'] === 'approved'));
        setCantProcureResults(allResults.filter(item => item['Approval Status'] === 'cant_procured'));
        setCantListedResults(allResults.filter(item => item['Approval Status'] === 'cant_listed'));
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

  // Log Handling
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

  // Data Handling Functions
  const handleSaveSelected = async (selectedItems) => {
    try {
      const response = await api.post('/api/procurement_board/save_flagged', { items: selectedItems });
      if (response.data && response.data.message) {
        setResults(prevResults => prevResults.map(item => {
          if (selectedItems.some(selectedItem => selectedItem.ID === item.ID)) {
            return { ...item };
          }
          return item;
        }));
        showSnackbar(response.data.message, 'success');
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Error sending items for approval. Please try again.', 'error');
      return { success: false, message: error.response?.data?.error || 'Error sending items for approval' };
    }
  };

  const handleRemoveSelected = async (selectedItems) => {
    try {
      const idList = selectedItems.map(item => item.ID);
      await api.post('/api/procurement_board/remove_results', { ID_list: idList });
      setResults(prevResults => prevResults.filter(item => !idList.includes(item.ID)));
      showSnackbar('Selected items removed successfully', 'success');
    } catch (error) {
      console.error('Error removing items:', error);
      showSnackbar('Error removing items. Please try again.', 'error');
    }
  };

  const handleDashboardDecisionUpdate = async (updatedItem) => {
    try {
      const response = await api.post('/api/procurement_board/update_decision', {
        ID: updatedItem.ID,
        Decision: updatedItem.Decision,
      });
      if (response.status === 200) {
        setResults(prevResults => prevResults.map(item =>
          item.ID === updatedItem.ID ? { ...item, Decision: updatedItem.Decision } : item
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
      const response = await api.post('/api/procurement_board/update_comment', {
        ID: updatedItem.ID,
        Comment: updatedItem.Comment,
      });
      if (response.status === 200) {
        setResults(prevResults => prevResults.map(item =>
          item.ID === updatedItem.ID ? { ...item, Comment: updatedItem.Comment } : item
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

  const pollProcessingStatus = useCallback(async () => {
    try {
      const response = await api.get('/api/procurement_board/process_status');
      const { status } = response.data;

      if (status === 'completed') {
        const resultResponse = await api.get('/api/procurement_board/get_result');
        setResults(Array.isArray(resultResponse.data) ? resultResponse.data : [resultResponse.data]);
        showSnackbar('Processing completed successfully', 'success');
        setLocalLoading(false);
        setLoading(false);
        resetInputValues(); // Reset input values after processing is complete
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
  }, [addLog, showSnackbar, resetInputValues]);

  // Form Submission and Processing
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
      cancelTokenSource.current = axios.CancelToken.source();

      let response;
      if (processType === 'url') {
        response = await api.post(
          '/api/procurement_board/process_url',
          { url },
          { cancelToken: cancelTokenSource.current.token }
        );
      } else if (processType === 'text') {
        response = await api.post(
          '/api/procurement_board/process_text',
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
          '/api/procurement_board/process_image',
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
        resetInputValues(); // Reset input values after processing is complete
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
    inputValue, costOfGoods, vat, image, showSnackbar, pollProcessingStatus, resetInputValues]);

  const handleCancel = () => {
    if (cancelTokenSource.current) {
      cancelTokenSource.current.cancel('Operation canceled by the user.');
    }
    setLocalLoading(false);
    setLoading(false);
    showSnackbar('Processing cancelled', 'info');
  };

  // UI Handling Functions
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setProcessType(['url', 'text', 'image'][newValue]);
  };

  return (
    <PageContainer>
      <StyledHeader>
        <Box sx={{ width: '33%' }} />
        <HeaderTitle variant="h5" component="h1" color="textPrimary">
          Procurement Board
        </HeaderTitle>
        <HeaderActions>
          <Button
            variant="text"
            startIcon={<HistoryIcon />}
            onClick={() => navigate('/past-searches')}
            sx={{ mr: 2 }}
          >
            Past Searches
          </Button>
          <Button
            variant="text"
            startIcon={logDrawerOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            onClick={toggleLogDrawer}
          >
            {logDrawerOpen ? "Hide Logs" : "Show Logs"}
          </Button>
        </HeaderActions>
      </StyledHeader>

      <ContentContainer>
        <Paper elevation={3} sx={{ p: 2, mb: 2, width: '100%' }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
            <Tab label="URL" />
            <Tab label="TEXT" />
            <Tab label="IMAGE" />
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
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={inputType}
                      onChange={(e) => setInputType(e.target.value)}
                    >
                      <FormControlLabel value="title" control={<Radio />} label="Product Title" />
                      <FormControlLabel value="asin" control={<Radio />} label="ASIN" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label={inputType === 'title' ? "Product Title" : "ASIN"}
                    fullWidth
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    label="Cost of Goods"
                    fullWidth
                    value={costOfGoods}
                    onChange={(e) => setCostOfGoods(e.target.value)}
                    required
                    variant="outlined"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">£</InputAdornment>,
                      inputProps: { min: 0 } // Add min attribute to prevent negative input

                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>VAT</InputLabel>
                    <Select
                      value={vat}
                      onChange={(e) => setVat(e.target.value)}
                      label="VAT"
                      required
                    >
                      <MenuItem value="0">0%</MenuItem>
                      <MenuItem value="0.05">5%</MenuItem>
                      <MenuItem value="0.2">20%</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
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
                </Grid>
              </Grid>
            </Box>
          )}

          {tabValue === 2 && (
            <Box mt={3}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<CloudUploadIcon />}
                sx={{
                  width: 200,
                  margin: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
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

          <Box mt={4} display="flex" justifyContent="center">
            <StyledButton
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              sx={{ mr: 2, minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit'}
            </StyledButton>
            <StyledButton
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              disabled={!loading}
              sx={{ minWidth: 120 }}
            >
              Cancel
            </StyledButton>
          </Box>
        </Paper>

        <ResultsContainer>
          <Typography variant="h5" gutterBottom>Results</Typography>
          {localLoading && <LinearProgress sx={{ mb: 2 }} />}
          {!localLoading && (results.length > 0 || pendingResults.length > 0 || rejectedResults.length > 0 || approvedResults.length > 0 || cantProcureResults.length > 0 || cantListedResults.length > 0) && (
            <>
              <Tabs value={resultTabValue} onChange={handleResultTabChange} sx={{ mb: 2 }}>
                <Tab label={`New Results`} />
                <Tab label={`Pending (${pendingResults.length})`} />
                <Tab label={`Rejected (${rejectedResults.length})`} />
                <Tab label={`Approved (${approvedResults.length})`} />
                <Tab label={`Can't Procure (${cantProcureResults.length})`} />
                <Tab label={`Can't Listed (${cantListedResults.length})`} />
              </Tabs>
              {resultTabValue === 0 && (
                <ResultTable
                  data={results}
                  setData={setResults}
                  onSaveSelected={handleSaveSelected}
                  onRemoveSelected={handleRemoveSelected}
                  onDecisionUpdate={handleDashboardDecisionUpdate}
                  onCommentUpdate={handleCommentUpdate}
                  isSavedResults={false}
                  showRemoveButton={true}
                />
              )}
              {resultTabValue === 1 && (
                <ResultTable
                  data={pendingResults}
                  setData={setPendingResults}
                  onSaveSelected={handleSaveSelected}
                  onRemoveSelected={handleRemoveSelected}
                  onDecisionUpdate={handleDashboardDecisionUpdate}
                  onCommentUpdate={handleCommentUpdate}
                  isSavedResults={false}
                  showSendForApprovalButton={false}
                />
              )}
              {resultTabValue === 2 && (
                <ResultTable
                  data={rejectedResults}
                  setData={setRejectedResults}
                  onSaveSelected={handleSaveSelected}
                  onRemoveSelected={handleRemoveSelected}
                  onDecisionUpdate={handleDashboardDecisionUpdate}
                  onCommentUpdate={handleCommentUpdate}
                  isSavedResults={false}
                />
              )}
              {resultTabValue === 3 && (
                <ResultTable
                  data={approvedResults}
                  setData={setApprovedResults}
                  onSaveSelected={handleSaveSelected}
                  onRemoveSelected={handleRemoveSelected}
                  onDecisionUpdate={handleDashboardDecisionUpdate}
                  onCommentUpdate={handleCommentUpdate}
                  isSavedResults={false}
                  showSendForApprovalButton={false}
                />
              )}
              {resultTabValue === 4 && (
                <ResultTable
                  data={cantProcureResults}
                  setData={setCantProcureResults}
                  onSaveSelected={handleSaveSelected}
                  onRemoveSelected={handleRemoveSelected}
                  onDecisionUpdate={handleDashboardDecisionUpdate}
                  onCommentUpdate={handleCommentUpdate}
                  isSavedResults={false}
                  showSendForApprovalButton={false}
                />
              )}
              {resultTabValue === 5 && (
                <ResultTable
                  data={cantListedResults}
                  setData={setCantListedResults}
                  onSaveSelected={handleSaveSelected}
                  onRemoveSelected={handleRemoveSelected}
                  onDecisionUpdate={handleDashboardDecisionUpdate}
                  onCommentUpdate={handleCommentUpdate}
                  isSavedResults={false}
                  showSendForApprovalButton={false}
                />
              )}
            </>
          )}
        </ResultsContainer>
      </ContentContainer>

      <LogDrawer
        anchor="right"
        open={logDrawerOpen}
        onClose={toggleLogDrawer}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>System Logs</Typography>
          <Divider sx={{ mb: 2 }} />
          {logs.map((log, index) => (
            <Box key={index} sx={{ mb: 2, p: 1, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
              <Box display="flex" alignItems="center">
                <LogIcon logType={log.type} />
                <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                  {log.timestamp}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 0.5 }}>{log.message}</Typography>
            </Box>
          ))}
        </Box>
      </LogDrawer>
    </PageContainer>
  );
};

export default ProcurementBoard;
