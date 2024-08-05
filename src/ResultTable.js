import React, { useState, useMemo, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Modal, Box, Checkbox, Tooltip, IconButton, Button, TextField,
  FormControl, Select, MenuItem, ListItemText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import OrderedJsonViewer from './OrderedJsonViewer';
import ContextMenu from './ContextMenu';
import { useSnackbar } from './SnackbarContext';
import FilterControls from './FilterControls';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

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
  onSplitUpdate,  
  onQuantityUpdate,
  onCommentUpdate, 
  onFulfilmentTypeUpdate,
  users, 
  assignees, 
  onAssigneeChange,
  isPastResults = false,
  multipleAssignees = false,
  onRejectSelected,
  showRemoveButton = false,
  showSendForApprovalButton = true
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [selectedItem, setSelectedItem] = useState(null);




  const handleContextMenu = (event, index) => {
    event.preventDefault();
    const item = data[index];
    setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4 });
    setSelectedRowIndex(index);
    setSelectedItem(item);
    console.log('Selected item for context menu:', item);
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ mouseX: null, mouseY: null });
    setSelectedRowIndex(null);
  };

  const handleAssigneeChange = (event, ID) => {
    event.stopPropagation();
    const value = event.target.value;
    onAssigneeChange(ID, multipleAssignees ? value : value[value.length - 1]);
  };

  const handleSplitChange = async (newSplit) => {
    if (selectedRowIndex !== null) {
      const updatedItem = { 
        ...data[selectedRowIndex], 
        'Initial Location Amazon': newSplit['Initial Location Amazon'], 
        'Initial Location Warehouse': newSplit['Initial Location Warehouse'] 
      };
      console.log('Updating split in ResultTable:', updatedItem);
      await onSplitUpdate(updatedItem);
    }
  };

  const handleQuantityChange = async (updatedItem) => {
    if (onQuantityUpdate) {
      await onQuantityUpdate(updatedItem);
    }
    setData(prevData => prevData.map(item =>
      item.ID === updatedItem.ID ? updatedItem : item
    ));
  };

  const handleFulfilmentTypeChange = async (updatedItem) => {
    if (onFulfilmentTypeUpdate) {
      await onFulfilmentTypeUpdate(updatedItem);
    }
    setData(prevData => prevData.map(item =>
      item.ID === updatedItem.ID ? updatedItem : item
    ));
  };


  const handleRowClick = (product) => setSelectedProduct(product);
  const handleCloseModal = () => setSelectedProduct(null);
  const handleCheckboxChange = (product) => {
    setSelectedProducts((prevSelected) => ({
      ...prevSelected,
      [product.ID]: !prevSelected[product.ID]
    }));
  };

  const handleSelectAll = (event) => {
    const isChecked = event.target.checked;
    const newSelectedProducts = {};
    data.forEach((item) => {
      newSelectedProducts[item.ID] = isChecked;
    });
    setSelectedProducts(newSelectedProducts);
  };

  const handleSaveSelected = async () => {
    const selectedItems = data.filter((item) => selectedProducts[item.ID]);
    if (selectedItems.length === 0) {
      showSnackbar("No items selected.", "warning");
      return { success: false, message: "No items selected." };
    }

    const itemsWithoutTitle = selectedItems.filter(item => !item['Search Product Name']);
    if (itemsWithoutTitle.length > 0) {
      const itemIds = itemsWithoutTitle.map(item => item.ID).join(', ');
      showSnackbar(`Items with IDs ${itemIds} cannot be sent for approval without a search product title.`, "error");
      return { success: false, message: "Some items are missing search product title." };
    }

    try {
      const response = await onSaveSelected(selectedItems);
      setSelectedProducts({});
      return response;
    } catch (error) {
      console.error('Error saving selected items:', error);
      return { success: false, message: "Error saving selected items. Please try again." };
    }
  };

  const handleRemoveSelected = () => {
    const selectedItems = data.filter((item) => selectedProducts[item.ID]);
    onRemoveSelected(selectedItems);
    setSelectedProducts({});
  };

  const handleRejectSelected = () => {
    const selectedItems = data.filter((item) => selectedProducts[item.ID]);
    onRejectSelected(selectedItems);
    setSelectedProducts({});
  };

  const handleCommentEdit = (event, index) => {
    event.stopPropagation();
    const product = data[index];
    if (product['Approval Status'] !== 'pending') {
      setCommentProductIndex(index);
      setCurrentComment(product.Comment || '');
      setCommentModalOpen(true);
    }
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

  const columns = useMemo(() => {
    let baseColumns = [
      { field: "Search Product Name", headerName: "Search Product Name" },
      { field: "Search ASIN", headerName: "Search ASIN" },
      { field: "ASIN", headerName: "ASIN" },
      { field: "Amazon Product Name", headerName: "Product Name" },
      { field: "Matching Percentage", headerName: "Match %" },
      { field: "Counter Party", headerName: "Counter Party" },
      { field: "Cost of Goods", headerName: "CoG" },
      { field: "VAT Rate", headerName: "VAT %" },
      { field: "Sales Volume", headerName: "Sales Volume" },
      { field: "Expected Sales Volume", headerName: "Exp. Sales Volume" },
      { field: "Quantity", headerName: "Quantity" },
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
      { field: "Fulfilment Type", headerName: "Fulfilment Type" },
      { field: "Initial Location Amazon", headerName: "Initial Location Amazon" },
      { field: "Initial Location Warehouse", headerName: "Initial Location Warehouse" },
      { field: "Comment", headerName: "Comment" }
    ];

    if (isPastResults) {
      baseColumns = [
        { field: "Created At", headerName: "Created At" },
        { field: "User ID", headerName: "User ID" },
        ...baseColumns
      ];
    }

    if (isSavedResults) {
      baseColumns.push({ field: "Sent to Approval at", headerName: "Sent to Approval" });
    }

    return baseColumns;
  }, [isSavedResults, isPastResults]);
  
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let result = data;

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        if (field === 'quickFilter') {
          // Apply quick filter across all fields
          result = result.filter(item => 
            Object.values(item).some(val => 
              String(val).toLowerCase().includes(value.toLowerCase())
            )
          );
        } else {
          // Apply specific field filter
          result = result.filter(item => 
            String(item[field]).toLowerCase().includes(value.toLowerCase())
          );
        }
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, filters, sortConfig]);

  const renderCell = (item, column) => {
    if (!item || typeof item !== 'object') {
      console.error("Invalid item:", item);
      return "N/A";
    }

    const value = item[column.field];

    if (column.field === "Amazon Product Name" || column.field === "Search Product Name") {
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
      return `${formatValue(value) * 100}%`;
    } else if (column.field === 'Comment') {
      return (
        <Box display="flex" alignItems="center">
          <Tooltip title={value || 'No comment'}>
            <span>{truncateText(value || '', 20)}</span>
          </Tooltip>
          <IconButton 
            size="small" 
            onClick={(e) => handleCommentEdit(e, data.indexOf(item))}
            disabled={item['Approval Status'] === 'pending' || item['Approval Status'] === 'approved'}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    } else if (column.field === "Is Sold by Amazon") {
      return <span>{value}</span>;
      
    }
    else if (column.field === 'Fulfilment Type') {
      return (
        <span style={{ color: value === 'FBA' || value === 'FBM' ? 'green' : 'red' }}>
          {formatValue(value)}
        </span>
      );
  }
   else {
      return formatValue(value);
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <FilterControls
          columns={columns}
          onFilterChange={handleFilterChange}
        />
        <Box display="flex" gap={1}>
          {!isPastResults && showSendForApprovalButton && (
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
          {isSavedResults && (
            <Button
              variant="contained"
              color="secondary"
              onClick={handleRejectSelected}
              disabled={Object.values(selectedProducts).filter(Boolean).length === 0}
              sx={{ padding: '6px 12px' }}
            >
              Reject Selected Items
            </Button>
          )}
          {showRemoveButton && (
            <Button
              variant="contained"
              color="error"
              onClick={handleRemoveSelected}
              startIcon={<DeleteIcon />}
              disabled={Object.values(selectedProducts).filter(Boolean).length === 0}
              sx={{ padding: '6px 12px' }}
            >
              Remove Selected
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ minHeight: '400px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">
                <Checkbox
                  indeterminate={Object.values(selectedProducts).some(Boolean) && Object.values(selectedProducts).some(value => !value)}
                  checked={Object.values(selectedProducts).every(Boolean) && Object.keys(selectedProducts).length > 0}
                  onChange={handleSelectAll}
                />
              </TableCell>
              {columns.map((column) => (
                <TableCell 
                  key={column.field}
                  onClick={() => handleSort(column.field)}
                  style={{ cursor: 'pointer' }}
                >
                  <Box display="flex" alignItems="center">
                    {column.headerName}
                    {sortConfig.key === column.field && (
                      sortConfig.direction === 'ascending' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
              ))}
              {isSavedResults && <TableCell align="center">Assignee(s)</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedData.map((product, index) => (
              <TableRow
                hover
                key={product.ID}
                onClick={() => handleRowClick(product)}
                onContextMenu={(e) => handleContextMenu(e, index)}
              >
                <TableCell align="center">
                  <Checkbox
                    checked={!!selectedProducts[product.ID]}
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
                        value={assignees[product.ID] || (multipleAssignees ? [] : '')}
                        onChange={(e) => handleAssigneeChange(e, product.ID)}
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
                            {multipleAssignees && <Checkbox checked={assignees[product.ID]?.indexOf(user.id) > -1} />}
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
        onSplitChange={handleSplitChange}
        onQuantityChange={handleQuantityChange}
        onFulfilmentTypeChange={handleFulfilmentTypeChange} // Pass the handler
        currentItem={selectedItem}
      />

    </>
  );
};

export default ResultTable;