import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import ResultTable from './ResultTable';
import api from './api';

const SavedResults = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [assignees, setAssignees] = useState({});  
  const handleAssigneeChange = (asin, assigneeId) => {
    setAssignees(prev => ({ ...prev, [asin]: assigneeId }));
  };
  useEffect(() => {
    fetchSavedItems();
    fetchUsers();
  }, []);


  const fetchSavedItems = async () => {
    try {
      console.log('Fetching saved items...');
      const response = await api.get('/get_saved_results');
      console.log('Received response:', response.data);
      setSavedItems(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching saved items:', error.response ? error.response.data : error);
      setError('Failed to load saved items. Please try again later.');
      setLoading(false);
    }
  };


  const fetchUsers = async () => {
    try {
      const response = await api.get('/get_users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  const handleApproveSelected = async (selectedItems) => {
    try {
      console.log('Selected items for approval:', selectedItems);
      const itemsWithAssignees = selectedItems.map(item => ({
        ...item,
        Assignee: assignees[item.ASIN] || null
      }));
      console.log('Items with assignees:', itemsWithAssignees);
      await api.post('/approve_items', { items: itemsWithAssignees });
      console.log('Approval request sent successfully');
      
      // Remove approved items from the local state
      setSavedItems(prevItems => prevItems.filter(item => !selectedItems.some(selected => selected.ASIN === item.ASIN)));
      
      // Clear assignees for approved items
      const newAssignees = {...assignees};
      selectedItems.forEach(item => {
        delete newAssignees[item.ASIN];
      });
      setAssignees(newAssignees);
    } catch (error) {
      console.error('Error approving items:', error);
    }
  };

  const handleCommentUpdate = async (updatedItem) => {
    try {
      await api.post('/update_comment', { ASIN: updatedItem.ASIN, comment: updatedItem.Comment });
      setSavedItems(prevItems =>
        prevItems.map(item =>
          item.ASIN === updatedItem.ASIN ? { ...item, Comment: updatedItem.Comment } : item
        )
      );
      console.log('Comment updated:', updatedItem);
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };
  
  const handleDecisionUpdate = async (updatedItem) => {
    try {
      await api.post('/update_decision', { ASIN: updatedItem.ASIN, decision: updatedItem.Decision });
      setSavedItems(prevItems => 
        prevItems.map(item => 
          item.ASIN === updatedItem.ASIN ? { ...item, Decision: updatedItem.Decision } : item
        )
      );
      console.log('Decision updated:', updatedItem);
    } catch (error) {
      console.error('Error updating decision:', error);
    }
  };
  const handleRemoveSelected = async (selectedItems) => {
    try {
      await api.post('/remove_saved_items', { items: selectedItems });
      fetchSavedItems();  // Refresh the data
    } catch (error) {
      console.error('Error removing items:', error);
    }
  };
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

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
        Saved Results
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
          users={users}  // Pass users to ResultTable
          assignees={assignees}
          onAssigneeChange={handleAssigneeChange}

        />
      ) : (
        <Typography variant="body1">No saved items found.</Typography>
      )}
    </Box>
  );
};

export default SavedResults;
