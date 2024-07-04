import React, { useState } from 'react';
import { 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Container,
  Paper,
  styled 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import backgroundImage from './assets/pexels-tiger-lily-4483775.jpg';


let theme = createTheme({
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h2: { fontWeight: 700 },
    h4: { fontWeight: 600 },
  },
  palette: {
    primary: { main: '#0056b3' },
    secondary: { main: '#ff6b00' },
    background: { default: '#f4f6f8' },
  },
});

theme = responsiveFontSizes(theme);

const AppContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}));

const WelcomeBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  marginTop: '2rem'
}));


const HelpPage = () => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <ThemeProvider theme={theme}>
      <AppContainer maxWidth={false} disableGutters>
        <WelcomeBox elevation={0}>
        <Typography variant="h4" gutterBottom>
          HDG Inventory Management System - Help & Documentation
        </Typography>
        <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography variant="h6">1. Getting Started</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <strong>Logging In</strong>
              <ul>
                <li>Access the HDG Inventory Management System using the provided URL.</li>
                <li>Enter your assigned username and password on the welcome page.</li>
                <li>Click the "Login" button to access the Dashboard.</li>
              </ul>
              <strong>Dashboard Overview</strong>
              <p>The Dashboard is your central hub for system functionalities. It provides:</p>
              <ul>
                <li><strong>Amazon Product Matching Section:</strong> The area for processing product information and finding matches on Amazon.</li>
                <li><strong>Logs Section:</strong>  Displays real-time logs and updates related to your actions and processing status.</li>
                <li><strong>Results Section:</strong> Shows the results of your product matching processes.</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2a-content"
            id="panel2a-header"
          >
            <Typography variant="h6">2. Amazon Product Matching</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <p> This feature analyzes product information and finds potential matches on Amazon to make informed sourcing and profitability decisions.</p>
              <strong>Processing Methods</strong>
              <ul>
                <li><strong>URL Processing:</strong> Provide a Costco catalog URL (online viewer or mail URL). The system extracts product details and attempts to match them with Amazon listings.</li>
                <li><strong>Text Processing:</strong> Input a product title or ASIN directly, along with its cost, VAT information, and selling price on Amazon. The system uses this information to find matches on Amazon and calculate potential profitability.</li>
                <li><strong>Image Processing:</strong>  Upload an image of a product. The system will use image recognition to identify the product and find matches on Amazon.</li>
              </ul>
              <strong>Understanding the Results</strong>
              <p>After processing, the Results section displays a table with the following information for each matched product:</p>
              <ul>
                <li><strong>Search Query:</strong> The input product name or ASIN.</li>
                <li><strong>Amazon Product Name/URL:</strong> The name and link to the matched product on Amazon.</li>
                <li><strong>ASIN:</strong> The Amazon Standard Identification Number for the product.</li>
                <li><strong>Matching Percentage:</strong> The similarity score between your input product and the Amazon product. </li>
                <li><strong>Sales Volume:</strong> The estimated monthly sales volume on Amazon.</li>
                <li><strong>Price Information:</strong> Cheapest price, cheapest FBA/FBM price, Buy Box price, and Prime prices.</li>
                <li><strong>Competitor Sellers:</strong> The number of other sellers offering the same product on Amazon.</li>
                <li><strong>Expected Sales Volume:</strong> The estimated monthly sales volume considering competition.</li>
                <li><strong>Product Dimensions & Weight:</strong>  Physical details of the product.</li>
                <li><strong>Product Description:</strong> A brief description from the Amazon listing.</li>
                <li><strong>Fee Information:</strong> Amazon referral fees, FBA fees, and FBM fees. </li>
                <li><strong>Cost of Goods:</strong> Your cost for purchasing the product.</li>
                <li><strong>VAT Information:</strong> VAT rate and calculated VAT costs for various scenarios.</li>
                <li><strong>Profitability Calculations:</strong> Net profit for FBA/FBM, total net profit, expected total net profit, and profit margins.</li>
                <li><strong>Is Sold by Amazon:</strong> Whether Amazon is directly selling the product. </li>
                <li><strong>Decision:</strong> A system-generated recommendation based on profitability.</li>
              </ul>
              <strong>Saving and Managing Results</strong>
              <ul>
                <li><strong>Saving Items:</strong> Check the checkboxes next to the desired products and click "Save Selected Items".</li>
                <li><strong>Managing Saved Items:</strong> Review saved items in the "Saved Results" section. You can add comments, update decisions, assign users for review, and approve items for procurement. </li>
              </ul>
              <strong>Approving Items for Procurement</strong>
              <ul>
                <li><strong>Approving Items:</strong> Select the items to procure and click "Approve Selected Items".</li>
                <li><strong>Assigning Users (Optional):</strong>  Assign specific users to review and handle procurement. </li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3a-content"
            id="panel3a-header"
          >
            <Typography variant="h6">3. Procurement Management</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <p>This section simplifies purchasing approved products.</p>
              <strong>To Procure List</strong>
              <p>Approved items are added to the "To Procure" list, providing an overview of products needing purchase. The list includes:</p>
              <ul>
                <li>Product Name</li>
                <li>Product ASIN</li>
                <li>Product SKU</li>
                <li>Purchase Price</li>
                <li>Sell Price (FBA and FBM)</li>
                <li>Quantity</li>
                <li>VAT Rate</li>
                <li>Supplier Information</li>
                <li>Extra Packing Requirements</li>
              </ul>
              <strong>Creating Purchase Orders</strong>
              <ul>
                <li><strong>Select Items:</strong> Choose the products for your purchase order.</li>
                <li><strong>Generate Purchase Order:</strong> Click "Create Purchase Order". You can review and edit the purchase order before submission.</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel4a-content"
            id="panel4a-header"
          >
            <Typography variant="h6">4. Viewing Past Data</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <p>Review your saved results and past search history.</p>
              <strong>Saved Results:</strong>
              <p>The "Saved Results" section lists all products saved from previous Amazon Product Matching processes. Revisit past analyses and track your decisions.</p>
              <strong>Past Searches:</strong>
              <p>The "Past Searches" section displays a history of all your searches. Quickly access previous results and analyze trends.</p>
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion expanded={expanded === 'panel5'} onChange={handleChange('panel5')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel5a-content"
            id="panel5a-header"
          >
            <Typography variant="h6">5. Additional Features</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <strong>User Management</strong>
              <p>Administrators can manage user accounts, assign roles, and control access to various functionalities.</p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === 'panel6'} onChange={handleChange('panel6')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel6a-content"
            id="panel6a-header"
          >
            <Typography variant="h6">6. Frontend Documentation (For Developers)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <strong>Component Breakdown</strong>
              <p>The frontend uses React and Material-UI for a modular and responsive interface. Key components include:</p>
              <ul>
                <li><strong>LoginForm:</strong> Handles user authentication.</li>
                <li><strong>Dashboard:</strong> The main component, showing the Amazon Product Matching section, Logs, and Results.</li>
                <li><strong>ResultTable:</strong> Displays product matching results in a table, allowing sorting, filtering, and selection.</li>
                <li><strong>SavedResults:</strong> Displays saved items, with actions like commenting, decision updates, and approval.</li>
                <li><strong>ToProcure:</strong>  Displays products for procurement and allows creation of purchase orders.</li>
                <li><strong>PastSearches:</strong> Displays a history of past searches.</li>
                <li><strong>Header:</strong> The navigation bar for various sections and user account options.</li>
                <li><strong>Footer:</strong>  The application's bottom section, usually with copyright information.</li>
              </ul>
              <strong>Data Flow and Interactions</strong>
              <ul>
                <li>User actions trigger API requests to the backend.</li>
                <li>The backend processes data and returns responses (results, logs, status updates).</li>
                <li>The frontend updates the UI based on received data.</li>
                <li>Socket.IO enables real-time communication for live log updates.</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion expanded={expanded === 'panel7'} onChange={handleChange('panel7')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel7a-content"
            id="panel7a-header"
          >
            <Typography variant="h6">7. Troubleshooting & Support</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <ul>
                <li>Contact the system administrator for any issues or questions.</li>
                <li>Check the detailed error logs in the Dashboard's Logs section.</li>
                <li>Refer to additional documentation and resources on the system's help page or knowledge base.</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>
        </WelcomeBox>
      </AppContainer>
    </ThemeProvider>
  );
};

export default HelpPage;