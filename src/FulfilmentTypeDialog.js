import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, Select, MenuItem } from '@mui/material';

const FulfilmentTypeDialog = ({ open, onClose, onSave, currentItem }) => {
  const [fulfilmentType, setFulfilmentType] = useState('');

  useEffect(() => {
    if (currentItem) {
      setFulfilmentType(currentItem['Fulfilment Type'] || ''); // Set initial value from currentItem
    }
  }, [currentItem]);

  const handleSave = () => {
    onSave({ ...currentItem, 'Fulfilment Type': fulfilmentType });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Change Fulfilment Type</DialogTitle>
      <DialogContent>
        <FormControl fullWidth>
          <Select
            value={fulfilmentType}
            onChange={(e) => setFulfilmentType(e.target.value)}
            displayEmpty
          >
            <MenuItem value="FBA">FBA</MenuItem>
            <MenuItem value="FBM">FBM</MenuItem>
            <MenuItem value="No Buy">No Buy</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FulfilmentTypeDialog;
