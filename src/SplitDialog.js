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

  const handleSplitChange = (setValue, otherValue) => (event) => {
    const value = event.target.value;
    if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) {
      const newValue = Number(value);
      const otherSplitValue = Number(otherValue);
      if (newValue + otherSplitValue > quantity) {
        setError(`Total split cannot exceed ${quantity}`);
      } else {
        setValue(newValue);
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
    if (totalSplit > quantity) {
      setError(`Total split (${totalSplit}) cannot exceed ${quantity}`);
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
      <DialogTitle>Change Split (Max: {quantity})</DialogTitle>
      <DialogContent>
        <TextField
          label="Initial Location Amazon"
          type="number"
          value={fbaSplit}
          onChange={handleSplitChange(setFbaSplit, fbmSplit)}
          fullWidth
          margin="normal"
          inputProps={{ min: 0, step: 1, max: quantity }}
        />
        <TextField
          label="Initial Location Warehouse"
          type="number"
          value={fbmSplit}
          onChange={handleSplitChange(setFbmSplit, fbaSplit)}
          fullWidth
          margin="normal"
          inputProps={{ min: 0, step: 1, max: quantity }}
        />
        <Typography variant="body2" style={{ marginTop: 8 }}>
          Remaining: {Math.max(0, quantity - Number(fbaSplit) - Number(fbmSplit))}
        </Typography>
        {error && (
          <Typography color="error" variant="body2" style={{ marginTop: 8 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} color="primary" disabled={!!error}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SplitDialog;