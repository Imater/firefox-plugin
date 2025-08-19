import React from 'react';
import { Box, IconButton, Breadcrumbs, Link } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';
import TopPanel from './styled/TopPanel';
import { getBreadcrumbs } from '../utils/breadcrumbs';

const Header = ({ 
  onRefresh, 
  onToggleSettings, 
  onToggleEdit,
  isEditing,
  isDailyNotesEditing = false,
  currentPage, 
  onBreadcrumbClick, 
  isDarkMode,
  isWaitingForSecondKey = false
}) => {
  return (
    <TopPanel>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <IconButton onClick={onRefresh} size="small">
            <RefreshIcon />
          </IconButton>
          <IconButton 
            onClick={onToggleEdit} 
            size="small"
            color={isEditing ? "primary" : "default"}
          >
            <EditIcon />
          </IconButton>
          {isWaitingForSecondKey && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: 'warning.main',
              color: 'warning.contrastText',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              <span>Ожидание второй клавиши...</span>
              <span style={{ fontSize: '10px' }}>(ESC для отмены)</span>
            </Box>
          )}
        </Box>
        <IconButton onClick={onToggleSettings} size="small">
          <SettingsIcon />
        </IconButton>
      </Box>

      <Breadcrumbs 
        aria-label="breadcrumb" 
        sx={{ 
          marginBottom: '16px',
          '& .MuiBreadcrumbs-separator': {
            color: isDarkMode ? '#ffffff' : '#000000'
          }
        }}
      >
        {getBreadcrumbs(currentPage).map((crumb, index) => (
          <Link
            key={index}
            color={index === getBreadcrumbs(currentPage).length - 1 ? 'text.primary' : 'inherit'}
            underline="hover"
            onClick={() => onBreadcrumbClick(crumb.path)}
            sx={{ 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {index === 0 && <HomeIcon sx={{ fontSize: 16, marginRight: '4px' }} />}
            {crumb.name}
                               {index === 0 && !isEditing && !isDailyNotesEditing && <span className="hotkey-symbol" style={{ marginLeft: '4px' }}>0</span>}
          </Link>
        ))}
      </Breadcrumbs>
    </TopPanel>
  );
};

export default Header;
