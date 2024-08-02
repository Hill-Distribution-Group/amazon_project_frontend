import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  ThemeProvider,
} from '@mui/material';
import ResultTable from './ResultTable';
import api from './api';
import { useSnackbar } from './SnackbarContext';
import theme, { 
  PageContainer, 
  ContentContainer, 
  ResultsContainer, 
  StyledHeader,
  HeaderTitle,
  HeaderActions
} from './themes/globalTheme';

const ToApprove = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [assignees, setAssignees] = useState({});
  const { showSnackbar } = useSnackbar();

  const handleAssigneeChange = (ID, assigneeIds) => {
    setAssignees(prev => ({ ...prev, [ID]: assigneeIds }));
  };

  const fetchSavedItems = useCallback(async () => {
    try {
      const response = await api.get('/api/saved_results/get_saved_results');
      const data = response.data;

      const initialAssignees = data.reduce((acc, item) => {
        acc[item.ID] = [item["User ID"]];
        return acc;
      }, {});
      setAssignees(initialAssignees);
      setSavedItems(data);

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
    const unassignedItems = selectedItems.filter(item => !assignees[item.ID] || assignees[item.ID].length === 0);
    if (unassignedItems.length > 0) {
      showSnackbar('Please assign users to all selected items before approving.', 'error');
      return { success: false, message: 'Please assign users to all selected items before approving.' };
    }
  
    try {
      const itemsWithAssignees = selectedItems.map(item => ({
        ...item,
        Assignees: assignees[item.ID]
      }));
      const response = await api.post('/api/saved_results/approve_saved_items', { items: itemsWithAssignees });
      
      const approvedItemIds = response.data.approved_items || [];
      setSavedItems(prevItems => prevItems.filter(item => !approvedItemIds.includes(item.ID)));
      
      setAssignees(prevAssignees => {
        const newAssignees = {...prevAssignees};
        approvedItemIds.forEach(id => {
          delete newAssignees[id];
        });
        return newAssignees;
      });
  
      showSnackbar('Items processed successfully.', 'success');
      return { success: true, message: 'Items processed successfully.' };
    } catch (error) {
      console.error('Error approving items:', error);
      showSnackbar('Error approving items. Please try again.', 'error');
      return { success: false, message: 'Error approving items. Please try again.' };
    }
  };

  const handleRejectSelected = async (selectedItems) => {
    try {
      await api.post('/api/saved_results/reject_saved_items', { items: selectedItems });
      
      setSavedItems(prevItems => prevItems.filter(item => !selectedItems.some(selected => selected.ID === item.ID)));
      
      showSnackbar('Items rejected successfully.', 'success');
      return { success: true, message: 'Items rejected successfully.' };
    } catch (error) {
      console.error('Error rejecting items:', error);
      showSnackbar('Error rejecting items. Please try again.', 'error');
      return { success: false, message: 'Error rejecting items. Please try again.' };
    }
  };

  const handleCommentUpdate = async (updatedItem) => {
    try {
      await api.post('/api/saved_results/update_comment', { ID: updatedItem.ID, comment: updatedItem.Comment });
      setSavedItems(prevItems =>
        prevItems.map(item =>
          item.ID === updatedItem.ID ? { ...item, Comment: updatedItem.Comment } : item
        )
      );
      console.log('Comment updated:', updatedItem);
      showSnackbar('Comment updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating comment:', error);
      showSnackbar('Error updating comment. Please try again.', 'error');
    }
  };

  const handleRemoveSelected = async (selectedItems) => {
    try {
      await api.post('/api/saved_results/remove_saved_items', { items: selectedItems });
      fetchSavedItems();
      showSnackbar('Items removed successfully.', 'success');
    } catch (error) {
      console.error('Error removing items:', error);
      showSnackbar('Error removing items. Please try again.', 'error');
    }
  };

  const handleSplitUpdate = async (updatedItem) => {
    try {
      await api.post('/api/saved_results/update_split', {
        ID: updatedItem.ID,
        FBA_Split: updatedItem['FBA Split'],
        FBM_Split: updatedItem['FBM Split'],
      });
      setSavedItems(prevItems => 
        prevItems.map(item => 
          item.ID === updatedItem.ID 
            ? { ...item, 'FBA Split': updatedItem['FBA Split'], 'FBM Split': updatedItem['FBM Split'] } 
            : item
        )
      );
      console.log('Split updated:', updatedItem);
      showSnackbar('Split updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating split:', error);
      showSnackbar('Error updating split. Please try again.', 'error');
    }
  };

  const handleQuantityUpdate = async (updatedItem) => {
    try {
      await api.post('/api/saved_results/update_quantity', {
        ID: updatedItem.ID,
        Quantity: updatedItem.Quantity,
        FBA_Split: updatedItem['FBA Split'],
        FBM_Split: updatedItem['FBM Split'],
      });
      setSavedItems(prevItems => 
        prevItems.map(item => 
          item.ID === updatedItem.ID 
            ? { ...item, Quantity: updatedItem.Quantity, 'FBA Split': updatedItem['FBA Split'], 'FBM Split': updatedItem['FBM Split'] } 
            : item
        )
      );
      showSnackbar('Quantity and split updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating quantity and split:', error);
      showSnackbar('Error updating quantity and split. Please try again.', 'error');
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
    <ThemeProvider theme={theme}>
      <PageContainer>
        <StyledHeader>
          <Box sx={{ width: '33%' }} />
          <HeaderTitle variant="h5" component="h1" color="textPrimary">
            Pending Approval Products
          </HeaderTitle>
          <HeaderActions>
            {/* Add your header buttons here if needed */}
            </HeaderActions>
        </StyledHeader>
        <ContentContainer>
          <ResultsContainer>
            {savedItems.length > 0 ? (
                  <ResultTable 
                  data={savedItems} 
                  setData={setSavedItems}
                  onSaveSelected={handleApproveSelected}
                  onRemoveSelected={handleRemoveSelected}
                  onSplitUpdate={handleSplitUpdate} 
                  onCommentUpdate={handleCommentUpdate}
                  onQuantityUpdate={handleQuantityUpdate}
                  isSavedResults={true}
                  users={users}
                  assignees={assignees}
                  onAssigneeChange={handleAssigneeChange}
                  multipleAssignees={true}
                  onRejectSelected={handleRejectSelected}
                />
            ) : (
              <Typography variant="body1">No pending items found.</Typography>
            )}
          </ResultsContainer>
        </ContentContainer>
      </PageContainer>
    </ThemeProvider>
  );
};

export default ToApprove;
