// Получаем элементы DOM
const titleInput = document.getElementById('title');
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
    
    // Заполняем поля данными
    titleInput.value = defaultTitle;
    urlDisplay.textContent = defaultUrl;
    
    // Очищаем данные из storage
    chrome.storage.local.remove(['popup_data']);
  }
});

// Фокус на поле ввода названия
titleInput.focus();

// Обработчик нажатия Enter в поле ввода
titleInput.addEventListener('keypress', function(e) {
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
            destination: destination
        }
    });
}

// Обработчик закрытия окна
window.addEventListener('beforeunload', function() {
    chrome.runtime.sendMessage({ type: 'cancel' });
});
