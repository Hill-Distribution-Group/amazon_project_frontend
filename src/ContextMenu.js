import React, { useState } from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import SplitIcon from '@mui/icons-material/CallSplit';
import EditIcon from '@mui/icons-material/Edit';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import SplitDialog from './SplitDialog';
import QuantityDialog from './QuantityDialog';
import FulfilmentTypeDialog from './FulfilmentTypeDialog';

const ContextMenu = ({ anchorPosition, isOpen, onClose, onSplitChange, onQuantityChange, onFulfilmentTypeChange, currentItem }) => {
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [fulfilmentTypeDialogOpen, setFulfilmentTypeDialogOpen] = useState(false);

  const handleSplitClick = () => {
    setSplitDialogOpen(true);
  };

  const handleQuantityClick = () => {
    setQuantityDialogOpen(true);
  };

  const handleFulfilmentTypeClick = () => {
    setFulfilmentTypeDialogOpen(true);
  };

  const handleSplitDialogClose = () => {
    setSplitDialogOpen(false);
  };

  const handleQuantityDialogClose = () => {
    setQuantityDialogOpen(false);
  };

  const handleFulfilmentTypeDialogClose = () => {
    setFulfilmentTypeDialogOpen(false);
  };

  const handleSplitSave = (updatedItem) => {
    onSplitChange(updatedItem);
    setSplitDialogOpen(false);
    onClose();
  };

  const handleQuantitySave = (updatedItem) => {
    onQuantityChange(updatedItem);
    setQuantityDialogOpen(false);
    onClose();
  };

  const handleFulfilmentTypeSave = (updatedItem) => {
    onFulfilmentTypeChange(updatedItem);
    setFulfilmentTypeDialogOpen(false);
    onClose();
  };

  return (
    <>
      <Menu
        open={isOpen}
        onClose={onClose}
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 200,
            borderRadius: '8px',
            '& .MuiMenuItem-root': {
              py: 1,
            }
          }
        }}
      >
        <MenuItem onClick={handleSplitClick}>
          <ListItemIcon>
            <SplitIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Change Split" />
        </MenuItem>
        <MenuItem onClick={handleQuantityClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Change Quantity" />
        </MenuItem>
        <MenuItem onClick={handleFulfilmentTypeClick}>
          <ListItemIcon>
            <WarehouseIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Change Fulfilment Type" />
        </MenuItem>
      </Menu>

      <SplitDialog
        open={splitDialogOpen}
        onClose={handleSplitDialogClose}
        onSave={handleSplitSave}
        currentItem={currentItem}
      />
      <QuantityDialog
        open={quantityDialogOpen}
        onClose={handleQuantityDialogClose}
        onSave={handleQuantitySave}
        currentItem={currentItem}
      />
      <FulfilmentTypeDialog
        open={fulfilmentTypeDialogOpen}
        onClose={handleFulfilmentTypeDialogClose}
        onSave={handleFulfilmentTypeSave}
        currentItem={currentItem}
      />
    </>
  );
};

export default ContextMenu;
