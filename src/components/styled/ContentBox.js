import { Box } from '@mui/material';
import { styled } from '@mui/system';

const ContentBox = styled(Box)(({ theme, hasFooter, dailyNotesPanelOpen, dailyNotesPanelHeight }) => ({
  padding: '10px',
  paddingBottom: hasFooter ? '24px' : '10px',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  flex: 1,
  overflow: 'auto',
  minHeight: 0, // Важно для flex контейнера
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
    position: 'relative',
    top: '-1px', // Поднимаем на 1px выше
  },
  '& .hotkey-highlighted': {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
    border: `2px solid ${theme.palette.warning.dark}`,
    opacity: 1,
    animation: 'pulse 1s infinite',
  },
  '& .hotkey-open-tab': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
    border: `2px solid ${theme.palette.success.dark}`,
    opacity: 1,
  },
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(255, 193, 7, 0.7)',
    },
    '70%': {
      boxShadow: '0 0 0 10px rgba(255, 193, 7, 0)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(255, 193, 7, 0)',
    },
  },
  '& ul, & ol': {
    paddingLeft: '20px',
  },
  '& *': {
    maxWidth: '100%',
    wordWrap: 'break-word',
  },
  '& .task-checkbox': {
    cursor: 'pointer',
    userSelect: 'none',
    display: 'inline-block',
    padding: '2px 4px',
    borderRadius: '3px',
    transition: 'background-color 0.2s ease',
    '& *': {
      cursor: 'pointer',
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      opacity: 0.9,
    },
  },
  '& .task-checkbox.checked': {
    color: theme.palette.mode === 'dark' ? '#81c784' : '#2e7d32',
    fontWeight: 'bold',
    textDecoration: 'line-through',
  },
  '& .task-checkbox.unchecked': {
    color: theme.palette.text.primary,
  },
}));

export default ContentBox;
