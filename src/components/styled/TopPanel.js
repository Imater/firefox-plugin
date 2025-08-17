import { Box } from '@mui/material';
import { styled } from '@mui/system';

const TopPanel = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  backgroundColor: theme.palette.background.default,
  padding: '10px',
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#333' : '#d0d0d0'}`,
  boxShadow: theme.palette.mode === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
}));

export default TopPanel;
