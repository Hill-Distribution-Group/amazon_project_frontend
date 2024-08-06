import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tabs, Tab, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Tooltip, Box
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import api from './api';
import { useSnackbar } from './SnackbarContext';
import FilterControls from './FilterControls';
import InvoiceDialog from './InvoiceDialog';
import PaymentDialog from './PaymentDialog';
import {
  PageContainer,
  ContentContainer,
  ResultsContainer,
  StyledHeader,
  HeaderTitle,
} from './themes/globalTheme';

const InvoicePaymentManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const { showSnackbar } = useSnackbar();

  const invoiceColumns = useMemo(() => [
    { field: 'invoice_number', headerName: 'Invoice Number' },
    { field: 'po_number', headerName: 'PO Number' },
    { field: 'invoice_date', headerName: 'Invoice Date' },
    { field: 'payment_due_date', headerName: 'Due Date' },
    { field: 'payment_amount', headerName: 'Total Amount' },
    { field: 'payment_status', headerName: 'Status' },
  ], []);

  const paymentColumns = useMemo(() => [
    { field: 'invoice_number', headerName: 'Invoice Number' },
    { field: 'payment_date', headerName: 'Payment Date' },
    { field: 'amount', headerName: 'Amount' },
    { field: 'payment_method', headerName: 'Method' },
  ], []);

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await api.get('/api/invoice_payment/get_invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showSnackbar('Error fetching invoices', 'error');
    }
  }, [showSnackbar]);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await api.get('/api/invoice_payment/get_payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showSnackbar('Error fetching payments', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchInvoices();
    fetchPayments();
  }, [fetchInvoices, fetchPayments]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEdit = (type, item) => {
    if (type === 'invoice' && item.payment_status === 'Paid') {
      showSnackbar('Paid invoices cannot be edited', 'warning');
      return;
    }
    setDialogType(`edit_${type}`);
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (type, id) => {
    if (type === 'invoice') {
      const invoice = invoices.find(inv => inv.id === id);
      if (invoice.payment_status === 'Paid') {
        showSnackbar('Paid invoices cannot be deleted', 'warning');
        return;
      }
    }
    try {
      await api.delete(`/api/invoice_payment/delete_${type}/${id}`);
      if (type === 'invoice') {
        setInvoices(invoices.filter(invoice => invoice.id !== id));
      } else {
        setPayments(payments.filter(payment => payment.id !== id));
      }
      showSnackbar(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`, 'success');
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      showSnackbar(`Error deleting ${type}`, 'error');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSave = async (formData) => {
    try {
      const isInvoice = dialogType.includes('invoice');
      const isAdd = dialogType.includes('add');
      const endpoint = `/api/invoice_payment/${isAdd ? 'create' : 'update'}_${isInvoice ? 'invoice' : 'payment'}${!isAdd ? `/${selectedItem.id}` : ''}`;
      const method = isAdd ? 'post' : 'put';
      
      const response = await api[method](endpoint, formData);
      
      if (isInvoice) {
        if (isAdd) {
          setInvoices([...invoices, response.data]);
        } else {
          setInvoices(invoices.map(invoice => invoice.id === selectedItem.id ? response.data : invoice));
        }
      } else {
        if (isAdd) {
          setPayments([...payments, response.data]);
        } else {
          setPayments(payments.map(payment => payment.id === selectedItem.id ? response.data : payment));
        }
      }
      
      showSnackbar(`${isInvoice ? 'Invoice' : 'Payment'} ${isAdd ? 'added' : 'updated'} successfully`, 'success');
      handleDialogClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      showSnackbar('Error submitting form', 'error');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useCallback((data) => {
    if (sortConfig.key) {
      return [...data].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return data;
  }, [sortConfig]);

  const filteredAndSortedInvoices = useMemo(() => {
    return sortedData(invoices.filter(invoice => 
      Object.entries(filters).every(([key, value]) => 
        String(invoice[key]).toLowerCase().includes(value.toLowerCase())
      )
    ));
  }, [invoices, filters, sortedData]);

  const filteredAndSortedPayments = useMemo(() => {
    return sortedData(payments.filter(payment => 
      Object.entries(filters).every(([key, value]) => 
        String(payment[key]).toLowerCase().includes(value.toLowerCase())
      )
    ));
  }, [payments, filters, sortedData]);

  const handleViewFile = (filePath) => {
    if (filePath) {
      window.open(`${process.env.REACT_APP_BACKEND_URL}/static/uploads/${filePath}`, '_blank');
    } else {
      showSnackbar('No file available', 'info');
    }
  };
  
  const renderTable = (data, columns) => (
<TableContainer component={Paper}>
      <Table>
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
                    sortConfig.direction === 'ascending' ? 
                    <ArrowUpwardIcon fontSize="small" /> : 
                    <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
            ))}
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map(item => (
            <TableRow key={item.id}>
              {columns.map(column => (
                <TableCell key={column.field}>{item[column.field]}</TableCell>
              ))}
              <TableCell>
                <Tooltip title="Edit">
                  <IconButton onClick={() => handleEdit(tabValue === 0 ? 'invoice' : 'payment', item)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton onClick={() => handleDelete(tabValue === 0 ? 'invoice' : 'payment', item.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
                {tabValue === 0 && (
                  <Tooltip title="View Invoice">
                    <IconButton onClick={() => handleViewFile(item.file_path)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {tabValue === 1 && (
                  <Tooltip title="View Receipt">
                    <IconButton onClick={() => handleViewFile(item.receipt_file_path)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <PageContainer>
      <StyledHeader>
        <HeaderTitle variant="h5" component="h1" color="textPrimary">
          Invoice and Payment Management
        </HeaderTitle>

      </StyledHeader>
      <ContentContainer>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Invoices" />
          <Tab label="Payments" />
        </Tabs>
        <ResultsContainer>
          <FilterControls
            columns={tabValue === 0 ? invoiceColumns : paymentColumns}
            onFilterChange={handleFilterChange}
          />
          {tabValue === 0 ? renderTable(filteredAndSortedInvoices, invoiceColumns) : renderTable(filteredAndSortedPayments, paymentColumns)}
        </ResultsContainer>
      </ContentContainer>

      {dialogType.includes('invoice') && (
        <InvoiceDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          invoice={selectedItem}
          onSave={handleSave}
        />
      )}

      {dialogType.includes('payment') && (
        <PaymentDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          payment={selectedItem}
          onSave={handleSave}
          invoiceId={selectedItem?.invoice_id}
        />
      )}
    </PageContainer>
  );
};

export default InvoicePaymentManagement;