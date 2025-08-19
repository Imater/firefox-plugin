// Получаем элементы DOM
const titleInput = document.getElementById('title');
const commentInput = document.getElementById('comment');
const urlDisplay = document.getElementById('url-display');
const addBtn = document.getElementById('add-btn');
const cancelBtn = document.getElementById('cancel-btn');
const destinationInputs = () => Array.from(document.querySelectorAll('input[name="targetDestination"]'));

// Получаем данные от background script
let defaultTitle = '';
let defaultUrl = '';

// Загружаем данные из storage
chrome.storage.local.get(['popup_data'], function(result) {
  if (result.popup_data) {
    defaultTitle = result.popup_data.title || '';
    defaultUrl = result.popup_data.url || '';
    const defaultDestination = result.popup_data.destination || 'current';
    
    // Заполняем поля данными
    titleInput.value = defaultTitle;
    urlDisplay.textContent = defaultUrl;
    
    // Устанавливаем выбранное назначение
    const destinationInput = destinationInputs().find(r => r.value === defaultDestination);
    if (destinationInput) {
      destinationInput.checked = true;
    }
    
    // Очищаем данные из storage
    chrome.storage.local.remove(['popup_data']);
  }
});

// Фокус на поле ввода названия
titleInput.focus();

// Обработчик нажатия Enter в полях ввода
titleInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addBookmark();
    }
});

commentInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addBookmark();
    }
});

// Обработчик кнопки "Добавить"
addBtn.addEventListener('click', addBookmark);

// Обработчик кнопки "Отмена"
cancelBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ type: 'cancel' });
});

// Функция добавления закладки
function addBookmark() {
    const title = titleInput.value.trim();
    const comment = commentInput.value.trim();
    const url = defaultUrl;
    const destination = (destinationInputs().find(r => r.checked) || {}).value || 'current';
    
    if (!title) {
        alert('Пожалуйста, введите название ссылки');
        titleInput.focus();
        return;
    }
    
    if (!url) {
        alert('Ошибка: не удалось получить ссылку');
        return;
    }
    
    // Отправляем данные в background script
    chrome.runtime.sendMessage({
        type: 'bookmark_data',
        data: {
            title: title,
            url: url,
            comment: comment,
            destination: destination
        }
    });
}

// Обработчик закрытия окна
window.addEventListener('beforeunload', function() {
    chrome.runtime.sendMessage({ type: 'cancel' });
});
