// File path: /src/components/ResultTable.jsx

import React, { useState } from 'react';
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
  InputLabel
} from '@mui/material';

const truncateText = (text, maxLength) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

const parseMargin = (marginStr) => {
  if (typeof marginStr === 'string' && marginStr.includes('%')) {
    return parseFloat(marginStr.replace('%', ''));
  }
  return parseFloat(marginStr);
};

const ResultTable = ({ data }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

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

  const getDecision = (product) => {
    const marginFBA = parseMargin(product["Margin FBA"]);
    const marginFBM = parseMargin(product["Margin FBM"]);
    const expectedProfitFBA = parseFloat(product["Expected Total Net Profit FBA"]);
    const expectedProfitFBM = parseFloat(product["Expected Total Net Profit FBM"]);
    const profitDifferenceThreshold = 0.1; // Example threshold of 10%

    if (!isNaN(marginFBA) && marginFBA > 9 && expectedProfitFBA > 0) {
      if (!isNaN(marginFBM) && marginFBM > 9 && expectedProfitFBM > 0) {
        const profitDifference = (expectedProfitFBM - expectedProfitFBA) / expectedProfitFBA;
        if (profitDifference > profitDifferenceThreshold) {
          return "Buy (FBM)";
        }
      }
      return "Buy (FBA)";
    }
    if (!isNaN(marginFBM) && marginFBM > 9 && expectedProfitFBM > 0) {
      return "Buy (FBM)";
    }
    return "No Buy";
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

  const filteredData = data.filter(product => 
    product["Costco Product Name"].toLowerCase().includes(filterText.toLowerCase()) || 
    product["Amazon Product Name"].toLowerCase().includes(filterText.toLowerCase())
  );

  const sortedData = filteredData.sort((a, b) => {
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
            <MenuItem value="Costco Product Name">Costco Product Name</MenuItem>
            <MenuItem value="Amazon Product Name">Amazon Product Name</MenuItem>
            <MenuItem value="Matching Percentage">Matching Percentage</MenuItem>
            <MenuItem value="Sales Volume">Sales Volume</MenuItem>
            <MenuItem value="Cheapest Price">Cheapest Price</MenuItem>
            <MenuItem value="Margin FBA">Margin FBA</MenuItem>
            <MenuItem value="Margin FBM">Margin FBM</MenuItem>
            <MenuItem value="Expected Total Net Profit FBA">Expected Total Net Profit FBA</MenuItem>
            <MenuItem value="Expected Total Net Profit FBM">Expected Total Net Profit FBM</MenuItem>
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
              <TableCell>Costco Product Name</TableCell>
              <TableCell>Amazon Product Name</TableCell>
              <TableCell>ASIN</TableCell>
              <TableCell>Matching Percentage</TableCell>
              <TableCell>Sales Volume</TableCell>
              <TableCell>Cheapest Price</TableCell>
              <TableCell>Margin FBA</TableCell>
              <TableCell>Margin FBM</TableCell>
              <TableCell>Expected Total Profits FBA</TableCell>
              <TableCell>Expected Total Profits FBM</TableCell>
              <TableCell>Decision</TableCell>
              <TableCell align="center">Select</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((product, index) => (
              <TableRow 
                hover 
                key={index}
                onClick={() => handleRowClick(product)}
                style={{ cursor: 'pointer' }}
              >
                <Tooltip title={product["Costco Product Name"]}>
                  <TableCell>{truncateText(product["Costco Product Name"], 20)}</TableCell>
                </Tooltip>
                <Tooltip title={product["Amazon Product Name"]}>
                  <TableCell>{truncateText(product["Amazon Product Name"], 20)}</TableCell>
                </Tooltip>
                <TableCell>{product["ASIN"]}</TableCell>
                <TableCell sx={{ color: product["Matching Percentage"] > 74 ? 'green' : 'red' }}>
                  {product["Matching Percentage"]}%
                </TableCell>
                <TableCell>{product["Sales Volume"]}</TableCell>
                <TableCell>£{product["Cheapest Price"]}</TableCell>
                <TableCell>{product["Margin FBA"]}</TableCell>
                <TableCell>{product["Margin FBM"]}</TableCell>
                <TableCell>£{product["Expected Total Net Profit FBA"]}</TableCell>
                <TableCell>£{product["Expected Total Net Profit FBM"]}</TableCell>
                <TableCell sx={{ color: getDecision(product) === 'No Buy' ? 'red' : 'green' }}>
                  {getDecision(product)}
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={!!selectedProducts[product["ASIN"]]}
                    onChange={() => handleCheckboxChange(product)}
                    onClick={(e) => e.stopPropagation()} // Prevent modal open on checkbox click
                  />
                </TableCell>
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
            <pre>{JSON.stringify(selectedProduct, null, 2)}</pre>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ResultTable;
