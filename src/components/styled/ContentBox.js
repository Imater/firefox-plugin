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
    color: '#000000',
    fontWeight: 'bold',
    fontSize: '0.9em',
    marginLeft: '4px',
    backgroundColor: theme.palette.mode === 'dark' ? '#d0d0d0' : '#e0e0e0',
    padding: '1px 5px',
    borderRadius: '999px',
    border: '1px solid #bdbdbd',
    opacity: 0.9,
  },
  '& *': {
    maxWidth: '100%',
    wordWrap: 'break-word',
  },
}));

export default ContentBox;
