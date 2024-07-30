import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Typography, Link, MenuItem, Select, FormControl, InputLabel, Grid, Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from './SnackbarContext';
import PaymentDialog from './PaymentDialog';
import api from './api';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

const InvoiceDialog = ({ open, onClose, invoice, onSave, po }) => {
  const { showSnackbar } = useSnackbar();
  const [invoiceData, setInvoiceData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [removeFile, setRemoveFile] = useState(false);

  useEffect(() => {
    if (open) {
      if (invoice) {
        setInvoiceData({
          ...invoice,
          payment_due_date: invoice.payment_due_date ? new Date(invoice.payment_due_date) : null,
          invoice_date: invoice.invoice_date ? new Date(invoice.invoice_date) : null,
        });
        setSelectedFile(null);
        setRemoveFile(false);
      } else if (po) { 
        setInvoiceData({
          purchase_order_id: po.id,
          invoice_number: `INV-${po.po_number.split('-')[1]}`, 
          invoice_date: new Date(),
          payment_due_date: null, 
          payment_amount: po.total_amount,
          payment_status: 'Pending',
        });
        setSelectedFile(null);
        setRemoveFile(false);
      }
      setFileError('');
    }
  }, [open, invoice, po]);

  const handleChange = useCallback((field, value) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif'];

    if (file && allowedTypes.includes(file.type)) {
      setSelectedFile(file);
      setFileError('');
      setRemoveFile(false);
    } else {
      setSelectedFile(null);
      setFileError('Please select a PDF or image file (PNG, JPEG, GIF).');
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setRemoveFile(true);
    showSnackbar('Invoice file marked for removal. Remember to save your changes.', 'info');
  }, [showSnackbar]);

  const handleSave = useCallback(async () => {
    try {
      const formData = new FormData();
      Object.entries(invoiceData).forEach(([key, value]) => {
        if (value instanceof Date) {
          formData.append(key, value.toISOString().split('T')[0]);
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (removeFile) {
        formData.append('remove_file', 'true');
      }

      let response;
      if (invoiceData.id) { 
        response = await api.put(`/api/purchase_orders/invoices/${invoiceData.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post('/api/purchase_orders/invoices', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      showSnackbar(invoiceData.id ? 'Invoice updated successfully' : 'Invoice created successfully', 'success');
      onSave(response.data);
      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
      showSnackbar('Failed to save invoice. Please try again.', 'error');
    }
  }, [invoiceData, selectedFile, removeFile, onClose, showSnackbar, onSave]);

  const handleViewFile = useCallback(() => {
    if (selectedFile) {
      const fileUrl = URL.createObjectURL(selectedFile);
      window.open(fileUrl, '_blank');
    } else if (invoiceData.file_path) {
      const fileUrl = `${process.env.REACT_APP_BACKEND_URL}/static/uploads/${invoiceData.file_path}?t=${Date.now()}`;
      window.open(fileUrl, '_blank');
    }
  }, [selectedFile, invoiceData.file_path]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{invoiceData.id ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Invoice Number"
          value={invoiceData.invoice_number || ''}
          fullWidth
          margin="normal"
          disabled
        />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <DatePicker
                label="Invoice Date"
                value={invoiceData.invoice_date}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Payment Due Date"
                value={invoiceData.payment_due_date}
                onChange={(newValue) => handleChange('payment_due_date', newValue)}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
        <TextField
          label="Payment Amount"
          value={invoiceData.payment_amount || ''}
          onChange={(e) => handleChange('payment_amount', e.target.value)}
          fullWidth
          margin="normal"
          type="number"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Payment Status</InputLabel>
          <Select
            value={invoiceData.payment_status || ''}
            onChange={(e) => handleChange('payment_status', e.target.value)}
            label="Payment Status"
          >
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Partially Paid">Partially Paid</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
          </Select>
        </FormControl>

        {/* Invoice File Area */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          {(selectedFile || (invoiceData.file_path && !removeFile)) ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1">Invoice:</Typography>
              <Link
                component="button"
                variant="body2"
                onClick={handleViewFile}
                sx={{ ml: 1 }}
              >
                {selectedFile ? selectedFile.name : invoiceData.file_path.split('/').pop()}
              </Link>
              <Button
                variant="outlined"
                color="error"
                onClick={handleRemoveFile}
                sx={{ ml: 2 }}
                startIcon={<DeleteIcon />}
              >
                Remove Invoice
              </Button>
            </Box>
          ) : (
            <>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.gif"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="invoice-file-upload"
              />
              <label htmlFor="invoice-file-upload">
                <Button variant="contained" component="span" startIcon={<CloudUploadIcon />}>
                  Upload Invoice
                </Button>
              </label>
            </>
          )}
        </Box>
        {fileError && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {fileError}
          </Typography>
        )}

        <Button 
          variant="outlined" 
          onClick={() => setPaymentDialogOpen(true)} 
          fullWidth 
          sx={{ mt: 2 }}
          disabled={!invoiceData.id}
        >
          View/Manage Payments
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!!fileError}>Save</Button>
      </DialogActions>

      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        invoiceId={invoiceData.id} 
        onSave={onSave}
      />
    </Dialog>
  );
};

export default React.memo(InvoiceDialog);