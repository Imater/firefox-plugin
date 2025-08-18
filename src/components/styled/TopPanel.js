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
  '& .hotkey-symbol': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    fontWeight: 'bold',
    fontSize: '0.9em',
    backgroundColor: theme.palette.mode === 'dark' ? '#ff6b35' : '#ff9800',
    padding: '2px 6px',
    borderRadius: '4px',
    border: `2px solid ${theme.palette.mode === 'dark' ? '#ff6b35' : '#ff9800'}`,
    textShadow: theme.palette.mode === 'dark' ? '0 0 2px rgba(255, 255, 255, 0.8)' : '0 0 2px rgba(0, 0, 0, 0.3)',
  },
}));

export default TopPanel;
