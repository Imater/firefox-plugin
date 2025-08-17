import { Paper } from '@mui/material';
import { styled } from '@mui/system';

const SettingsPanel = styled(Paper)(({ theme }) => ({
  padding: '16px',
  marginBottom: '16px',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  border: theme.palette.mode === 'light' ? '1px solid #e0e0e0' : 'none',
}));

export default SettingsPanel;
