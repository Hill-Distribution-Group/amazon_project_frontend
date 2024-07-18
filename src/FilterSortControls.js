import React, { useState } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';

const FilterSortControls = ({ columns, onFilterChange, onSortChange }) => {
  const [filterText, setFilterText] = useState('');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleFilterChange = (event) => {
    const newFilterText = event.target.value;
    setFilterText(newFilterText);
    onFilterChange(newFilterText);
  };

  const handleSortChange = (event) => {
    const newSortColumn = event.target.value;
    setSortColumn(newSortColumn);
    onSortChange(newSortColumn, sortDirection);
  };

  const handleSortDirectionToggle = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    onSortChange(sortColumn, newDirection);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
      <TextField
        size="small"
        variant="outlined"
        placeholder="Filter..."
        value={filterText}
        onChange={handleFilterChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ flexGrow: 1 }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FilterListIcon />
        <Typography variant="body2">Sort by:</Typography>
        <Select
          size="small"
          value={sortColumn}
          onChange={handleSortChange}
          displayEmpty
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {columns.map((column) => (
            <MenuItem key={column.field} value={column.field}>
              {column.headerName}
            </MenuItem>
          ))}
        </Select>
        <IconButton onClick={handleSortDirectionToggle} size="small">
          <SortIcon
            sx={{
              transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
            }}
          />
        </IconButton>
      </Box>
    </Box>
  );
};

export default FilterSortControls;