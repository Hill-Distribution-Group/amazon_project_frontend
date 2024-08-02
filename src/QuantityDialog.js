import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

const QuantityDialog = ({ open, onClose, onSave, currentItem }) => {
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (currentItem) {
      setQuantity(currentItem.Quantity || '');
    }
  }, [currentItem]);

  const handleSave = () => {
    const newQuantity = parseInt(quantity, 10);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      alert('Please enter a valid positive integer for quantity.');
      return;
    }

    const oldQuantity = parseInt(currentItem.Quantity, 10) || 1;
    const ratio = newQuantity / oldQuantity;

    const updatedItem = {
      ...currentItem,
      Quantity: newQuantity,
      'FBA Split': Math.round(currentItem['FBA Split'] * ratio),
      'FBM Split': Math.round(currentItem['FBM Split'] * ratio),
    };

    onSave(updatedItem);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Change Quantity</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Quantity"
          type="number"
          fullWidth
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          inputProps={{ min: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuantityDialog;