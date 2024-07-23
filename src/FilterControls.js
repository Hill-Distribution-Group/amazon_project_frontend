import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  Popover,
  Button,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

const FilterControls = ({ columns, onFilterChange }) => {
  const [filters, setFilters] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);

  const initialVisibleFilters = [];

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleExpandFilters = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseExpandedFilters = () => {
    setAnchorEl(null);
  };

  const handleClearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const renderFilterField = (column) => (
    <TextField
      key={column.field}
      label={column.headerName}
      variant="outlined"
      size="small"
      value={filters[column.field] || ''}
      onChange={(e) => handleFilterChange(column.field, e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
    />
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ mr: 2 }}>Filters</Typography>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleExpandFilters}
          sx={{ mr: 2 }}
        >
          Filters
        </Button>
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={handleClearFilters}
        >
          Clear Filters
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {columns
          .filter(column => initialVisibleFilters.includes(column.field))
          .map(column => renderFilterField(column))
        }
      </Box>
      {Object.entries(filters).map(([field, value]) => {
        if (value && !initialVisibleFilters.includes(field)) {
          return (
            <Chip
              key={field}
              label={`${columns.find(col => col.field === field)?.headerName}: ${value}`}
              onDelete={() => handleFilterChange(field, '')}
              sx={{ mt: 1, mr: 1 }}
            />
          );
        }
        return null;
      })}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseExpandedFilters}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, maxWidth: '80vw' }}>
          {columns
            .filter(column => !initialVisibleFilters.includes(column.field))
            .map(column => renderFilterField(column))
          }
        </Box>
      </Popover>
    </Box>
  );
};

export default FilterControls;