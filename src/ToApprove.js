import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
} from '@mui/material';
import ResultTable from './ResultTable';
import api from './api';
import { useSnackbar } from './SnackbarContext';

const SavedResults = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [assignees, setAssignees] = useState({});
  const { showSnackbar } = useSnackbar();

  const handleAssigneeChange = (asin, assigneeId) => {
    setAssignees(prev => ({ ...prev, [asin]: assigneeId }));
  };

  const fetchSavedItems = useCallback(async () => {
    try {
      console.log('Fetching saved items...');
      const response = await api.get('/api/saved_results/get_saved_results');
      console.log('Received response:', response.data);
      setSavedItems(response.data);
    } catch (error) {
      console.error('Error fetching saved items:', error.response ? error.response.data : error);
      setError('Failed to load saved items. Please try again later.');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/get_users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Failed to fetch users. Please try again.', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchSavedItems();
    fetchUsers();
  }, [fetchSavedItems, fetchUsers]);

  const handleApproveSelected = async (selectedItems) => {
    const unassignedItems = selectedItems.filter(item => !assignees[item.ASIN]);
    if (unassignedItems.length > 0) {
      showSnackbar('Please assign users to all selected items before approving.', 'error');
      return { success: false, message: 'Please assign users to all selected items before approving.' };
    }
  
    try {
      console.log('Selected items for approval:', selectedItems);
      const itemsWithAssignees = selectedItems.map(item => ({
        ...item,
        Assignee: assignees[item.ASIN]
      }));
      console.log('Items with assignees:', itemsWithAssignees);
      await api.post('/api/saved_results/approve_saved_items', { items: itemsWithAssignees });
      console.log('Approval request sent successfully');
      
      setSavedItems(prevItems => prevItems.filter(item => !selectedItems.some(selected => selected.ASIN === item.ASIN)));
      
      const newAssignees = {...assignees};
      selectedItems.forEach(item => {
        delete newAssignees[item.ASIN];
      });
      setAssignees(newAssignees);
  
      showSnackbar('Items approved successfully.', 'success');
      return { success: true, message: 'Items approved successfully.' };
    } catch (error) {
      console.error('Error approving items:', error);
      showSnackbar('Error approving items. Please try again.', 'error');
      return { success: false, message: 'Error approving items. Please try again.' };
    }
  };

  const handleCommentUpdate = async (updatedItem) => {
    try {
      await api.post('/api/saved_results/update_comment', { ASIN: updatedItem.ASIN, comment: updatedItem.Comment });
      setSavedItems(prevItems =>
        prevItems.map(item =>
          item.ASIN === updatedItem.ASIN ? { ...item, Comment: updatedItem.Comment } : item
        )
      );
      console.log('Comment updated:', updatedItem);
      showSnackbar('Comment updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating comment:', error);
      showSnackbar('Error updating comment. Please try again.', 'error');
    }
  };
  
  const handleDecisionUpdate = async (updatedItem) => {
    try {
      await api.post('/api/saved_results/update_decision', { ASIN: updatedItem.ASIN, decision: updatedItem.Decision });
      setSavedItems(prevItems => 
        prevItems.map(item => 
          item.ASIN === updatedItem.ASIN ? { ...item, Decision: updatedItem.Decision } : item
        )
      );
      console.log('Decision updated:', updatedItem);
      showSnackbar('Decision updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating decision:', error);
      showSnackbar('Error updating decision. Please try again.', 'error');
    }
  };

  const handleRemoveSelected = async (selectedItems) => {
    try {
      await api.post('/api/saved_results/remove_saved_items', { items: selectedItems });
      fetchSavedItems();  // Refresh the data
      showSnackbar('Items removed successfully.', 'success');
    } catch (error) {
      console.error('Error removing items:', error);
      showSnackbar('Error removing items. Please try again.', 'error');
    }
  };

  if (error) {
    return (
      <Box width="100%">
        <Typography variant="h4" color="error" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box width="100%" px={3}>
      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
        Pending Approval Products
      </Typography>
      {savedItems.length > 0 ? (
        <ResultTable 
          data={savedItems} 
          setData={setSavedItems}
          onSaveSelected={handleApproveSelected}
          onRemoveSelected={handleRemoveSelected}
          onDecisionUpdate={handleDecisionUpdate} 
          onCommentUpdate={handleCommentUpdate}
          isSavedResults={true}
          users={users}
          assignees={assignees}
          onAssigneeChange={handleAssigneeChange}
          showApprovalStatus={false} // Hide approval status on this page
        />
      ) : (
        <Typography variant="body1">No pending items found.</Typography>
      )}
    </Box>
  );
};

export default SavedResults;
