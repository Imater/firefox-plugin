import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { styled } from '@mui/system';

const LinkPreviewContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: '10px', // Размещаем в самом верху страницы
  left: '16px',
  right: '16px',
  zIndex: 1200,
  padding: '4px 8px',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '6px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  maxHeight: '80px',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  transform: 'translateY(0)',
  opacity: 1,
  '&.hidden': {
    transform: 'translateY(-100%)',
    opacity: 0,
  },
}));

const LinkPreview = ({ link, isVisible }) => {
  if (!link || !isVisible) {
    return null;
  }

  return (
    <LinkPreviewContainer className={isVisible ? '' : 'hidden'}>
      <Paper 
        elevation={0} 
        sx={{ 
          padding: '4px 6px',
          backgroundColor: 'transparent',
          maxHeight: '60px',
          overflow: 'auto'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '10px',
            lineHeight: 1.2,
            color: 'text.secondary'
          }}
        >
          {link}
        </Typography>
      </Paper>
    </LinkPreviewContainer>
  );
};

export default LinkPreview;
