import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { KeyboardArrowUp as ArrowUpIcon } from '@mui/icons-material';
import { styled } from '@mui/system';

const FooterContainer = styled(Box)(({ theme, isOpen }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: '24px',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  zIndex: 1100,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  '& .footer-content': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  '& .hotkey-symbol': {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: '0.9em',
    backgroundColor: '#e0e0e0',
    padding: '1px 5px',
    borderRadius: '999px',
    border: '1px solid #bdbdbd',
    opacity: 0.9,
    position: 'relative',
    top: '-1px',
  },
  '& .arrow-icon': {
    transition: 'transform 0.3s ease',
    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
  },
}));

const Footer = ({ isOpen, onToggle, height, noteType = 'daily', isEditing = false, isDailyNotesEditing = false }) => {
  const getNoteTypeName = (type) => {
    return 'Ежедневные';
  };

  return (
    <FooterContainer isOpen={isOpen} onClick={onToggle}>
      <div className="footer-content">
        <span>{getNoteTypeName(noteType)} заметки</span>
        <ArrowUpIcon className="arrow-icon" fontSize="small" />
        {!isEditing && !isDailyNotesEditing && <span className="hotkey-symbol" style={{ marginLeft: '4px' }}>+</span>}
      </div>
    </FooterContainer>
  );
};

export default Footer;
