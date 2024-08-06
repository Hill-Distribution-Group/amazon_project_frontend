import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography
} from '@mui/material';

const SplitDialog = ({ open, onClose, onSave, currentItem }) => {
  const [fbaSplit, setFbaSplit] = useState(currentItem?.['Initial Location Amazon'] ?? 0);
  const [fbmSplit, setFbmSplit] = useState(currentItem?.['Initial Location Warehouse'] ?? 0);
  const [error, setError] = useState('');
  const quantity = currentItem?.['Quantity'] ?? 0;

  useEffect(() => {
    setFbaSplit(currentItem?.['Initial Location Amazon'] ?? 0);
    setFbmSplit(currentItem?.['Initial Location Warehouse'] ?? 0);
    setError('');
  }, [currentItem]);

  const handleSplitChange = (setValue, otherSetter) => (event) => {
    const value = event.target.value;
    if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) {
      const newValue = Number(value);
      if (newValue > quantity) {
        setError(`Value cannot exceed ${quantity}`);
      } else {
        setValue(newValue);
        otherSetter(quantity - newValue);
        setError('');
      }
    } else {
      setError('Please enter non-negative integer values.');
    }
  };

  const handleSave = () => {
    if (fbaSplit === '' || fbmSplit === '') {
      setError('Please enter values for both splits.');
      return;
    }

    const totalSplit = Number(fbaSplit) + Number(fbmSplit);
    if (totalSplit !== quantity) {
      setError(`Total split (${totalSplit}) must equal ${quantity}`);
      return;
    }

    const updatedItem = {
      ...currentItem,
      'Initial Location Amazon': parseInt(fbaSplit),
      'Initial Location Warehouse': parseInt(fbmSplit)
    };
    onSave(updatedItem);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Change Split (Total: {quantity})</DialogTitle>
      <DialogContent>
        <TextField
          label="Initial Location Amazon"
          type="number"
          value={fbaSplit}
          onChange={handleSplitChange(setFbaSplit, setFbmSplit)}
          fullWidth
          margin="normal"
          inputProps={{ min: 0, step: 1, max: quantity }}
        />
        <TextField
          label="Initial Location Warehouse"
          type="number"
          value={fbmSplit}
          onChange={handleSplitChange(setFbmSplit, setFbaSplit)}
          fullWidth
          margin="normal"
          inputProps={{ min: 0, step: 1, max: quantity }}
        />
        <Typography variant="body2" style={{ marginTop: 8 }}>
          Total: {Number(fbaSplit) + Number(fbmSplit)} / {quantity}
        </Typography>
        {error && (
          <Typography color="error" variant="body2" style={{ marginTop: 8 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} color="primary" disabled={!!error || (Number(fbaSplit) + Number(fbmSplit) !== quantity)}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SplitDialog;