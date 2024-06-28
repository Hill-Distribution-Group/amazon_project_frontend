// ContextMenu.js
import React from 'react';
import { Menu, MenuItem, Select } from '@mui/material';

const decisions = [
  "No Buy",
  "Buy (FBA-registered)",
  "Buy (FBM-registered)",
  "Buy (FBA-non-registered)",
  "Buy (FBM-non-registered)"
];

const ContextMenu = ({ anchorPosition, isOpen, onClose, onDecisionChange }) => {
  return (
    <Menu
      open={isOpen}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
    >
      <MenuItem>
        <Select
          value=""
          onChange={(e) => {
            onDecisionChange(e.target.value);
            onClose();
          }}
          displayEmpty
          fullWidth
        >
          <MenuItem value="" disabled>
            Change Decision
          </MenuItem>
          {decisions.map((decision) => (
            <MenuItem key={decision} value={decision}>
              {decision}
            </MenuItem>
          ))}
        </Select>
      </MenuItem>
    </Menu>
  );
};

export default ContextMenu;
