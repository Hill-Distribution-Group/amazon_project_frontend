import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Modal,
  Box,
  Checkbox,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import OrderedJsonViewer from './OrderedJsonViewer';
import ContextMenu from './ContextMenu';
import api from './api';

const truncateText = (text, maxLength) => {
  if (text && text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text || '';
};

const parseMargin = (marginStr) => {
  if (typeof marginStr === 'string' && marginStr.includes('%')) {
    return parseFloat(marginStr.replace('%', ''));
  }
  return parseFloat(marginStr);
};

const formatValue = (value) => {
  return value === 'N/A' ? '' : value;
};

const ResultTable = ({ data, setData, onSaveSelected, isSavedResults = false, onRemoveSelected }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [currentComment, setCurrentComment] = useState('');
  const [commentProductIndex, setCommentProductIndex] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [contextMenu, setContextMenu] = useState({
    mouseX: null,
    mouseY: null,
  });
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  const handleContextMenu = (event, index) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
    setSelectedRowIndex(index);
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ mouseX: null, mouseY: null });
    setSelectedRowIndex(null);
  };

  const handleDecisionChange = async (newDecision) => {
    if (selectedRowIndex !== null) {
      const updatedProduct = { ...data[selectedRowIndex], decision: newDecision };
      try {
        await api.post('/update_decision', { ASIN: updatedProduct.ASIN, decision: newDecision });
        const newData = [...data];
        newData[selectedRowIndex] = updatedProduct;
        setData(newData);
        setSnackbarMessage('Decision updated successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Error updating decision:', error);
        setSnackbarMessage('Failed to update decision');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  useEffect(() => {
    const dataWithDecision = data.map(product => ({
      ...product,
      decision: getDecision(product)
    }));
    setData(dataWithDecision);
  }, [data, setData]);

  const handleRowClick = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  const handleCheckboxChange = (product) => {
    setSelectedProducts((prevSelected) => ({
      ...prevSelected,
      [product["ASIN"]]: !prevSelected[product["ASIN"]]
    }));
  };

  const handleSaveSelected = async () => {
    const selectedItems = data.filter(item => selectedProducts[item.ASIN]);
    try {
      const response = await onSaveSelected(selectedItems);
      if (response.data.warnings.length > 0) {
        setSnackbarMessage(response.data.warnings.join(', '));
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage("Error saving selected items.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    setSelectedProducts({});
  };

  const handleRemoveSelected = () => {
    const selectedItems = data.filter(item => selectedProducts[item.ASIN]);
    onRemoveSelected(selectedItems);
    setSelectedProducts({});
  };

  const getDecision = (product) => {
    const marginFBA = parseMargin(product["Margin FBA"]);
    const marginFBM = parseMargin(product["Margin FBM"]);
    const marginFBANonRegistered = parseMargin(product["Margin FBA Non Registered"]);
    const marginFBMNonRegistered = parseMargin(product["Margin FBM Non Registered"]);
    const expectedProfitFBA = parseFloat(product["Expected Total Net Profit FBA"]);
    const expectedProfitFBM = parseFloat(product["Expected Total Net Profit FBM"]);
    const expectedProfitFBANonRegistered = parseFloat(product["Expected Total Net Profit FBA Non Registered"]);
    const expectedProfitFBMNonRegistered = parseFloat(product["Expected Total Net Profit FBM Non Registered"]);
    const profitDifferenceThreshold = 0.1; // Example threshold of 10%
    
    let decision = "No Buy";
    let highestMargin = 0;
    
    // Check registered options first
    if (!isNaN(marginFBA) && marginFBA > 9 && expectedProfitFBA > 0) {
      if (marginFBA > highestMargin) {
        highestMargin = marginFBA;
        decision = "Buy (FBA-registered)";
      }
      if (!isNaN(marginFBM) && marginFBM > 9 && expectedProfitFBM > 0) {
        const profitDifference = (expectedProfitFBM - expectedProfitFBA) / expectedProfitFBA;
        if (profitDifference > profitDifferenceThreshold && marginFBM > highestMargin) {
          highestMargin = marginFBM;
          decision = "Buy (FBM-registered)";
        }
      }
    }
    
    if (!isNaN(marginFBM) && marginFBM > 9 && expectedProfitFBM > 0) {
      if (marginFBM > highestMargin) {
        highestMargin = marginFBM;
        decision = "Buy (FBM-registered)";
      }
    }
    
    // Check non-registered options
    if (!isNaN(marginFBANonRegistered) && marginFBANonRegistered > 9 && expectedProfitFBANonRegistered > 0) {
      if (marginFBANonRegistered > highestMargin) {
        highestMargin = marginFBANonRegistered;
        decision = "Buy (FBA-non-registered)";
      }
      if (!isNaN(marginFBMNonRegistered) && marginFBMNonRegistered > 9 && expectedProfitFBMNonRegistered > 0) {
        const profitDifferenceNonRegistered = (expectedProfitFBMNonRegistered - expectedProfitFBANonRegistered) / expectedProfitFBANonRegistered;
        if (profitDifferenceNonRegistered > profitDifferenceThreshold && marginFBMNonRegistered > highestMargin) {
          highestMargin = marginFBMNonRegistered;
          decision = "Buy (FBM-non-registered)";
        }
      }
    }
    
    if (!isNaN(marginFBMNonRegistered) && marginFBMNonRegistered > 9 && expectedProfitFBMNonRegistered > 0) {
      if (marginFBMNonRegistered > highestMargin) {
        highestMargin = marginFBMNonRegistered;
        decision = "Buy (FBM-non-registered)";
      }
    }
    
    return decision;
  };

  const handleFilterChange = (event) => {
    setFilterText(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortField(event.target.value);
  };

  const handleSortDirectionChange = (event) => {
    setSortDirection(event.target.value);
  };

  const handleCommentEdit = (event, index) => {
    event.stopPropagation();
    setCommentProductIndex(index);
    setCurrentComment(sortedData[index].comment || '');
    setCommentModalOpen(true);
  };

  const handleCommentClose = () => {
    setCommentModalOpen(false);
    setCurrentComment('');
  };

  const handleCommentSave = useCallback(() => {
    if (typeof setData === 'function') {
      const newData = data.map((item, index) => 
        index === commentProductIndex ? { ...item, comment: currentComment } : item
      );
      setData(newData);
      handleCommentClose();
    } else {
      console.error('setData is not a function. Unable to save comment.');
    }
  }, [data, setData, commentProductIndex, currentComment]);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter(product => 
      (product["Costco Product Name"] || '').toLowerCase().includes(filterText.toLowerCase()) || 
      (product["Amazon Product Name"] || '').toLowerCase().includes(filterText.toLowerCase())
    );
  }, [data, filterText]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortField) {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      }
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  const columns = [
    "Costco Product Name",
    "Amazon Product Name",
    "ASIN",
    "Matching Percentage",
    "Sales Volume",
    "Expected Sales Volume",
    "Buy Box Price",
    "Cheapest FBA Price",
    "Cheapest FBM Price",
    "Cheapest FBM Prime Price",
    "Margin FBA",
    "Margin FBM",
    "Margin FBA Non Registered",
    "Margin FBM Non Registered",
    "Expected Total Net Profit FBA",
    "Expected Total Net Profit FBM",
    "Expected Total Net Profit FBA Non Registered",
    "Expected Total Net Profit FBM Non Registered",
    "Is Sold by Amazon",
    "Comment",
    "Decision" // Update here to match column heading
  ];

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField
          label="Filter by Name"
          value={filterText}
          onChange={handleFilterChange}
        />
        <FormControl>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortField}
            onChange={handleSortChange}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            {columns.map(column => (
              <MenuItem key={column} value={column}>{column}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>Sort Direction</InputLabel>
          <Select
            value={sortDirection}
            onChange={handleSortDirectionChange}
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column}>{column}</TableCell>
              ))}
              <TableCell align="center">Select</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((product, index) => (
              <TableRow 
                hover 
                key={index}
                onClick={() => handleRowClick(product)}
                onContextMenu={(e) => handleContextMenu(e, index)}
                style={{ cursor: 'pointer' }}
              >
                {columns.map(column => (
                  <TableCell key={column}>
                    {column === "Costco Product Name" || column === "Amazon Product Name" ? (
                      <Tooltip title={product[column] || ''}>
                        <span>{truncateText(product[column], 20)}</span>
                      </Tooltip>
                    ) : column.includes('Price') || column.includes('Profit') ? (
                      `£${formatValue(product[column])}`
                    ) : column === 'Matching Percentage' ? (
                      <span style={{ color: parseFloat(product[column]) > 80 ? 'green' : 'orange' }}>
                        {formatValue(product[column])}%
                      </span>
                    ) : column === 'Comment' ? (
                      <Box display="flex" alignItems="center">
                        <Tooltip title={product[column] || 'No comment'}>
                          <span>{truncateText(product[column] || '', 20)}</span>
                        </Tooltip>
                        <IconButton size="small" onClick={(e) => handleCommentEdit(e, index)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : column === "Is Sold by Amazon" ? (
                      <span>{product[column]}</span>
                    ) : column === "Decision" ? (
                      <span style={{ color: product.decision && product.decision.startsWith('No') ? 'red' : 'green' }}>
                        {product.decision}
                      </span>
                    ) : (
                      formatValue(product[column])
                    )}
                  </TableCell>
                ))}
                <TableCell align="center">
                  <Checkbox
                    checked={!!selectedProducts[product["ASIN"]]}
                    onChange={() => handleCheckboxChange(product)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <ContextMenu
        anchorPosition={
          contextMenu.mouseY !== null && contextMenu.mouseX !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        isOpen={contextMenu.mouseY !== null}
        onClose={handleCloseContextMenu}
        onDecisionChange={handleDecisionChange}
      />

        </Table>
      </TableContainer>

      <Box mt={2}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSaveSelected}
          disabled={Object.values(selectedProducts).filter(Boolean).length === 0}
        >
          {isSavedResults ? 'Approve Selected Items' : 'Save Selected Items'}
        </Button>
        
        {isSavedResults && (
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleRemoveSelected}
            disabled={Object.values(selectedProducts).filter(Boolean).length === 0}
          >
            Remove Selected Items
          </Button>
        )}
      </Box>
      
      <Modal
        open={!!selectedProduct}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxHeight: '90%',
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          overflow: 'auto',
          p: 4,
        }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Full Product Details
          </Typography>
          <Box
            id="modal-modal-description"
            sx={{ marginTop: '16px', maxHeight: '80vh', overflow: 'auto' }}
          >
            <OrderedJsonViewer data={selectedProduct} />
          </Box>
        </Box>
      </Modal>

      <Modal
        open={commentModalOpen}
        onClose={handleCommentClose}
        aria-labelledby="comment-modal-title"
        aria-describedby="comment-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="comment-modal-title" variant="h6" component="h2">
            Edit Comment
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={currentComment}
            onChange={(e) => setCurrentComment(e.target.value)}
            margin="normal"
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={handleCommentSave} color="primary">
              Save
            </IconButton>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} elevation={6} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ResultTable;
