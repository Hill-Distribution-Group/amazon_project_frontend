import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  ThemeProvider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  const [restrictedItems, setRestrictedItems] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAssigneeChange = (ID, assigneeIds) => {
    setAssignees(prev => ({ ...prev, [ID]: assigneeIds }));
  };

  const fetchSavedItems = useCallback(async () => {
    try {
      const response = await api.get('/api/saved_results/get_saved_results');
      const data = response.data;

      // Create initial assignees based on User ID
      const initialAssignees = data.reduce((acc, item) => {
        acc[item.ID] = [item["User ID"]]; // Use "User ID" directly
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
      
      if (response.data.items_with_restrictions && response.data.items_with_restrictions.length > 0) {
        setRestrictedItems(response.data.items_with_restrictions);
        setIsDialogOpen(true);
      }

      const approvedItemIds = response.data.approved_items || [];
      setSavedItems(prevItems => prevItems.filter(item => !approvedItemIds.includes(item.ID)));
      
      const newAssignees = {...assignees};
      approvedItemIds.forEach(id => {
        delete newAssignees[id];
      });
      setAssignees(newAssignees);
  
      showSnackbar('Items processed successfully.', 'success');
      return { success: true, message: 'Items processed successfully.' };
    } catch (error) {
      console.error('Error approving items:', error);
      showSnackbar('Error approving items. Please try again.', 'error');
      return { success: false, message: 'Error approving items. Please try again.' };
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setRestrictedItems([]);
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

  const handleDecisionUpdate = async (updatedItem) => {
    try {
      await api.post('/api/saved_results/update_decision', { ID: updatedItem.ID, decision: updatedItem.Decision });
      setSavedItems(prevItems => 
        prevItems.map(item => 
          item.ID === updatedItem.ID ? { ...item, Decision: updatedItem.Decision } : item
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
                onDecisionUpdate={handleDecisionUpdate} 
                onCommentUpdate={handleCommentUpdate}
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
        <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>Below items have been rejected due to listing restrictions</DialogTitle>
          <DialogContent>
            {restrictedItems.map((item, index) => (
              <Box key={index} mb={2}>
                <Typography variant="subtitle1">ASIN: {item.asin}</Typography>
                <Typography variant="body1">{item.restrictions}</Typography>
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    </ThemeProvider>
  );
};

export default ToApprove;
