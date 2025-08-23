import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  IconButton, 
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { useTranslation } from '../utils/i18n';
import { 
  Edit as EditIcon, 
  Visibility as ViewIcon, 
  Save as SaveIcon,
  Cancel as CancelIcon 
} from '@mui/icons-material';
import { styled } from '@mui/system';

const EditorContainer = styled(Box)(({ theme }) => ({
  padding: '10px',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  '& .MuiTextField-root': {
    width: '100%',
    '& .MuiInputBase-root': {
      fontSize: '11px',
    },
  },
  '& .editor-toolbar': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    gap: '8px',
  },
  '& .editor-actions': {
    display: 'flex',
    gap: '8px',
  },
}));

const MarkdownEditor = ({ 
  content, 
  onSave, 
  onCancel, 
  isEditing, 
  onToggleEdit,
  currentPage 
}) => {
  const { t } = useTranslation();
  const [editContent, setEditContent] = useState(content);

  // Обновляем editContent при изменении content
  React.useEffect(() => {
    setEditContent(content);
  }, [content]);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editContent);
      setSnackbar({ 
        open: true, 
        message: t('msg.saved_success'), 
        severity: 'success' 
      });
      onToggleEdit();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `${t('msg.save_error')} ${error.message}`, 
        severity: 'error' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    onCancel();
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isEditing) {
    return (
      <EditorContainer>
        <div className="editor-toolbar">
                      <span>{t('header.edit')}</span>
          <div className="editor-actions">
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving}
              size="small"
            >
              {isSaving ? t('daily.saving') : t('daily.save')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={isSaving}
              size="small"
            >
              {t('daily.cancel')}
            </Button>
          </div>
        </div>
        <TextField
          multiline
          rows={20}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          variant="outlined"
          placeholder="Введите markdown текст..."
          sx={{
            '& .MuiInputBase-root': {
              fontFamily: 'monospace',
              fontSize: '14px',
            }
          }}
        />
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </EditorContainer>
    );
  }

  return null;
};

export default MarkdownEditor;
