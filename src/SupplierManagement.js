import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import api from './api';
import { useSnackbar } from './SnackbarContext';
import {
  PageContainer,
  ContentContainer,
  ResultsContainer,
  StyledHeader,
  HeaderTitle,
  HeaderActions,
  StyledButton
} from './themes/globalTheme';
import FilterControls from './FilterControls';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [supplierId, setSupplierId] = useState(null);
  const [supplierName, setSupplierName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [purchaseEmail, setPurchaseEmail] = useState('');
  const [administrationEmail, setAdministrationEmail] = useState('');
  const [contactNumberExt, setContactNumberExt] = useState('');
  const [type, setType] = useState('');
  const [product, setProduct] = useState('');
  const [minimumOrderSize, setMinimumOrderSize] = useState('');
  const [website, setWebsite] = useState('');
  const [userLogin, setUserLogin] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [comment, setComment] = useState('');
  const { showSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const productOptions = [
    'Food and Drink',
    'Supplements',
    'Candy',
    'Car parts',
    'Pet supplies',
    'Other'
  ];

  const typeOptions = ['Wholesaler', 'Brand', 'Other'];

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await api.get('/api/to_procure/get_suppliers');
      const sortedSuppliers = response.data.sort((a, b) => a.name.localeCompare(b.name));
      setSuppliers(sortedSuppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      showSnackbar('Error fetching suppliers. Please try again.', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenDialog = (mode = 'add', supplier = null) => {
    setDialogMode(mode);
    if (mode === 'edit' && supplier) {
      setSupplierId(supplier.id);
      setSupplierName(supplier.name);
      setContactNumber(supplier.contact_number || '');
      setPurchaseEmail(supplier.purchase_email || '');
      setAdministrationEmail(supplier.administration_email || '');
      setContactNumberExt(supplier.contact_number_ext || '');
      setType(supplier.type || '');
      setProduct(supplier.products ? supplier.products.split(',')[0] : '');
      setMinimumOrderSize(supplier.minimum_order_size || '');
      setWebsite(supplier.website || '');
      setUserLogin(supplier.user_login || '');
      setUserPassword(''); // Don't set the password for security reasons
      setComment(supplier.comment || '');
    } else {
      setSupplierId(null);
      setSupplierName('');
      setContactNumber('');
      setPurchaseEmail('');
      setAdministrationEmail('');
      setContactNumberExt('');
      setType('');
      setProduct('');
      setMinimumOrderSize('');
      setWebsite('');
      setUserLogin('');
      setUserPassword('');
      setComment('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    if (!supplierName.trim() || !contactNumber.trim() || !purchaseEmail.trim() || !administrationEmail.trim() || !type.trim() || !minimumOrderSize.trim() || !website.trim()) {
      showSnackbar('Please fill in all required fields!', 'error');
      return;
    }

    const supplierData = {
      name: supplierName,
      contact_number: contactNumber,
      purchase_email: purchaseEmail,
      administration_email: administrationEmail,
      contact_number_ext: contactNumberExt,
      type,
      products: product,
      minimum_order_size: minimumOrderSize,
      website,
      user_login: userLogin,
      user_password: userPassword,
      comment
    };

    try {
      if (dialogMode === 'add') {
        const response = await api.post('/api/suppliers', supplierData);
        setSuppliers([...suppliers, response.data]);
        showSnackbar('Supplier added successfully!', 'success');
      } else {
        await api.put(`/api/suppliers/${supplierId}`, supplierData);
        const updatedSuppliers = suppliers.map(s =>
          s.id === supplierId ? { ...s, ...supplierData } : s
        );
        setSuppliers(updatedSuppliers);
        showSnackbar('Supplier updated successfully!', 'success');
      }
      handleCloseDialog();
    } catch (error) {
      console.error(`Error ${dialogMode === 'add' ? 'adding' : 'updating'} supplier:`, error);
      showSnackbar(`Error ${dialogMode === 'add' ? 'adding' : 'updating'} supplier. Please try again.`, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/suppliers/${id}`);
      setSuppliers(suppliers.filter(s => s.id !== id));
      showSnackbar('Supplier deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      showSnackbar('Error deleting supplier. Please try again.', 'error');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const columns = useMemo(() => [
    { field: 'name', headerName: 'Name' },
    { field: 'contact_number', headerName: 'Contact Number' },
    { field: 'purchase_email', headerName: 'Purchase Email' },
    { field: 'administration_email', headerName: 'Administration Email' },
    { field: 'type', headerName: 'Type' },
    { field: 'products', headerName: 'Products' },
    { field: 'minimum_order_size', headerName: 'Minimum Order Size' },
    { field: 'website', headerName: 'Website' },
    { field: 'comment', headerName: 'Comment' },
  ], []);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedSuppliers = useMemo(() => {
    let result = suppliers;

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        result = result.filter(supplier => 
          String(supplier[field]).toLowerCase().includes(value.toLowerCase())
        );
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
  }, [suppliers, filters, sortConfig]);

  return (
    <PageContainer>
      <ContentContainer>
        <StyledHeader>
          <HeaderTitle variant="h5" component="h1" color="textPrimary">
            Supplier Management
          </HeaderTitle>
          <HeaderActions>
            <StyledButton
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => handleOpenDialog('add')}
            >
              Add Supplier
            </StyledButton>
          </HeaderActions>
        </StyledHeader>
        <ResultsContainer>
          <FilterControls
            columns={columns}
            onFilterChange={handleFilterChange}
          />
          <TableContainer component={Paper}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {columns.map(column => (
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
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedSuppliers.map(supplier => (
                  <TableRow key={supplier.id}>
                    {columns.map(column => (
                      <TableCell key={column.field}>
                        {column.field === 'comment' ? (
                          <Tooltip title={supplier[column.field] || ''}>
                            <span>{(supplier[column.field] || '').substring(0, 20)}{supplier[column.field]?.length > 20 ? '...' : ''}</span>
                          </Tooltip>
                        ) : (
                          supplier[column.field]
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog('edit', supplier)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(supplier.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ResultsContainer>
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{dialogMode === 'add' ? 'Add Supplier' : 'Edit Supplier'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Name"
                  type="text"
                  fullWidth
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Contact Number"
                  type="text"
                  fullWidth
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Contact Number Ext"
                  type="text"
                  fullWidth
                  value={contactNumberExt}
                  onChange={(e) => setContactNumberExt(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Purchase Email"
                  type="email"
                  fullWidth
                  value={purchaseEmail}
                  onChange={(e) => setPurchaseEmail(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Administration Email"
                  type="email"
                  fullWidth
                  value={administrationEmail}
                  onChange={(e) => setAdministrationEmail(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
              <FormControl fullWidth margin="dense" required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    label="Type"
                  >
                    {typeOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
              <Autocomplete
                  options={productOptions}
                  value={product}
                  onChange={(event, newValue) => {
                    setProduct(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Product" 
                      margin="dense" 
                      fullWidth 
                      required
                      error={!product}
                      helperText={!product ? "Product is required" : ""}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Minimum Order Size"
                  type="text"
                  fullWidth
                  value={minimumOrderSize}
                  onChange={(e) => setMinimumOrderSize(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Website"
                  type="url"
                  fullWidth
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="User Login"
                  type="text"
                  fullWidth
                  value={userLogin}
                  onChange={(e) => setUserLogin(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="User Password"
                  type="text"
                  fullWidth
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Comment"
                  type="text"
                  fullWidth
                  multiline
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <StyledButton onClick={handleCloseDialog}>Cancel</StyledButton>
            <StyledButton onClick={handleSubmit} color="primary">
              {dialogMode === 'add' ? 'Add' : 'Save'}
            </StyledButton>
          </DialogActions>
        </Dialog>
      </ContentContainer>
    </PageContainer>
  );
};

export default SupplierManagement;
