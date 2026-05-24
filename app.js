// state management
let tasks = [];
let categories = [];
let selectedFilter = 'all'; // 'all' | 'active' | 'completed'
let selectedCategoryFilter = 'all'; // 'all' | categoryId
let searchQuery = '';
let currentTheme = 'dark';
let selectedCategoryColor = '#8b5cf6'; // default for custom categories

// default categories
const DEFAULT_CATEGORIES = [
    { id: 'personal', name: 'شخصي', color: '#ec4899' },
    { id: 'work', name: 'عمل', color: '#3b82f6' },
    { id: 'shopping', name: 'تسوق', color: '#f59e0b' },
    { id: 'health', name: 'صحة', color: '#10b981' }
];

// preset colors for custom category modal
const PRESET_COLORS = [
    '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
];

// DOM Elements
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const categorySelect = document.getElementById('categorySelect');
const dueDateInput = document.getElementById('dueDateInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.tab-btn');
const categoryChipsContainer = document.getElementById('categoryChipsContainer');
const todoList = document.getElementById('todoList');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const toastContainer = document.getElementById('toastContainer');

// Modal DOM Elements
const categoryModal = document.getElementById('categoryModal');
const openAddCategoryBtn = document.getElementById('openAddCategoryBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');
const newCategoryName = document.getElementById('newCategoryName');
const colorPresetsContainer = document.getElementById('colorPresets');

// Stats Elements
const statsProgressCircle = document.getElementById('statsProgressCircle');
const statsPercentText = document.getElementById('statsPercentText');
const statsDescription = document.getElementById('statsDescription');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initTheme();
    renderColorPresets();
    setupEventListeners();
    renderCategories();
    render();
});

// --- LocalStorage Logic ---
function loadData() {
    // Load Theme
    currentTheme = localStorage.getItem('todo-theme') || 'dark';

    // Load Categories
    const savedCategories = localStorage.getItem('todo-categories');
    if (savedCategories) {
        categories = JSON.parse(savedCategories);
    } else {
        categories = [...DEFAULT_CATEGORIES];
        localStorage.setItem('todo-categories', JSON.stringify(categories));
    }

    // Load Tasks
    const savedTasks = localStorage.getItem('todo-tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    } else {
        tasks = [
            {
                id: 'task-1',
                title: 'مرحباً بك في تطبيق مهامي! قم بتجربة إضافة وحذف المهام.',
                completed: false,
                priority: 'low',
                category: 'personal',
                dueDate: new Date().toISOString().split('T')[0],
                createdAt: Date.now() - 3600000
            },
            {
                id: 'task-2',
                title: 'أكمل التقرير الشهري الخاص بإنتاجية الفريق.',
                completed: true,
                priority: 'high',
                category: 'work',
                dueDate: '',
                createdAt: Date.now() - 7200000
            }
        ];
        saveTasks();
    }
}

function saveTasks() {
    localStorage.setItem('todo-tasks', JSON.stringify(tasks));
}

function saveCategories() {
    localStorage.setItem('todo-categories', JSON.stringify(categories));
}

// --- Theme Logic ---
function initTheme() {
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('todo-theme', currentTheme);
    updateThemeIcon();
    showToast(currentTheme === 'dark' ? 'تم تفعيل الوضع الداكن 🌙' : 'تم تفعيل الوضع الفاتح ☀️', 'info');
}

function updateThemeIcon() {
    if (currentTheme === 'light') {
        // Sun Icon
        themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    } else {
        // Moon Icon
        themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    }
}

// --- Setup Event Listeners ---
function setupEventListeners() {
    // Theme Switcher
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Add Task
    addTaskBtn.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        render();
    });

    // Status Filter Tabs
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedFilter = btn.dataset.filter;
            render();
        });
    });

    // Category Modal Event Handlers
    openAddCategoryBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelCategoryBtn.addEventListener('click', closeModal);
    saveCategoryBtn.addEventListener('click', handleAddCategory);

    // Close modal on overlay click
    categoryModal.addEventListener('click', (e) => {
        if (e.target === categoryModal) closeModal();
    });
}

// --- Render Categories in Form & Filter ---
function renderCategories() {
    // 1. Render Category Select Box Options
    categorySelect.innerHTML = categories.map(cat =>
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');

    // 2. Render Category Chips Filter
    // Clear old category chips except the Add Category Button
    const oldChips = categoryChipsContainer.querySelectorAll('.category-chip, .btn-all-chip');
    oldChips.forEach(chip => chip.remove());

    // Create the "All" Category Chip
    const allChip = document.createElement('button');
    allChip.className = `category-chip btn-all-chip ${selectedCategoryFilter === 'all' ? 'active' : ''}`;
    allChip.innerHTML = `<span>الكل</span>`;
    allChip.addEventListener('click', () => {
        selectedCategoryFilter = 'all';
        updateCategoryChipsActiveState();
        render();
    });

    // Insert "All" Chip at the start
    categoryChipsContainer.insertBefore(allChip, openAddCategoryBtn);

    // Render each category chip
    categories.forEach(cat => {
        const chip = document.createElement('button');
        chip.className = `category-chip ${selectedCategoryFilter === cat.id ? 'active' : ''}`;
        chip.dataset.id = cat.id;
        
        // Show delete button on all categories except 'personal' (which is the core fallback category)
        const deleteButtonHTML = cat.id !== 'personal' ? `
            <span class="delete-cat-btn" title="حذف التصنيف" data-id="${cat.id}">&times;</span>
        ` : '';

        chip.innerHTML = `
            <span class="category-dot" style="background-color: ${cat.color}"></span>
            <span>${cat.name}</span>
            ${deleteButtonHTML}
        `;
        
        chip.addEventListener('click', (e) => {
            // If user clicked the delete button inside the chip, handle it separately
            if (e.target.classList.contains('delete-cat-btn')) {
                e.stopPropagation();
                deleteCategory(cat.id);
                return;
            }

            if (selectedCategoryFilter === cat.id) {
                selectedCategoryFilter = 'all'; // toggle off
            } else {
                selectedCategoryFilter = cat.id;
            }
            updateCategoryChipsActiveState();
            render();
        });
        categoryChipsContainer.insertBefore(chip, openAddCategoryBtn);
    });
}

function updateCategoryChipsActiveState() {
    const chips = categoryChipsContainer.querySelectorAll('.category-chip');
    chips.forEach(chip => {
        if (chip.classList.contains('btn-all-chip')) {
            if (selectedCategoryFilter === 'all') chip.classList.add('active');
            else chip.classList.remove('active');
        } else {
            if (chip.dataset.id === selectedCategoryFilter) chip.classList.add('active');
            else chip.classList.remove('active');
        }
    });
}

// --- Custom Category Modal Functions ---
function openModal() {
    categoryModal.classList.add('active');
    newCategoryName.focus();
}

function closeModal() {
    categoryModal.classList.remove('active');
    newCategoryName.value = '';
    selectedCategoryColor = PRESET_COLORS[0];
    renderColorPresets();
}

function renderColorPresets() {
    colorPresetsContainer.innerHTML = PRESET_COLORS.map(color => `
        <button class="color-preset-btn ${selectedCategoryColor === color ? 'active' : ''}" 
                style="background-color: ${color}" 
                data-color="${color}"
                aria-label="Preset Color">
        </button>
    `).join('');

    // Add click listeners to color presets
    const colorBtns = colorPresetsContainer.querySelectorAll('.color-preset-btn');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedCategoryColor = e.target.dataset.color;
            renderColorPresets();
        });
    });
}

function handleAddCategory() {
    const name = newCategoryName.value.trim();
    if (!name) {
        showToast('الرجاء كتابة اسم للتصنيف!', 'warning');
        return;
    }

    // Check if category name already exists (case insensitive)
    const exists = categories.some(cat => cat.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        showToast('هذا التصنيف موجود بالفعل!', 'warning');
        return;
    }

    const newId = 'cat-' + Date.now();
    const newCat = {
        id: newId,
        name: name,
        color: selectedCategoryColor
    };

    categories.push(newCat);
    saveCategories();
    renderCategories();

    // Select the newly created category in the dropdown form automatically
    categorySelect.value = newId;

    closeModal();
    showToast(`تم إنشاء تصنيف "${name}" بنجاح!`, 'success');
}

function deleteCategory(catId) {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    if (confirm(`هل أنت متأكد من حذف تصنيف "${cat.name}"؟ سيتم نقل جميع المهام المرتبطة به إلى تصنيف "شخصي".`)) {
        // 1. Remove from categories array
        categories = categories.filter(c => c.id !== catId);
        saveCategories();

        // 2. Re-assign tasks to 'personal'
        tasks.forEach(t => {
            if (t.category === catId) {
                t.category = 'personal';
            }
        });
        saveTasks();

        // 3. Reset selected filter if deleted category was active
        if (selectedCategoryFilter === catId) {
            selectedCategoryFilter = 'all';
        }

        // 4. Update UI
        renderCategories();
        render();

        showToast(`تم حذف تصنيف "${cat.name}" بنجاح! 🗑️`, 'warning');
    }
}

// --- Task Actions ---
function handleAddTask() {
    const title = taskInput.value.trim();
    if (!title) {
        showToast('الرجاء كتابة تفاصيل المهمة!', 'warning');
        return;
    }

    const priority = prioritySelect.value;
    const category = categorySelect.value;
    const dueDate = dueDateInput.value;

    const newTask = {
        id: 'task-' + Date.now(),
        title: title,
        completed: false,
        priority: priority,
        category: category,
        dueDate: dueDate,
        createdAt: Date.now()
    };

    tasks.unshift(newTask);
    saveTasks();

    // Reset Form Input
    taskInput.value = '';
    dueDateInput.value = '';
    taskInput.focus();

    showToast('تمت إضافة المهمة بنجاح! ✨', 'success');
    render();
}

function toggleTask(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex > -1) {
        const isCompleted = !tasks[taskIndex].completed;
        tasks[taskIndex].completed = isCompleted;
        saveTasks();

        if (isCompleted) {
            showToast('عمل رائع! تم إنجاز المهمة 🎉', 'success');
        } else {
            showToast('تمت إعادة فتح المهمة ✍️', 'info');
        }

        render();
    }
}

function deleteTask(id) {
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    if (taskElement) {
        taskElement.classList.add('deleting');

        // Wait for slide-out CSS transition before removing from array & DOM
        taskElement.addEventListener('animationend', () => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            render();
            showToast('تم حذف المهمة  🗑️', 'warning');
        }, { once: true });
    }
}

// Inline edit of task title
function editTask(id) {
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    if (!taskElement) return;

    const titleEl = taskElement.querySelector('.todo-title');
    const oldTitle = titleEl.innerText;

    // Create inline input element
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'main-input';
    input.style.padding = '4px 8px';
    input.style.fontSize = '0.95rem';
    input.value = oldTitle;

    // Replace the title element with the input temporarily
    titleEl.replaceWith(input);
    input.focus();
    input.select();

    let isSaved = false;

    const saveEdit = () => {
        if (isSaved) return;
        isSaved = true;

        const newTitle = input.value.trim();
        if (newTitle && newTitle !== oldTitle) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.title = newTitle;
                saveTasks();
                showToast('تم تعديل المهمة بنجاح!', 'success');
            }
        }
        render(); // redraw the list to restore stable DOM state
    };

    // Save on Enter or Blur
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        }
    });
    input.addEventListener('blur', saveEdit);
}

// --- Toast System ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;

    toastContainer.appendChild(toast);

    // Automatically delete toast node when exit animation completes
    toast.addEventListener('animationend', (e) => {
        if (e.animationName === 'toastOut') {
            toast.remove();
        }
    });
}

// --- Render Engine & Filtering ---
function render() {
    todoList.innerHTML = '';

    // Filter Tasks
    let filteredTasks = tasks.filter(task => {
        // 1. Status Filter
        const matchesStatus =
            selectedFilter === 'all' ||
            (selectedFilter === 'active' && !task.completed) ||
            (selectedFilter === 'completed' && task.completed);

        // 2. Category Filter
        const matchesCategory =
            selectedCategoryFilter === 'all' ||
            task.category === selectedCategoryFilter;

        // 3. Search Query
        const matchesSearch =
            task.title.toLowerCase().includes(searchQuery);

        return matchesStatus && matchesCategory && matchesSearch;
    });

    // Custom Sorting: active tasks first, then completed tasks.
    // Within those groups, sort by createdAt descending (newest first).
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return b.createdAt - a.createdAt;
    });

    // Handle Empty State
    if (filteredTasks.length === 0) {
        let message = 'لا توجد مهام حالياً.';
        if (searchQuery) {
            message = 'لا توجد نتائج مطابقة لبحثك.';
        } else if (selectedFilter === 'active') {
            message = 'رائع! لا توجد مهام نشطة متأخرة.';
        } else if (selectedFilter === 'completed') {
            message = 'لم تقم بإنجاز أي مهمة بعد، يمكنك البدء الآن!';
        }

        todoList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📂</span>
                <h4 class="empty-title">قائمة فارغة</h4>
                <p class="empty-desc">${message}</p>
            </div>
        `;

        updateStats();
        return;
    }

    // Render Todo Card Items
    filteredTasks.forEach(task => {
        const cat = categories.find(c => c.id === task.category) || { name: 'غير محدد', color: '#6b7280' };

        const card = document.createElement('div');
        card.className = `todo-item`;
        card.dataset.taskId = task.id;

        // format due date beautifully
        let dateString = '';
        if (task.dueDate) {
            const dateObj = new Date(task.dueDate);
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            const isToday = dateObj.toDateString() === today.toDateString();
            const isTomorrow = dateObj.toDateString() === tomorrow.toDateString();

            if (isToday) dateString = 'اليوم 📅';
            else if (isTomorrow) dateString = 'غداً 📅';
            else dateString = task.dueDate;
        }

        const priorityLabel = task.priority === 'high' ? 'مرتفعة' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة';

        card.innerHTML = `
            <div class="checkbox-wrapper">
                <input type="checkbox" id="check-${task.id}" class="todo-checkbox" ${task.completed ? 'checked' : ''}>
                <label for="check-${task.id}" class="checkbox-visual" aria-label="أكمل المهمة"></label>
            </div>
            
            <div class="todo-content">
                <div class="todo-title">${escapeHTML(task.title)}</div>
                <div class="todo-meta-row">
                    <span class="meta-badge priority-badge ${task.priority}">${priorityLabel}</span>
                    <span class="meta-badge" style="background-color: ${cat.color}25; color: ${cat.color}; border: 1px solid ${cat.color}40;">
                        ${cat.name}
                    </span>
                    ${dateString ? `<span class="meta-badge date-badge">${dateString}</span>` : ''}
                </div>
            </div>

            <div class="todo-actions">
                <button class="action-btn edit-btn" title="تعديل المهمة" aria-label="تعديل">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <button class="action-btn delete-btn" title="حذف المهمة" aria-label="حذف">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;

        // Event listeners inside card
        const checkbox = card.querySelector('.todo-checkbox');
        checkbox.addEventListener('change', () => toggleTask(task.id));

        const editBtn = card.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => editTask(task.id));

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        // Support double click on todo content to edit
        const contentArea = card.querySelector('.todo-content');
        contentArea.addEventListener('dblclick', () => {
            if (!task.completed) editTask(task.id);
        });

        todoList.appendChild(card);
    });

    updateStats();
}

// --- Dynamic Stats Dashboard Updates ---
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 1. Update SVG Progress Circle Stroke Dashoffset
    // Circle circumference = 2 * PI * r = 2 * 3.14159 * 30 = 188.4
    const circumference = 188.4;
    const offset = circumference - (percentage / 100) * circumference;
    statsProgressCircle.style.strokeDashoffset = offset;

    // 2. Update Text percentage
    statsPercentText.innerText = `${percentage}%`;

    // 3. Update descriptive text with nice copy
    let descriptionText = '';
    if (total === 0) {
        descriptionText = 'لا توجد مهام مضافة بعد. ابدأ بإضافة مهمتك الأولى!';
    } else if (completed === total) {
        descriptionText = 'مذهل! لقد أنجزت جميع المهام اليوم بنجاح! 🏆';
    } else {
        descriptionText = `لقد أنجزت ${completed} من أصل ${total} مهام اليوم (${percentage}%). واصل العطاء! 💪`;
    }
    statsDescription.innerText = descriptionText;
}

// Helper to secure output against HTML injection
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
