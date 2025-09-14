import { Paper } from '@mui/material';
import { styled } from '@mui/system';

const SettingsPanel = styled(Paper)(({ theme }) => ({
  padding: '16px',
  marginBottom: '16px',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  border: theme.palette.mode === 'light' ? '1px solid #e0e0e0' : 'none',
  maxHeight: 'calc(100vh - 200px)', // Ограничиваем высоту, оставляя место для хедера и отступов
  minHeight: '400px', // Минимальная высота для удобства использования
  overflowY: 'auto', // Добавляем вертикальный скроллинг
  overflowX: 'hidden', // Скрываем горизонтальный скроллинг
  // Кастомный скроллбар для лучшего UX
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[400],
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[500],
    },
  },
  // Для Firefox
  scrollbarWidth: 'thin',
  scrollbarColor: `${theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[400]} ${theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100]}`,
}));

export default SettingsPanel;
