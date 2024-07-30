import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Button, Box, Typography, Link, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, MenuItem, Select, FormControl, InputLabel, Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useSnackbar } from './SnackbarContext';
import { format } from 'date-fns';
import api from './api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const PaymentDialog = ({ open, onClose, invoiceId, onSave }) => {
  const { showSnackbar } = useSnackbar();
  const [payments, setPayments] = useState([]);
  const [paymentData, setPaymentData] = useState({
    payment_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);

  const paymentMethods = ['Card', 'Bank Transfer', 'Check', 'Cash'];

  useEffect(() => {
    const fetchPayments = async () => {
      if (invoiceId) {
        try {
          const response = await api.get(`/api/purchase_orders/payments/${invoiceId}`);
          setPayments(response.data);
        } catch (error) {
          console.error('Error fetching payments:', error);
          showSnackbar('Error fetching payments', 'error');
        }
      }
    };
    if (open) {
      fetchPayments();
    }
  }, [invoiceId, open, showSnackbar]);

  const handleChange = useCallback((field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif'];

    if (file && allowedTypes.includes(file.type)) {
      setSelectedFile(file);
      setFileError('');
    } else {
      setSelectedFile(null);
      setFileError('Please select a PDF or image file (PNG, JPEG, GIF).');
    }
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    if (!paymentData.amount || !paymentData.payment_method || !paymentData.payment_date) {
      showSnackbar('Please fill in all required fields', 'error');
      setIsSaving(false);
      return;
    }

    const formData = new FormData();
    Object.entries(paymentData).forEach(([key, value]) => {
      if (key === 'payment_date' && value) {
        formData.append(key, format(new Date(value), 'yyyy-MM-dd'));
      } else {
        formData.append(key, value);
      }
    });

    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    formData.append('invoice_id', invoiceId);

    try {
      let response;
      if (editingPaymentId) {
        response = await api.put(`/api/purchase_orders/payments/${editingPaymentId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post('/api/purchase_orders/payments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      showSnackbar('Payment saved successfully', 'success');
      onSave(response.data);
      
      // Refresh payments list
      const updatedPayments = await api.get(`/api/purchase_orders/payments/${invoiceId}`);
      setPayments(updatedPayments.data);

      // Reset form
      setPaymentData({
        payment_date: format(new Date(), 'yyyy-MM-dd')
      });
      setSelectedFile(null);
      setEditingPaymentId(null);
    } catch (error) {
      console.error('Error saving payment:', error);
      showSnackbar('Error saving payment', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [paymentData, selectedFile, invoiceId, onSave, showSnackbar, editingPaymentId]);

  const handleEditPayment = useCallback((payment) => {
    setEditingPaymentId(payment.id);
    setPaymentData({
      ...payment,
      payment_date: format(new Date(payment.payment_date), 'yyyy-MM-dd')
    });
    setSelectedFile(null);
  }, []);

  const handleDeletePayment = useCallback(async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await api.delete(`/api/purchase_orders/payments/${paymentId}`);
        setPayments(prevPayments => prevPayments.filter(payment => payment.id !== paymentId));
        showSnackbar('Payment deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting payment:', error);
        showSnackbar('Error deleting payment', 'error');
      }
    }
  }, [showSnackbar]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Manage Payments</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Amount"
            type="number"
            value={paymentData.amount || ''}
            onChange={(e) => handleChange('amount', e.target.value)}
            required
          />
          <FormControl fullWidth>
            <InputLabel id="payment-method-label">Payment Method</InputLabel>
            <Select
              labelId="payment-method-label"
              id="payment-method-select"
              value={paymentData.payment_method || ''}
              label="Payment Method"
              onChange={(e) => handleChange('payment_method', e.target.value)}
              required
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method} value={method}>{method}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Payment Date"
              value={paymentData.payment_date ? new Date(paymentData.payment_date) : null}
              onChange={(newValue) => handleChange('payment_date', newValue)}
              renderInput={(params) => <TextField {...params} required />}
            />
          </LocalizationProvider>
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.gif"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="payment-file-upload"
            />
            <label htmlFor="payment-file-upload">
              <Button variant="contained" component="span" startIcon={<CloudUploadIcon />}>
                Upload Receipt
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ ml: 2 }}>
                {selectedFile.name}
              </Typography>
              )}
              </Box>
              {fileError && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {fileError}
                </Typography>
              )}
            </Box>
    
            <DialogActions>
              <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
              <Button
                onClick={handleSave}
                color="primary"
                disabled={isSaving || !!fileError || !paymentData.amount || !paymentData.payment_method || !paymentData.payment_date}
              >
                {isSaving ? 'Saving...' : (editingPaymentId ? 'Update Payment' : 'Add Payment')}
              </Button>
            </DialogActions>
    
            {/* Payment List Table */}
            <Typography variant="h6" sx={{ mt: 4 }}>Payment History</Typography>
            {payments.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Payment Method</TableCell>
                      <TableCell>Receipt</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.payment_date), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>£{payment.amount.toFixed(2)}</TableCell>
                        <TableCell>{payment.payment_method}</TableCell>
                        <TableCell>
                          {payment.receipt_file_path && (
                            <Link href={`${process.env.REACT_APP_BACKEND_URL}/static/uploads/${payment.receipt_file_path}`} target="_blank">
                              View Receipt
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEditPayment(payment)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeletePayment(payment.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" sx={{ mt: 2 }}>No payments found for this invoice.</Typography>
            )}
          </DialogContent>
        </Dialog>
      );
    };
    
    export default React.memo(PaymentDialog);