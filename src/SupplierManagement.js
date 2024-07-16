import React, { useState, useEffect,useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Box,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import api from './api';
import { useSnackbar } from './SnackbarContext';

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
  const [products, setProducts] = useState('');
  const [minimumOrderSize, setMinimumOrderSize] = useState('');
  const [website, setWebsite] = useState('');
  const [userLogin, setUserLogin] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const { showSnackbar } = useSnackbar();

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
      setProducts(supplier.products || '');
      setMinimumOrderSize(supplier.minimum_order_size || '');
      setWebsite(supplier.website || '');
      setUserLogin(supplier.user_login || '');
      setUserPassword(''); // Don't set the password for security reasons
    } else {
      setSupplierId(null);
      setSupplierName('');
      setContactNumber('');
      setPurchaseEmail('');
      setAdministrationEmail('');
      setContactNumberExt('');
      setType('');
      setProducts('');
      setMinimumOrderSize('');
      setWebsite('');
      setUserLogin('');
      setUserPassword('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    const supplierData = {
      name: supplierName,
      contact_number: contactNumber,
      purchase_email: purchaseEmail,
      administration_email: administrationEmail,
      contact_number_ext: contactNumberExt,
      type,
      products,
      minimum_order_size: minimumOrderSize,
      website,
      user_login: userLogin,
      user_password: userPassword,
    };

    try {
      if (dialogMode === 'add' && !supplierName.trim()) {
        showSnackbar('Supplier name is required!', 'error');
        return;
      }
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

  return (
    <Container maxWidth={false} sx={{ mt: 2, mb: 2, px: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom>
        Supplier Management
      </Typography>

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => handleOpenDialog('add')}
        >
          Add Supplier
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 200px)' }}>
      <Table stickyHeader size="small">
      <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact Number</TableCell>
              <TableCell>Purchase Email</TableCell>
              <TableCell>Administration Email</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Products</TableCell>
              <TableCell>Minimum Order Size</TableCell>
              <TableCell>Website</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.map(supplier => (
              <TableRow key={supplier.id}>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>{supplier.contact_number}</TableCell>
                <TableCell>{supplier.purchase_email}</TableCell>
                <TableCell>{supplier.administration_email}</TableCell>
                <TableCell>{supplier.type}</TableCell>
                <TableCell>{supplier.products}</TableCell>
                <TableCell>{supplier.minimum_order_size}</TableCell>
                <TableCell>{supplier.website}</TableCell>
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
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Type"
                type="text"
                fullWidth
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Products"
                type="text"
                fullWidth
                value={products}
                onChange={(e) => setProducts(e.target.value)}
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
                type="password"
                fullWidth
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {dialogMode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupplierManagement;