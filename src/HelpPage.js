import React, { useState } from 'react';
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Paper,
  styled,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { ThemeProvider } from '@mui/material/styles';
import theme, {
  PageContainer,
  ContentContainer,
  ResultsContainer,
  StyledHeader,
  HeaderTitle,
  HeaderActions
} from './themes/globalTheme';

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '&:before': {
    display: 'none',
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&.Mui-expanded': {
    minHeight: 56,
  },
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(3),
}));

const SubSectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

const HelpPage = () => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const renderListItem = (text, icon) => (
    <ListItem>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={text} />
    </ListItem>
  );

  return (
    <ThemeProvider theme={theme}>
      <PageContainer>
        <StyledHeader>
          <Box sx={{ width: '33%' }} />
          <HeaderTitle variant="h5" component="h1" color="textPrimary">
            Help & Documentation
          </HeaderTitle>
          <HeaderActions>
            {/* Add any header actions if needed */}
          </HeaderActions>
        </StyledHeader>
        <ContentContainer>
          <ResultsContainer>
            <Paper elevation={3} sx={{ padding: 3 }}>
              <Typography variant="h4" gutterBottom align="center">
                HDG Inventory Management System - Help & Documentation
              </Typography>

              <StyledAccordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">1. Getting Started</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <SectionTitle variant="h6">Logging In</SectionTitle>
                  <List>
                    {renderListItem('Access the HDG Inventory Management System using the provided URL.', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Enter your assigned username and password on the welcome page.', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Click the "Login" button to access the Dashboard.', <CheckCircleOutlineIcon color="primary" />)}
                  </List>
                  
                  <SectionTitle variant="h6">Dashboard Overview</SectionTitle>
                  <Typography paragraph>
                    The Dashboard is your central hub for system functionalities. It provides:
                  </Typography>
                  <List>
                    {renderListItem('Amazon Product Matching Section: The area for processing product information and finding matches on Amazon.', <InfoIcon color="info" />)}
                    {renderListItem('Logs Section: Displays real-time logs and updates related to your actions and processing status.', <InfoIcon color="info" />)}
                    {renderListItem('Results Section: Shows the results of your product matching processes.', <InfoIcon color="info" />)}
                  </List>
                  
                  <SubSectionTitle variant="subtitle1">Navigation</SubSectionTitle>
                  <Typography paragraph>
                    Use the navigation bar at the top of the page to access different sections of the system:
                  </Typography>
                  <List>
                    {renderListItem('Dashboard: Return to the main dashboard at any time.', <InfoIcon color="info" />)}
                    {renderListItem('To Approve: View and manage items pending approval.', <InfoIcon color="info" />)}
                    {renderListItem('To Procure: Access the list of items ready for procurement.', <InfoIcon color="info" />)}
                    {renderListItem('Past Searches: Review your search history.', <InfoIcon color="info" />)}
                    {renderListItem('Supplier Management: Manage your suppliers.', <InfoIcon color="info" />)}
                    {renderListItem('Purchase Orders: Create and manage purchase orders.', <InfoIcon color="info" />)}
                  </List>
                </StyledAccordionDetails>
              </StyledAccordion>

              <StyledAccordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">2. Amazon Product Matching</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography paragraph>
                    This feature analyzes product information and finds potential matches on Amazon to make informed sourcing and profitability decisions.
                  </Typography>
                  
                  <SectionTitle variant="h6">Processing Methods</SectionTitle>
                  <List>
                    {renderListItem('URL Processing: Provide a Costco catalog URL (online viewer or mail URL). The system extracts product details and attempts to match them with Amazon listings.', <InfoIcon color="info" />)}
                    {renderListItem('Text Processing: Input a product title or ASIN directly, along with its cost, VAT information, and selling price on Amazon. The system uses this information to find matches on Amazon and calculate potential profitability.', <InfoIcon color="info" />)}
                    {renderListItem('Image Processing: Upload an image of a product. The system will use image recognition to identify the product and find matches on Amazon.', <InfoIcon color="info" />)}
                  </List>
                  
                  <SectionTitle variant="h6">Understanding the Results</SectionTitle>
                  <Typography paragraph>
                    After processing, the Results section displays a table with the following information for each matched product:
                  </Typography>
                  <List>
                    {renderListItem('Search Query: The input product name or ASIN.', <InfoIcon color="info" />)}
                    {renderListItem('Amazon Product Name/URL: The name and link to the matched product on Amazon.', <InfoIcon color="info" />)}
                    {renderListItem('ASIN: The Amazon Standard Identification Number for the product.', <InfoIcon color="info" />)}
                    {renderListItem('Matching Percentage: The similarity score between your input product and the Amazon product.', <InfoIcon color="info" />)}
                    {renderListItem('Sales Volume: The estimated monthly sales volume on Amazon.', <InfoIcon color="info" />)}
                    {renderListItem('Price Information: Cheapest price, cheapest FBA/FBM price, Buy Box price, and Prime prices.', <InfoIcon color="info" />)}
                    {renderListItem('Competitor Sellers: The number of other sellers offering the same product on Amazon.', <InfoIcon color="info" />)}
                    {renderListItem('Expected Sales Volume: The estimated monthly sales volume considering competition.', <InfoIcon color="info" />)}
                    {renderListItem('Product Dimensions & Weight: Physical details of the product.', <InfoIcon color="info" />)}
                    {renderListItem('Product Description: A brief description from the Amazon listing.', <InfoIcon color="info" />)}
                    {renderListItem('Fee Information: Amazon referral fees, FBA fees, and FBM fees.', <InfoIcon color="info" />)}
                    {renderListItem('Cost of Goods: Your cost for purchasing the product.', <InfoIcon color="info" />)}
                    {renderListItem('VAT Information: VAT rate and calculated VAT costs for various scenarios.', <InfoIcon color="info" />)}
                    {renderListItem('Profitability Calculations: Net profit for FBA/FBM, total net profit, expected total net profit, and profit margins.', <InfoIcon color="info" />)}
                    {renderListItem('Is Sold by Amazon: Whether Amazon is directly selling the product.', <InfoIcon color="info" />)}
                    {renderListItem('Decision: A system-generated recommendation based on profitability.', <InfoIcon color="info" />)}
                  </List>
                  
                  <SectionTitle variant="h6">Saving and Managing Results</SectionTitle>
                  <List>
                    {renderListItem('Saving Items: Check the checkboxes next to the desired products and click "Save Selected Items".', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Managing Saved Items: Review saved items in the "Saved Results" section. You can add comments, update decisions, assign users for review, and approve items for procurement.', <CheckCircleOutlineIcon color="primary" />)}
                  </List>
                  
                  <SectionTitle variant="h6">Approving Items for Procurement</SectionTitle>
                  <List>
                    {renderListItem('Approving Items: Select the items to procure and click "Approve Selected Items".', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Assigning Users (Optional): Assign specific users to review and handle procurement.', <CheckCircleOutlineIcon color="primary" />)}
                  </List>
                </StyledAccordionDetails>
              </StyledAccordion>

              <StyledAccordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">3. Procurement Management</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography paragraph>
                    This section simplifies purchasing approved products.
                  </Typography>
                  
                  <SectionTitle variant="h6">To Procure List</SectionTitle>
                  <Typography paragraph>
                    Approved items are added to the "To Procure" list, providing an overview of products needing purchase. The list includes:
                  </Typography>
                  <List>
                    {renderListItem('Product Name', <InfoIcon color="info" />)}
                    {renderListItem('Product ASIN', <InfoIcon color="info" />)}
                    {renderListItem('Product SKU', <InfoIcon color="info" />)}
                    {renderListItem('Purchase Price', <InfoIcon color="info" />)}
                    {renderListItem('Sell Price (FBA and FBM)', <InfoIcon color="info" />)}
                    {renderListItem('Quantity', <InfoIcon color="info" />)}
                    {renderListItem('VAT Rate', <InfoIcon color="info" />)}
                    {renderListItem('Supplier Information', <InfoIcon color="info" />)}
                    {renderListItem('Extra Packing Requirements', <InfoIcon color="info" />)}
                  </List>
                  
                  <SectionTitle variant="h6">Creating Purchase Orders</SectionTitle>
                  <List>
                    {renderListItem('Select Items: Choose the products for your purchase order.', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Generate Purchase Order: Click "Create Purchase Order". You can review and edit the purchase order before submission.', <CheckCircleOutlineIcon color="primary" />)}
                  </List>
                  
                  <SubSectionTitle variant="subtitle1">Purchase Order Details</SubSectionTitle>
                  <Typography paragraph>
                    When creating a purchase order, you'll need to provide:
                  </Typography>
                  <List>
                    {renderListItem('Supplier: Select the supplier for the order.', <InfoIcon color="info" />)}
                    {renderListItem('Expected Delivery Date: Set the anticipated delivery date for the order.', <InfoIcon color="info" />)}
                    {renderListItem('Items: Add items to the purchase order, including quantity and unit cost.', <InfoIcon color="info" />)}
                    {renderListItem('Sales Channel Split: Specify how the inventory will be split across different sales channels (e.g., Amazon FBA, FBM).', <InfoIcon color="info" />)}
                  </List>
                </StyledAccordionDetails>
              </StyledAccordion>

              <StyledAccordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">4. Viewing Past Data</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography paragraph>
                    Review your saved results and past search history.
                  </Typography>
                  
                  <SectionTitle variant="h6">Saved Results</SectionTitle>
                  <Typography paragraph>
                    The "Saved Results" section lists all products saved from previous Amazon Product Matching processes. Here you can:
                  </Typography>
                  <List>
                    {renderListItem('Review past analyses and track your decisions.', <InfoIcon color="info" />)}
                    {renderListItem('Update comments and decisions on saved items.', <InfoIcon color="info" />)}
                    {renderListItem('Approve items for procurement or remove them from the saved list.', <InfoIcon color="info" />)}
                  </List>
                  
                  <SectionTitle variant="h6">Past Searches</SectionTitle>
                  <Typography paragraph>
                    The "Past Searches" section displays a history of all your searches. This allows you to:
                  </Typography>
                  <List>
                    {renderListItem('Quickly access previous results and analyze trends.', <InfoIcon color="info" />)}
                    {renderListItem('Review the details of past product matches.', <InfoIcon color="info" />)}
                    {renderListItem('Rerun previous searches if needed.', <InfoIcon color="info" />)}
                  </List>
                </StyledAccordionDetails>
              </StyledAccordion>

              <StyledAccordion expanded={expanded === 'panel5'} onChange={handleChange('panel5')}>
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">5. Supplier Management</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography paragraph>
                    The Supplier Management section allows you to manage your supplier information efficiently.
                  </Typography>
                  
                  <SectionTitle variant="h6">Features</SectionTitle>
                  <List>
                    {renderListItem('Add New Suppliers: Enter details such as name, contact information, and product categories.', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Edit Existing Suppliers: Update supplier information as needed.', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('View Supplier List: See all your suppliers in a comprehensive list.', <InfoIcon color="info" />)}
                    {renderListItem('Delete Suppliers: Remove suppliers that are no longer relevant.', <WarningIcon color="warning" />)}
                  </List>
                  
                  <SectionTitle variant="h6">Supplier Information</SectionTitle>
                  <Typography paragraph>
                    For each supplier, you can manage the following information:
                  </Typography>
                  <List>
                    {renderListItem('Name: The supplier\'s company name.', <InfoIcon color="info" />)}
                    {renderListItem('Contact Number: Primary contact phone number.', <InfoIcon color="info" />)}
                    {renderListItem('Purchase Email: Email address for purchase-related communication.', <InfoIcon color="info" />)}
                    {renderListItem('Administration Email: Email address for administrative matters.', <InfoIcon color="info" />)}
                    {renderListItem('Type: Category or type of supplier.', <InfoIcon color="info" />)}
                    {renderListItem('Products: Types of products offered by the supplier.', <InfoIcon color="info" />)}
                    {renderListItem('Minimum Order Size: The smallest order the supplier will fulfill.', <InfoIcon color="info" />)}
                    {renderListItem('Website: The supplier\'s official website.', <InfoIcon color="info" />)}
                  </List>
                </StyledAccordionDetails>
              </StyledAccordion>

              <StyledAccordion expanded={expanded === 'panel6'} onChange={handleChange('panel6')}>
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">6. Purchase Orders</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography paragraph>
                    The Purchase Orders section allows you to create, manage, and track your purchase orders.
                  </Typography>
                  
                  <SectionTitle variant="h6">Creating a Purchase Order</SectionTitle>
                  <List>
                    {renderListItem('Click on "Create New PO" to start a new purchase order.', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Select a supplier from the dropdown menu.', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Set the expected delivery date.', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Add items to the purchase order, specifying quantity and unit cost.', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Specify sales channel split for each item if applicable.', <CheckCircleOutlineIcon color="primary" />)}
                  </List>
                  
                  <SectionTitle variant="h6">Managing Purchase Orders</SectionTitle>
                  <List>
                    {renderListItem('View All POs: See a list of all created purchase orders.', <InfoIcon color="info" />)}
                    {renderListItem('Edit PO: Modify details of an existing purchase order.', <InfoIcon color="info" />)}
                    {renderListItem('Delete PO: Remove purchase orders that are no longer needed.', <WarningIcon color="warning" />)}
                    {renderListItem('Update Status: Change the status of a PO (e.g., from "Pending" to "Shipped").', <InfoIcon color="info" />)}
                  </List>
                  
                  <SectionTitle variant="h6">Purchase Order Statuses</SectionTitle>
                  <Typography paragraph>
                    Purchase orders can have the following statuses:
                  </Typography>
                  <List>
                    {renderListItem('Draft: Initial state when creating a new PO.', <InfoIcon color="info" />)}
                    {renderListItem('Pending: PO is finalized but not yet approved.', <InfoIcon color="info" />)}
                    {renderListItem('Approved: PO has been reviewed and approved.', <CheckCircleOutlineIcon color="success" />)}
                    {renderListItem('Shipped: The order has been shipped by the supplier.', <InfoIcon color="info" />)}
                    {renderListItem('Received: The order has been received at your warehouse.', <CheckCircleOutlineIcon color="success" />)}
                  </List>
                </StyledAccordionDetails>
              </StyledAccordion>

              <StyledAccordion expanded={expanded === 'panel7'} onChange={handleChange('panel7')}>
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">7. Troubleshooting & Support</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <SectionTitle variant="h6">Common Issues and Solutions</SectionTitle>
                  <List>
                    {renderListItem('Login Problems: Ensure you\'re using the correct username and password. If issues persist, use the "Forgot Password" option or contact the system administrator.', <WarningIcon color="warning" />)}
                    {renderListItem('Slow Performance: Check your internet connection. If the problem continues, try clearing your browser cache or using a different browser.', <WarningIcon color="warning" />)}
                    {renderListItem('Data Not Saving: Make sure you\'re clicking the "Save" or "Submit" button after making changes. If the issue persists, log out and log back in.', <WarningIcon color="warning" />)}
                  </List>
                  
                  <SectionTitle variant="h6">Getting Help</SectionTitle>
                  <List>
                    {renderListItem('Check the detailed error logs in the Dashboard\'s Logs section for specific error messages.', <InfoIcon color="info" />)}
                    {renderListItem('Refer to this help documentation for guidance on using specific features.', <InfoIcon color="info" />)}
                    {renderListItem('Contact the system administrator for any issues or questions not covered in the documentation.', <InfoIcon color="info" />)}
                  </List>
                  
                  <SectionTitle variant="h6">Reporting Bugs</SectionTitle>
                  <Typography paragraph>
                    If you encounter a bug or unexpected behavior:
                  </Typography>
                  <List>
                    {renderListItem('Document the steps to reproduce the issue.', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Take screenshots if possible.', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Note any error messages you see.', <CheckCircleOutlineIcon color="primary" />)}
                    {renderListItem('Report the issue to the system administrator or support team with as much detail as possible.', <CheckCircleOutlineIcon color="primary" />)}
                  </List>
                </StyledAccordionDetails>
              </StyledAccordion>
            </Paper>
          </ResultsContainer>
        </ContentContainer>
      </PageContainer>
    </ThemeProvider>
  );
};

export default HelpPage;                    