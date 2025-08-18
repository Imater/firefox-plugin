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
    color: '#000000',
    fontWeight: 'bold',
    fontSize: '0.9em',
    backgroundColor: theme.palette.mode === 'dark' ? '#d0d0d0' : '#e0e0e0',
    padding: '1px 5px',
    borderRadius: '999px',
    border: '1px solid #bdbdbd',
    opacity: 0.9,
    position: 'relative',
    top: '-1px', // Поднимаем на 1px выше
  },
}));

export default TopPanel;
