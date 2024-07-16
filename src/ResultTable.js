import React, { useState, useMemo, useCallback } from 'react';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import OrderedJsonViewer from './OrderedJsonViewer';
import ContextMenu from './ContextMenu';
import { useSnackbar } from './SnackbarContext';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NotInterestedIcon from '@mui/icons-material/NotInterested';

const truncateText = (text, maxLength) => {
  return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text || '';
};

const formatValue = (value) => (value === 'N/A' ? '' : value);

const ResultTable = ({ 
  data = [], 
  setData, 
  onSaveSelected, 
  isSavedResults = false, 
  onRemoveSelected, 
  onDecisionUpdate, 
  onCommentUpdate, 
  users, 
  assignees, 
  onAssigneeChange,
  showApprovalStatus = true,
  isPastResults = false,
}) => {
  const { showSnackbar } = useSnackbar();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [currentComment, setCurrentComment] = useState('');
  const [commentProductIndex, setCommentProductIndex] = useState(null);
  const [contextMenu, setContextMenu] = useState({ mouseX: null, mouseY: null });
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  const handleContextMenu = (event, index) => {
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4 });
    setSelectedRowIndex(index);
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ mouseX: null, mouseY: null });
    setSelectedRowIndex(null);
  };

  const handleAssigneeChange = (event, asin) => {
    event.stopPropagation();
    onAssigneeChange(asin, event.target.value);
  };

  const handleDecisionChange = async (newDecision) => {
    if (selectedRowIndex !== null) {
      try {
        const updatedItem = { ...data[selectedRowIndex], Decision: newDecision };
        await onDecisionUpdate(updatedItem);
        setData((prevData) => {
          const newData = [...prevData];
          newData[selectedRowIndex] = updatedItem;
          return newData;
        });
        showSnackbar('Decision updated successfully', 'success');
      } catch (error) {
        console.error('Error updating decision:', error);
        showSnackbar('Failed to update decision', 'error');
      }
      handleCloseContextMenu();
    }
  };

  const handleRowClick = (product) => setSelectedProduct(product);
  const handleCloseModal = () => setSelectedProduct(null);
  const handleCheckboxChange = (product) => setSelectedProducts((prevSelected) => ({ ...prevSelected, [product.ASIN]: !prevSelected[product.ASIN] }));
  
  const handleSaveSelected = async () => {
    const selectedItems = data.filter((item) => selectedProducts[item.ASIN]);
    if (selectedItems.length === 0) {
      showSnackbar("No items selected.", 'warning');
      return;
    }
    try {
      const response = await onSaveSelected(selectedItems);
      if (response && response.success) {
        showSnackbar(response.message || "Selected items saved successfully.", 'success');
        setData((prevData) => prevData.map((item) => selectedProducts[item.ASIN] ? { ...item, is_sent_for_approval: true } : item));
        setSelectedProducts({});
      } else {
        showSnackbar(response?.message || "Error saving selected items. Please try again.", 'error');
      }
    } catch (error) {
      console.error('Error saving selected items:', error);
      showSnackbar(error.message || "Error saving selected items. Please try again.", 'error');
    }
  };

  const handleRemoveSelected = () => {
    const selectedItems = data.filter((item) => selectedProducts[item.ASIN]);
    onRemoveSelected(selectedItems);
    setSelectedProducts({});
  };

  const handleFilterChange = (event) => setFilterText(event.target.value);
  const handleSortChange = (event) => setSortField(event.target.value);
  const handleSortDirectionChange = (event) => setSortDirection(event.target.value);
  const handleCommentEdit = (event, index) => {
    event.stopPropagation();
    setCommentProductIndex(index);
    setCurrentComment(data[index].Comment || '');
    setCommentModalOpen(true);
  };
  const handleCommentClose = () => setCommentModalOpen(false);
  const handleCommentSave = useCallback(() => {
    if (commentProductIndex !== null) {
      const updatedItem = { ...data[commentProductIndex], Comment: currentComment };
      onCommentUpdate(updatedItem);
      setData((prevData) => prevData.map((item, index) => (index === commentProductIndex ? updatedItem : item)));
      handleCommentClose();
      showSnackbar('Comment updated successfully', 'success');
    }
  }, [data, setData, commentProductIndex, currentComment, onCommentUpdate, showSnackbar]);

  const filteredData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.filter((product) => (product["Search Query"] || '').toLowerCase().includes(filterText.toLowerCase()) || (product["Amazon Product Name"] || '').toLowerCase().includes(filterText.toLowerCase()));
  }, [data, filterText]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortField) {
        const aValue = a[sortField];
        const bValue = b[sortField];
        return sortDirection === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
      }
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  const displayColumns = useMemo(() => {
    const columns = [
      "Search Query",
      "ASIN",
      "Amazon Product Name",
      "Matching Percentage",
      "Sales Volume",
      "Expected Sales Volume",
      "Buy Box Price",
      "Cheapest FBA Price",
      "Cheapest FBM Price",
      "Cheapest FBM Prime Price",
      "Sell Price FBA",
      "Sell Price FBM",
      "Margin FBA",
      "Margin FBM",
      "Margin FBA Non Registered",
      "Margin FBM Non Registered",
      "Expected Total Net Profit FBA",
      "Expected Total Net Profit FBM",
      "Expected Total Net Profit FBA Non Registered",
      "Expected Total Net Profit FBM Non Registered",
      "Is Sold by Amazon",
      "Decision"
    ];

    if (!isPastResults) {
      columns.push("Comment");
    }

    if (isSavedResults) {
      columns.push("Sent to Approval at");
    }

    if (showApprovalStatus && !isPastResults) {
      columns.push("Is Sent for Approval");
    }

    return columns;
  }, [isSavedResults, isPastResults, showApprovalStatus]);

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
            {displayColumns.map(column => (
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
              {displayColumns.map(column => (
                <TableCell key={column}>{column}</TableCell>
              ))}
              <TableCell align="center">Select</TableCell>
              {isSavedResults && <TableCell align="center">Assignee</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((product, index) => (
              <TableRow
                hover
                key={index}
                onClick={() => handleRowClick(product)}
                onContextMenu={(e) => handleContextMenu(e, index)}
                style={{
                  cursor: product['Is Sent for Approval'] ? 'not-allowed' : 'pointer',
                  backgroundColor: product['Is Sent for Approval'] ? '#e0e0e0' : 'inherit',
                  opacity: product['Is Sent for Approval'] ? 0.7 : 1,
                }}
              >
                {displayColumns.map(column => (
                  <TableCell key={column}>
                    {column === "Amazon Product Name" || column === "Search Query" ? (
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
                        <IconButton size="small" onClick={(e) => handleCommentEdit(e, index)} disabled={product['Is Sent for Approval']}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : column === "Is Sold by Amazon" ? (
                      <span>{product[column]}</span>
                    ) : column === "Decision" ? (
                      <span style={{ color: product.Decision && product.Decision.startsWith('No') ? 'red' : 'green' }}>
                        {product.Decision}
                      </span>
                    ) : column === "Is Sent for Approval" ? (
                      product[column] ? <CheckCircleOutlineIcon style={{ color: 'green' }} /> : <NotInterestedIcon style={{ color: 'red' }} />
                    ) : (
                      formatValue(product[column])
                    )}
                  </TableCell>
                ))}
                <TableCell align="center">
                  <Checkbox
                    checked={!!selectedProducts[product.ASIN]}
                    onChange={() => handleCheckboxChange(product)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                {isSavedResults && (
                  <TableCell align="center">
                    <Select
                      value={assignees[product.ASIN] || ''}
                      onChange={(e) => handleAssigneeChange(e, product.ASIN)}
                      onClick={(e) => e.stopPropagation()}  // Prevent row click when selecting assignee
                      displayEmpty
                      disabled={product['Is Sent for Approval']}  // Disable select if sent for approval
                    >
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>{user.username}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                )}
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

      <Box mt={2} display="flex" justifyContent="space-between">
      {!isPastResults && ( 
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveSelected}
          disabled={Object.values(selectedProducts).filter(Boolean).length === 0}
        >
          {!isSavedResults ? 'Approve Selected Items' : 'Send for Approval'}
        </Button>
      )}
        <Button
          variant="contained"
          color="secondary"
          onClick={handleRemoveSelected}
          startIcon={<DeleteIcon />}
          disabled={Object.values(selectedProducts).filter(Boolean).length === 0}
        >
          Remove Selected
        </Button>
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
            <Button onClick={handleCommentSave} color="primary" variant="contained">
              Save
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ResultTable;
