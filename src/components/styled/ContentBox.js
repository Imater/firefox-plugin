import { Box } from '@mui/material';
import { styled } from '@mui/system';

const ContentBox = styled(Box)(({ theme, hasFooter }) => ({
  padding: '10px',
  paddingBottom: hasFooter ? '24px' : '10px',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  '& pre': {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowX: 'auto',
  },
  '& code': {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  '& a': {
    color: theme.palette.mode === 'dark' ? '#64b5f6' : '#0066cc',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& .wiki-link': {
    color: theme.palette.mode === 'dark' ? '#81c784' : '#009688',
    fontWeight: 'bold',
  },
  '& .external-link': {
    color: theme.palette.mode === 'dark' ? '#64b5f6' : '#0066cc',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& .hotkey-symbol': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    fontWeight: 'bold',
    fontSize: '0.9em',
    marginLeft: '4px',
    backgroundColor: theme.palette.mode === 'dark' ? '#ff6b35' : '#ff9800',
    padding: '2px 6px',
    borderRadius: '4px',
    border: `2px solid ${theme.palette.mode === 'dark' ? '#ff6b35' : '#ff9800'}`,
    textShadow: theme.palette.mode === 'dark' ? '0 0 2px rgba(255, 255, 255, 0.8)' : '0 0 2px rgba(0, 0, 0, 0.3)',
  },
  '& *': {
    maxWidth: '100%',
    wordWrap: 'break-word',
  },
}));

export default ContentBox;
