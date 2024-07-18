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
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  ListItemText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import OrderedJsonViewer from './OrderedJsonViewer';
import ContextMenu from './ContextMenu';
import { useSnackbar } from './SnackbarContext';
import EnhancedFilterSortControls from './EnhancedFilterSortControls';

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
  multipleAssignees = false,
}) => {
  const { showSnackbar } = useSnackbar();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [currentComment, setCurrentComment] = useState('');
  const [commentProductIndex, setCommentProductIndex] = useState(null);
  const [contextMenu, setContextMenu] = useState({ mouseX: null, mouseY: null });
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: '', direction: 'asc' });

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
    const value = event.target.value;
    onAssigneeChange(asin, multipleAssignees ? value : value[value.length - 1]);
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
  const handleCheckboxChange = (product) => {
    setSelectedProducts((prevSelected) => ({
      ...prevSelected,
      [product.ASIN]: !prevSelected[product.ASIN]
    }));
  };

  const handleSelectAll = (event) => {
    const isChecked = event.target.checked;
    const newSelectedProducts = {};
    data.forEach((item) => {
      newSelectedProducts[item.ASIN] = isChecked;
    });
    setSelectedProducts(newSelectedProducts);
  };
  
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
        setData((prevData) => prevData.map((item) => 
          selectedProducts[item.ASIN] ? { ...item, is_sent_for_approval: true } : item
        ));
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

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (field, direction) => {
    setSortConfig({ field, direction });
  };

  const columns = useMemo(() => {
    const baseColumns = [
      { field: "Search Query", headerName: "Search Query" },
      { field: "ASIN", headerName: "ASIN" },
      { field: "Amazon Product Name", headerName: "Product Name" },
      { field: "Matching Percentage", headerName: "Match %" },
      { field: "Cost of Goods", headerName: "CoG" },
      { field: "VAT Rate", headerName: "VAT %" },
      { field: "Sales Volume", headerName: "Sales Volume" },
      { field: "Expected Sales Volume", headerName: "Exp. Sales Volume" },
      { field: "Buy Box Price", headerName: "Buy Box Price" },
      { field: "Cheapest FBA Price", headerName: "Cheapest FBA" },
      { field: "Cheapest FBM Price", headerName: "Cheapest FBM" },
      { field: "Cheapest FBM Prime Price", headerName: "Cheapest FBM Prime" },
      { field: "Sell Price FBA", headerName: "Sell Price FBA" },
      { field: "Sell Price FBM", headerName: "Sell Price FBM" },
      { field: "Margin FBA", headerName: "Margin FBA" },
      { field: "Margin FBM", headerName: "Margin FBM" },
      { field: "Expected Total Net Profit FBA", headerName: "Exp. Profit FBA" },
      { field: "Expected Total Net Profit FBM", headerName: "Exp. Profit FBM" },
      { field: "Is Sold by Amazon", headerName: "Sold by Amazon" },
      { field: "Decision", headerName: "Decision" }
    ];

    if (!isPastResults) {
      baseColumns.push({ field: "Comment", headerName: "Comment" });
    }

    if (isSavedResults) {
      baseColumns.push({ field: "Sent to Approval at", headerName: "Sent to Approval" });
    }

    if (showApprovalStatus && !isPastResults) {
      baseColumns.push({ field: "Is Sent for Approval", headerName: "Approval Status" });
    }

    return baseColumns;
  }, [isSavedResults, isPastResults, showApprovalStatus]);

  const filteredAndSortedData = useMemo(() => {
    let result = data;

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        result = result.filter(item => 
          String(item[field]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig.field) {
      result.sort((a, b) => {
        if (a[sortConfig.field] < b[sortConfig.field]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.field] > b[sortConfig.field]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, filters, sortConfig]);

  const renderCell = (item, column) => {
    const value = item[column.field];
  
    if (column.field === "Amazon Product Name" || column.field === "Search Query") {
      return (
        <Tooltip title={value || ''}>
          <span>{truncateText(value, 20)}</span>
        </Tooltip>
      );
    } else if (column.field.includes('Price') || column.field.includes('Profit')) {
      return `£${formatValue(value)}`;
    } else if (column.field === 'Matching Percentage') {
      return (
        <span style={{ color: parseFloat(value) > 80 ? 'green' : 'orange' }}>
          {formatValue(value)}%
        </span>
      );
    } else if (column.field === 'VAT Rate') {
      return `${formatValue(value)*100}%`; // Added this case for VAT Rate
    } else if (column.field === 'Comment') {
      return (
        <Box display="flex" alignItems="center">
          <Tooltip title={value || 'No comment'}>
            <span>{truncateText(value || '', 20)}</span>
          </Tooltip>
          <IconButton size="small" onClick={(e) => handleCommentEdit(e, data.indexOf(item))} disabled={item['Is Sent for Approval']}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    } else if (column.field === "Is Sold by Amazon") {
      return <span>{value}</span>;
    } else if (column.field === "Decision") {
      return (
        <span style={{ color: value && value.startsWith('No') ? 'red' : 'green' }}>
          {value}
        </span>
      );
    } else if (column.field === "Is Sent for Approval") {
      return value ? <CheckCircleOutlineIcon style={{ color: 'green' }} /> : <NotInterestedIcon style={{ color: 'red' }} />;
    } else {
      return formatValue(value);
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <EnhancedFilterSortControls
          columns={columns}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
        />
        <Box display="flex" gap={1}>
          {!isPastResults && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSelected}
              disabled={Object.values(selectedProducts).filter(Boolean).length === 0}
              sx={{ padding: '6px 12px' }}
            >
              {isSavedResults ? 'Approve Selected Items' : 'Send for Approval'}
            </Button>
          )}
          <Button
            variant="contained"
            color="secondary"
            onClick={handleRemoveSelected}
            startIcon={<DeleteIcon />}
            disabled={Object.values(selectedProducts).filter(Boolean).length === 0}
            sx={{ padding: '6px 12px' }}
          >
            Remove Selected
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ minHeight: '400px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">
                <Checkbox
                  indeterminate={Object.values(selectedProducts).some(Boolean) && Object.values(selectedProducts).some(value => !value)}
                  checked={Object.values(selectedProducts).every(Boolean)}
                  onChange={handleSelectAll}
                />
              </TableCell>
              {columns.map((column) => (
                <TableCell key={column.field}>{column.headerName}</TableCell>
              ))}
              {isSavedResults && <TableCell align="center">Assignee(s)</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedData.map((product, index) => (
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
                <TableCell align="center">
                  <Checkbox
                    checked={!!selectedProducts[product.ASIN]}
                    onChange={() => handleCheckboxChange(product)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                {columns.map(column => (
                  <TableCell key={column.field}>
                    {renderCell(product, column)}
                  </TableCell>
                ))}
                {isSavedResults && (
                  <TableCell align="center">
                    <FormControl fullWidth>
                      <Select
                        multiple={multipleAssignees}
                        value={assignees[product.ASIN] || (multipleAssignees ? [] : '')}
                        onChange={(e) => handleAssigneeChange(e, product.ASIN)}
                        onClick={(e) => e.stopPropagation()}
                        renderValue={(selected) => {
                          if (multipleAssignees) {
                            return selected.map(id => users.find(user => user.id === id)?.username).join(', ');
                          }
                          return users.find(user => user.id === selected)?.username;
                        }}
                      >
                        {users.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            {multipleAssignees && <Checkbox checked={assignees[product.ASIN]?.indexOf(user.id) > -1} />}
                            <ListItemText primary={user.username} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
      </>
    );
  };
  
  export default ResultTable;
