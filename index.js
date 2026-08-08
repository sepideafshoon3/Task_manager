const Modal = {
    ui: document.getElementById('customModal'),
    title: document.getElementById('modalTitle'),
    input: document.getElementById('modalInput'),
    confirm: document.getElementById('modalConfirm'),
    cancel: document.getElementById('modalCancel'),
    close: document.querySelector('.close-modal'),

    async open(title, defaultValue = "", placeholder = "") {
        return new Promise((resolve) => {
            this.title.innerText = title;
            this.input.value = defaultValue;
            this.input.placeholder = placeholder;
            this.ui.classList.remove('hidden');
            this.input.focus();

            const finish = (val) => {
                this.ui.classList.add('hidden');
                this.confirm.onclick = null;
                this.cancel.onclick = null;
                this.close.onclick = null;
                this.ui.onclick = null;
                resolve(val);
            };

            this.confirm.onclick = () => finish(this.input.value.trim());
            this.cancel.onclick = () => finish(null);
            this.close.onclick = () => finish(null);
            this.ui.onclick = (e) => { if(e.target === this.ui) finish(null); };
        });
    }
};

const ConfirmModal = {
    ui: document.getElementById('confirmModal'),
    title: document.getElementById('confirmTitle'),
    msg: document.getElementById('confirmMessage'),
    btnCancel: document.getElementById('confirmCancel'),
    btnExecute: document.getElementById('confirmExecute'),

    async open(title, message) {
        return new Promise((resolve) => {
            this.title.innerText = title;
            this.msg.innerText = message;
            this.ui.classList.remove('hidden');

            const cleanup = (result) => {
                this.ui.classList.add('hidden');
                this.btnExecute.onclick = null;
                this.btnCancel.onclick = null;
                resolve(result);
            };

            this.btnExecute.onclick = () => cleanup(true);
            this.btnCancel.onclick = () => cleanup(false);
            this.ui.onclick = (e) => { if(e.target === this.ui) cleanup(false); };
        });
    }
};

const TaskModal = {
    ui: document.getElementById('taskModal'),
    title: document.getElementById('modalTaskTitle'),
    deadline: document.getElementById('modalDeadline'),
    desc: document.getElementById('modalDesc'),
    label: document.getElementById('modalLabel'),
    subtasksContainer: document.getElementById('modalSubtasks'),
    btnSubtask: document.getElementById('addSubtask'),
    btnDelete: document.getElementById('modalDelete'),
    btnConfirm: document.getElementById('modalConfirmTask'), 
    btnCancel: document.getElementById('modalCancelTask'),   
    btnClose: document.querySelector('#taskModal .close-modal'), 

    async open(taskData = {}) {
        return new Promise((resolve) => {
            this.title.value = taskData.name || "";
            this.deadline.value = taskData.deadline || "";
            this.desc.value = taskData.desc || "";
            this.label.value = taskData.label || "";
            this.subtasksContainer.innerHTML = '';
            
            if (taskData.subtasks) {
                taskData.subtasks.forEach(s => this.addSubtaskUI(s.text, s.done));
            }

            this.ui.classList.remove('hidden');

            const cleanup = () => {
                this.ui.classList.add('hidden');
                this.btnConfirm.onclick = null;
                this.btnDelete.onclick = null;
                this.btnSubtask.onclick = null;
                this.btnCancel.onclick = null; 
                this.btnClose.onclick = null;  
                this.ui.onclick = null;
            };

            this.btnSubtask.onclick = () => this.addSubtaskUI();

            this.btnConfirm.onclick = () => {
                const subtasks = [...this.subtasksContainer.querySelectorAll('.subtask-item')].map(item => ({
                    text: item.querySelector('input[type="text"]').value,
                    done: item.querySelector('input[type="checkbox"]').checked
                }));
                
                resolve({
                    action: 'save',
                    data: {
                        name: this.title.value,
                        deadline: this.deadline.value,
                        desc: this.desc.value,
                        label: this.label.value,
                        subtasks: subtasks
                    }
                });
                cleanup();
            };

            this.btnDelete.onclick = () => {
                if(confirm("Are you sure you want to delete this task?")) {
                    resolve({ action: 'delete' });
                    cleanup();
                }
            };

            this.btnCancel.onclick = () => {
                resolve(null);
                cleanup();
            };

            this.btnClose.onclick = () => {
                resolve(null);
                cleanup();
            };
            
            this.ui.onclick = (e) => { 
                if(e.target === this.ui) { 
                    resolve(null); 
                    cleanup(); 
                } 
            };
        });
    },

    addSubtaskUI(text = "", done = false) {
        const div = document.createElement('div');
        div.className = 'subtask-item';
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '5px';
        div.innerHTML = `
            <input type="checkbox" ${done ? 'checked' : ''}>
            <input type="text" value="${text}" placeholder="Subtask..." style="flex:1; border:none; border-bottom:1px solid #eee; outline:none;">
        `;
        this.subtasksContainer.appendChild(div);
    }
};

const NotificationManager = {
    async requestPermission() {
        if (!("Notification" in window)) return false;
        if (Notification.permission === "granted") return true;
        const status = await Notification.requestPermission();
        return status === "granted";
    },

    send(title, body) {
        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: "/favicon.ico" });
        }
    },

    checkAll() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();

        if (hour === 23 && minute === 0) {
            this.send("Habit Tracker", "Time to log your habits for the day!");
        }

        if (hour === 12 && minute === 0) {
            this.send("Daily Events", "Check your calendar for today's events!");
        }

        const allData = JSON.parse(localStorage.getItem('tasks')) || {};
        Object.values(allData).forEach(category => {
            Object.values(category).forEach(board => {
                if (board.tasks) {
                    board.tasks.forEach(task => {
                        if (!task.deadline || task.completed) return;

                        const deadline = new Date(task.deadline);
                        const diffMs = deadline - now;
                        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

                        if (diffHrs === 24 && minute === 0) {
                            this.send("Task Due in 24h", `Reminder: "${task.name}" is due tomorrow.`);
                        }
                        if (diffHrs === 12 && minute === 0) {
                            this.send("Task Due in 12h", `Urgent: "${task.name}" is due in 12 hours.`);
                        }
                    });
                }
            });
        });
    }
};

NotificationManager.requestPermission();
setInterval(() => NotificationManager.checkAll(), 360000);

class TODoList {
    constructor({ categoryList, boardTitle, addCategoryBtn }) {
        this.categoryList = categoryList;
        this.boardTitle = boardTitle;
        this.addCategoryBtn = addCategoryBtn;
        
        this.boardsContainer = document.getElementById('boardsContainer');
        this.kanbanView = document.getElementById('kanbanView');
        this.boardsList = document.getElementById('boardsList');
        
        this.currentCategory = null;
        this.currentBoardId = null;
        this.columns = {};

        this.init();
    }

    init() {
        const backBtn = document.getElementById('backToBoards');
        if(backBtn) backBtn.onclick = () => this.showDashboard();
        
        const catTitle = document.getElementById('categoryDisplayTitle'); 
        if (catTitle) {
            catTitle.addEventListener('blur', () => this.renameCategoryInline(catTitle));
            catTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); catTitle.blur(); }
            });
        }

        if (this.addCategoryBtn) {
            this.addCategoryBtn.onclick = () => this.addCategory();
        }

        this.categoryList.addEventListener('click', (e) => {
            const cat = e.target.closest('.category');
            if (cat && cat.id !== 'addCat') this.selectCategory(cat.dataset.name);
        });

        this.boardTitle.addEventListener('blur', () => this.saveTasksState());

        this.categoryList.addEventListener('click', (e) => {
            const cat = e.target.closest('.category');
            if (cat && cat.id !== 'addCat') this.selectCategory(cat.dataset.name);
        });

        document.getElementById('addNewBoardBtn').onclick = () => this.addNewBoard();
        
  
        this.loadCategories();
        const cats = JSON.parse(localStorage.getItem('categories')) || ["Daily Tasks"];

        const allData = this.getStorage();
            if (!allData[cats[0]]) {
                allData[cats[0]] = {};
                this.setStorage(allData);
            }

        this.selectCategory(cats[0]);

        const displayTitle = document.getElementById('categoryDisplayTitle');
            if (displayTitle) {
                displayTitle.addEventListener('blur', () => this.renameCategoryInline(displayTitle));
                displayTitle.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        displayTitle.blur();
                    }
                });
            }
    }

    showDashboard() {
        this.kanbanView.classList.add('hidden');
        this.boardsContainer.classList.remove('hidden');
        this.loadBoardsGrid();
    }

    showKanban(boardId) {
        this.currentBoardId = boardId;
        const allData = this.getStorage();
        const boardData = allData[this.currentCategory][boardId];
        
        this.boardTitle.textContent = boardData.name;
        this.boardsContainer.classList.add('hidden');
        this.kanbanView.classList.remove('hidden');
        this.loadTasks();
    }

    async addNewBoard() {
        if (!this.currentCategory) return;

        const name = await Modal.open("Create New Board", "", "Enter board name...");
        if (!name || name.trim().length === 0) {
            // if (name !== null) alert("Board name cannot be empty!"); 
            return; 
        } 
        
        const id = 'b-' + Date.now();
        const allData = this.getStorage();
        
        if (!allData[this.currentCategory]) allData[this.currentCategory] = {};
        
        allData[this.currentCategory][id] = {
            name: name,
            columns: [
                {id: 'todo', name: 'To Do'}, 
                {id: 'inprogress', name: 'In Progress'}, 
                {id: 'done', name: 'Done'}
            ],
            tasks: []
        };
        
        this.setStorage(allData);
        this.loadBoardsGrid();
    }

    loadBoardsGrid() {
        const addCard = document.getElementById('addNewBoardBtn');
        this.boardsList.innerHTML = '';
        this.boardsList.appendChild(addCard);

        const allData = this.getStorage();
        const categoryBoards = allData[this.currentCategory] || {};

        Object.entries(categoryBoards).forEach(([id, board]) => {
            const div = document.createElement('div');
            div.className = 'board-card';
            div.innerHTML = `
                <h3>${board.name}</h3>
                <div class="delete-board-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                    </svg>
                </div>
            `;
            
            div.onclick = () => this.showKanban(id);
            
            div.querySelector('.delete-board-btn').onclick = async (e) => {
                e.stopPropagation(); 
                await this.deleteBoard(id, board.name);
            };

            this.boardsList.insertBefore(div, addCard);
        });
    }

    async deleteBoard(boardId, boardName) {
        const confirmed = await ConfirmModal.open(
            "Delete Board", 
            `Are you sure you want to delete "${boardName}"? This will remove all lists and cards inside it.`
        );

        if (confirmed) {
            const allData = this.getStorage();
            if (allData[this.currentCategory]) {
                delete allData[this.currentCategory][boardId];
                this.setStorage(allData);
                this.loadBoardsGrid();
            }
        }
    }

    loadKanbanContent() {
        const container = document.getElementById('taskMain');
        const addBtn = container.querySelector('.addStateCondition');
        container.querySelectorAll('.stateCondition').forEach(el => el.remove());
        
        const board = this.getStorage()[this.currentCategory][this.currentBoardId];
        
        this.columns = {};
        board.columns.forEach(col => {
            this.renderColumnUI(col.id, col.name);
        });

        board.tasks.forEach(task => {
            this.createTaskUI(task);
        });
        
        this.setupDragAndDrop();
    }

    async addCategory() {
        const name = await Modal.open('Enter category name', '');
        if (!name || name.trim().length === 0) {
            return;
        }
        
        let categories = JSON.parse(localStorage.getItem('categories')) || ["Daily Tasks"];
        if (!categories.includes(name)) {
            categories.push(name);
            localStorage.setItem('categories', JSON.stringify(categories));
            this.loadCategories();
            this.selectCategory(name); 
        }
    }

    selectCategory(name) {
        this.currentCategory = name;
        
        const displayTitle = document.getElementById('categoryDisplayTitle');
        if (displayTitle) {
            displayTitle.innerText = name;
        }

        this.categoryList.querySelectorAll('.category').forEach(el => 
            el.classList.toggle('active', el.dataset.name === name));
        
        this.showDashboard();
    }

    handleCategoryClick(e) {
        const item = e.target.closest('.category');
        if (!item || item.id === 'addCat') return;
        this.selectCategory(item.dataset.name);
    }

    loadCategories() {
        const cats = JSON.parse(localStorage.getItem('categories')) || ["Daily Tasks"];
        this.categoryList.querySelectorAll('.category').forEach(el => {
            if(el.id !== 'addCat') el.remove();
        });
        cats.forEach(c => this.createCategoryUI(c));
    }

    createCategoryUI(name) {
        const li = document.createElement('li');
        li.className = 'category';
        li.dataset.name = name;
        li.innerHTML = `
            <span>${name}</span>
            <span class="deleteCat">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                </svg>
            </span>
        `;

        li.querySelector('.deleteCat').onclick = (e) => {
            e.stopPropagation(); 
            this.deleteCategory(name, li);
        };

        this.categoryList.insertBefore(li, this.categoryList.querySelector('.add'));
    }

    enableCategoryEdit() {
        const editBtn = document.querySelector('.editCat');
        if (editBtn) editBtn.onclick = () => this.renameCategory();
    }

    async renameCategory() {
        if (!this.currentCategory || this.currentCategory === "Select Category") return;

        const oldName = this.currentCategory;
        const newName = await Modal.open('Rename Category', oldName);

        if (newName && newName !== oldName) {
            let categories = JSON.parse(localStorage.getItem('categories')) || [];
            const index = categories.indexOf(oldName);
            if (index !== -1) categories[index] = newName;
            localStorage.setItem('categories', JSON.stringify(categories));

            const tasks = JSON.parse(localStorage.getItem('tasks')) || {};
            if (tasks[oldName]) {
                tasks[newName] = tasks[oldName];
                delete tasks[oldName];
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }

            this.selectCategory(newName);
            this.loadCategories(); 
        }
    }

    renameCategoryInline(element) {
        const newName = element.innerText.trim();
        const oldName = this.currentCategory;

        if (!newName || newName === oldName) {
            element.innerText = oldName;
            return;
        }

        let categories = JSON.parse(localStorage.getItem('categories')) || [];
        if (categories.includes(newName)) {
            alert("Category already exists");
            element.innerText = oldName;
            return;
        }
        const idx = categories.indexOf(oldName);
        if (idx !== -1) categories[idx] = newName;
        localStorage.setItem('categories', JSON.stringify(categories));

        const allData = this.getStorage();
        if (allData[oldName]) {
            allData[newName] = allData[oldName];
            delete allData[oldName];
            this.setStorage(allData);
        }

        this.currentCategory = newName;
        this.loadCategories();
        this.selectCategory(newName);
    }

    async deleteCategory(name, element) {
        const confirmed = await ConfirmModal.open("Delete Category", `Permanently remove "${name}" and all its tasks?`);
        if (!confirmed) return;

        let categories = JSON.parse(localStorage.getItem('categories')) || [];
        categories = categories.filter(c => c !== name);
        localStorage.setItem('categories', JSON.stringify(categories));

        const tasks = JSON.parse(localStorage.getItem('tasks')) || {};
        delete tasks[name];
        localStorage.setItem('tasks', JSON.stringify(tasks));

        element.remove();
        this.init(); // Reset to first available category
    }

    renderColumnUI(statusId, statusName) {
        const container = document.getElementById('taskMain');
        const addButton = container.querySelector('.addStateCondition');

        const newCol = document.createElement('div');
        newCol.className = 'stateCondition';
        newCol.dataset.status = statusId;

        newCol.innerHTML = `
            <div class="taskCondition">${statusName}</div>
            <ul class="task-list" id="${statusId}-list"></ul>
            <div class="add-task-trigger" onclick="todo.addTask('${statusId}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0-1A6 6 0 1 0 8 2a6 6 0 0 0 0 12"/><path d="M8 4v8M4 8h8" stroke="currentColor" stroke-width="1"/>
                </svg>
            </div>
        `;

        container.insertBefore(newCol, addButton);
        this.columns[statusId] = newCol.querySelector('ul');
        this.makeHeaderEditable(newCol.querySelector('.taskCondition'));
    }

    async addNewColumnPrompt() {
        if (!this.currentCategory) return;
        const statusName = await Modal.open("New List Name", "", "Enter list title...");
        if (!statusName) return;

        const statusId = 'status-' + Date.now();
        this.renderColumnUI(statusId, statusName);
        this.setupDragAndDrop();
        this.saveTasksState(); 
    }

    makeHeaderEditable(headerElement) {
        headerElement.setAttribute('contenteditable', 'true');
        headerElement.setAttribute('spellcheck', 'false');

        let oldName = "";
        headerElement.addEventListener('focus', () => {
            oldName = headerElement.innerText.trim();
        });

        headerElement.addEventListener('blur', () => {
            const newName = headerElement.innerText.trim();
            
            if (!newName) {
                headerElement.innerText = oldName;
                return;
            }
            this.saveTasksState();

        });

        headerElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                headerElement.blur();
            }
        });
    }

    // removeColumn(){
        
    // }

    async addTask(status) {
        if (!this.currentCategory) {
            const cancelBtn = document.getElementById('confirmCancel');
            cancelBtn.style.display = 'none'; 
            await ConfirmModal.open("Selection Required", "Please select a category first!");
            cancelBtn.style.display = 'block'; 
            return;
        }        

        const result = await TaskModal.open({ name: "" });
        if (result && result.action === 'save') {
            const taskName = result.data.name ? result.data.name.trim() : "";
            
            if (!taskName) {
                // alert("Task name cannot be empty!");
                return;
            }

            this.createTask(taskName, false, status, result.data);
            this.saveTasksState();
        }
    }

    createTask(name, completed = false, status = 'todo', extraData = {}) {
        const li = document.createElement('li');
        li.className = `task ${completed ? 'completed' : ''}`;
        li.draggable = true;
        li.dataset.id = 't-' + Math.random().toString(36).substr(2, 9);
        li.taskData = { name, completed, status, ...extraData };

        let deadlineHTML = '';
        const daysLeft = this.getDaysRemaining(extraData.deadline);
        
        if (daysLeft !== null) {
            let colorClass = daysLeft < 0 ? 'overdue' : 
                            daysLeft === 0 ? 'due-today' : 
                            daysLeft <= 2 ? 'due-soon' : 'on-time';
            let text = daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Today' : `${daysLeft}d left`;
            deadlineHTML = `<span class="deadline-badge ${colorClass}">${text}</span>`;
        }

        li.innerHTML = `
            <div class="task-main">
                <input type="checkbox" class="task-checkbox" ${completed ? 'checked' : ''}>
                <span class="task-text">${name}</span>
            </div>
            <div class="task-right-side">${deadlineHTML}</div>
        `;

        const cb = li.querySelector('.task-checkbox');
        cb.onchange = (e) => {
            li.classList.toggle('completed', e.target.checked);
            li.taskData.completed = e.target.checked;
            this.saveTasksState();
        };

        li.onclick = async (e) => {
            if (e.target === cb) return;
            const result = await TaskModal.open(li.taskData);
            if (!result) return;

            if (result.action === 'delete') {
                li.remove();
            } else if (result.action === 'save') {
                const updatedName = result.data.name ? result.data.name.trim() : "";
                
                if (!updatedName) {
                    alert("Name cannot be empty");
                    return; 
                }

                li.taskData = { 
                    ...li.taskData, 
                    ...result.data, 
                    name: updatedName 
                };
                
                this.loadTasks(); 
            }
            this.saveTasksState();
        };

        if (this.columns[status]) {
            this.columns[status].appendChild(li);
        }
    }

    loadTasks() {
    const container = document.getElementById('taskMain');
    const addButton = container.querySelector('.addStateCondition');
    
    container.querySelectorAll('.stateCondition').forEach(el => el.remove());
    this.columns = {};

    const allData = this.getStorage();
    const boardData = allData[this.currentCategory]?.[this.currentBoardId];

    if (!boardData) return;

    boardData.columns.forEach(col => {
        this.renderColumnUI(col.id, col.name);
    });

    boardData.tasks.forEach(t => {
        if (this.columns[t.status]) {
            this.createTask(t.name, t.completed, t.status, t); 
        }
    });

    this.setupDragAndDrop();
}

    getDaysRemaining(deadline) {
        if (!deadline) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const target = new Date(deadline);
        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    saveTasksState() {
        if (!this.currentCategory || !this.currentBoardId) return;
        
        const allData = this.getStorage();
        let newBoardName = this.boardTitle.innerText.trim();
        
        if (!newBoardName) {
            this.boardTitle.innerText = allData[this.currentCategory][this.currentBoardId].name;
            return;
        }

        const columns = [];
        document.querySelectorAll('.stateCondition').forEach(col => {
            columns.push({
                id: col.dataset.status,
                name: col.querySelector('.taskCondition').innerText.trim()
            });
        });

        const tasks = [];
        Object.keys(this.columns).forEach(status => {
            [...this.columns[status].children].forEach(li => {
                tasks.push(li.taskData);
            });
        });

        allData[this.currentCategory][this.currentBoardId] = {
            name: newBoardName,
            columns: columns,
            tasks: tasks
        };
        
        this.setStorage(allData);
    }

    setupDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                e.target.classList.add('dragging');
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task')) {
                e.target.classList.remove('dragging');
            }
        });

        Object.values(this.columns).forEach(list => {
            const container = list.closest('.stateCondition');
            container.ondragover = (e) => {
                e.preventDefault();
                container.classList.add('drag-over');
            };
            container.ondragleave = () => container.classList.remove('drag-over');
            container.ondrop = (e) => {
                e.preventDefault();
                container.classList.remove('drag-over');
                const id = e.dataTransfer.getData('text/plain');
                const task = document.querySelector(`[data-id="${id}"]`);
                if (task) {
                    list.appendChild(task);
                    task.taskData.status = container.dataset.status;
                    this.saveTasksState();
                }
            };
        });
    }

    getStorage() { return JSON.parse(localStorage.getItem('tasks')) || {}; }
    setStorage(data) { localStorage.setItem('tasks', JSON.stringify(data)); }
}


class Habit {
    constructor({ habits, addHabitBtn, filter, habitDailyFilter, habitWeeklyFilter, list, chart, rate }) {
        this.habits = habits; 
        this.addHabitBtn = addHabitBtn;
        this.filter = filter;
        this.habitDailyFilter = habitDailyFilter;
        this.habitWeeklyFilter = habitWeeklyFilter;
        this.listUI = list; 
        this.chartUI = chart;
        this.rateUI = rate;

        this.bindEvents();
    }

    bindEvents() {
        this.addHabitBtn.addEventListener('click', () => this.addHabit());
        this.habitDailyFilter.addEventListener('click', () => this.setFilter('Daily'));
        this.habitWeeklyFilter.addEventListener('click', () => this.setFilter('Weekly'));
        this.render();
    }
    
    setFilter(type) {
        this.filter = type;
        document.querySelectorAll('.mode-habit .mini-btn').forEach(btn => {
            btn.classList.toggle('active', btn.innerText === type);
        });
        this.render();    
    }

    async addHabit() {
        const name = await Modal.open("New Habit", '', "Ex: Drink Water");
        if (!name) return;
        const newHabit = {
            id: Date.now(),
            name: name,
            type: this.filter, 
            history: {}, 
            streak: 0
        };
        this.habits.push(newHabit);
        this.save();
        this.render();
    }

    toggleHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        const today = new Date().toISOString().split('T')[0];
        if (habit.history[today]) {
            delete habit.history[today];
        } else {
            habit.history[today] = true;
        }
        this.save();
        this.render();
    }

    async editHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        if (!habit) return;

        const newName = await Modal.open("Edit Habit Name", habit.name);

        if (newName && newName !== habit.name) {
            habit.name = newName;
            
            this.save();
            
            this.render();
        }
    }

    async deleteHabit(id) {
        const confirmed = await ConfirmModal.open("Delete Habit", "Are you sure you want to delete this habit?");
        if (!confirmed) return;

        this.habits = this.habits.filter(h => h.id !== id);
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
    }

    renderSidebar() {
        const items = this.listUI.querySelectorAll('.habit-item');
        items.forEach(item => item.remove());

        const filtered = this.habits.filter(h => h.type === this.filter);
        const today = new Date().toISOString().split('T')[0];

        filtered.forEach(habit => {
            const li = document.createElement('li');
            li.className = 'category habit-item'; 
            const isChecked = habit.history[today] ? 'checked' : '';
            
            li.innerHTML = `
                <div class="habit-info" style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" ${isChecked} onclick="habitManager.toggleHabit(${habit.id})">
                    <span class="habit-name-clickable" 
                        onclick="habitManager.editHabit(${habit.id})" 
                        style="cursor:pointer; flex: 1;">
                        ${habit.name}
                    </span>
                </div>
                <div class="habit-controls" style="display: flex; gap: 8px;">
                    <span class="deleteCat" onclick="habitManager.deleteHabit(${habit.id})" style="cursor:pointer;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                    </span>
                </div>
            `;
            
            const addBtnLi = this.addHabitBtn.closest('li');
            this.listUI.insertBefore(li, addBtnLi);
        });
    }


    renderMainChart() {
        if (!this.chartUI) return;
        this.chartUI.innerHTML = '';
        const todayStr = new Date().toISOString().split('T')[0];
        let todayPercent = 0;

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const totalHabits = this.habits.length;
            const completedCount = this.habits.filter(h => h.history && h.history[dateStr]).length;
            const percentage = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;
            if (dateStr === todayStr) todayPercent = Math.round(percentage);

            const barGroup = document.createElement('div');
            barGroup.className = 'chart-bar-group';
            barGroup.innerHTML = `
                <div class="bar-container">
                    <div class="bar-fill" style="height: ${percentage}%">
                        <span class="percentage-tooltip">${Math.round(percentage)}%</span>
                    </div>
                </div>
                <span class="bar-label">${date.toLocaleDateString('en', {weekday: 'short'})}</span>
            `;
            this.chartUI.appendChild(barGroup);
        }
        this.rateUI.innerText = `${todayPercent}%`;
    }

    render() {
        this.renderSidebar();
        this.renderMainChart();
    }
}

class Calendar {
    constructor(date, prevMonth, nextMonth, toggleMonth, toggleWeek, view, events, grid, title, sidebarList){
        this.date = date; 
        this.prevMonth = prevMonth;
        this.nextMonth = nextMonth;
        this.toggleMonth = toggleMonth;
        this.toggleWeek = toggleWeek;
        this.view = view;
        this.events = events;
        this.grid = grid;
        this.title = title;
        this.sidebarList = sidebarList;
        this.bindEvents();
    }

    bindEvents(){
        this.prevMonth.addEventListener('click', () => this.navigate(-1) );
        this.nextMonth.addEventListener('click', () => this.navigate(1) );
        this.toggleMonth.addEventListener('click', (e) => this.switchView('month', e.target));
        this.toggleWeek.addEventListener('click', (e) => this.switchView('week', e.target));
        this.render();
    }

    switchView(mode, btn) {
        this.view = mode;
        document.querySelectorAll('.mini-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.render();
    }

    navigate(dir) {
        if (this.view === 'month') {
            this.date.setMonth(this.date.getMonth() + dir);
        } else {
            this.date.setDate(this.date.getDate() + (dir * 7));
        }
        this.render();
    }

    render() {
        this.grid.innerHTML = '';
        const year = this.date.getFullYear();
        const month = this.date.getMonth();
        if (this.view === 'month') {
            this.title.textContent = this.date.toLocaleDateString('en', { month: 'long', year: 'numeric' });
            this.renderMonth(year, month);
        } else {
            this.title.textContent = `Week of ${this.date.toLocaleDateString()}`;
            this.renderWeek();
        }
        this.renderSidebarEvents();
    }

    renderMonth(year, month) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < firstDay; i++) this.grid.appendChild(document.createElement('div'));
        for (let day = 1; day <= daysInMonth; day++) this.createDay(`${year}-${month + 1}-${day}`, day);
    }

    renderWeek() {
        let tempDate = new Date(this.date);
        tempDate.setDate(tempDate.getDate() - tempDate.getDay());
        for (let i = 0; i < 7; i++) {
            const dateKey = `${tempDate.getFullYear()}-${tempDate.getMonth() + 1}-${tempDate.getDate()}`;
            this.createDay(dateKey, tempDate.getDate());
            tempDate.setDate(tempDate.getDate() + 1);
        }
    }

    createDay(dateKey, label) {
        const cell = document.createElement('div');
        cell.className = 'day';
        cell.innerHTML = `<div class="day-number">${label}</div>`;
        (this.events[dateKey] || []).forEach(ev => {
            const p = document.createElement('div');
            p.className = 'event-pill';
            p.textContent = ev.title;
            p.onclick = (e) => { e.stopPropagation(); this.editEvent(dateKey, ev.id); };
            cell.appendChild(p);
        });
        cell.onclick = () => this.addEvent(dateKey);
        this.grid.appendChild(cell);
    }

    renderSidebarEvents() {
    this.sidebarList.innerHTML = '';
    const year = this.date.getFullYear();
    const month = this.date.getMonth();

    let datesToShow = [];

    if (this.view === 'month') {
        datesToShow = Object.keys(this.events).filter(dateKey => {
            const [y, m] = dateKey.split('-').map(Number);
            return y === year && m === (month + 1);
        });
    } else {
        let startOfWeek = new Date(this.date);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        
        let endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        datesToShow = Object.keys(this.events).filter(dateKey => {
            const eventDate = new Date(dateKey);
            return eventDate >= startOfWeek && eventDate <= endOfWeek;
        });
    }

    datesToShow.sort().forEach(date => {
        this.events[date].forEach(ev => {
            const li = document.createElement('li'); 
            li.innerHTML = `
                <div style="display: flex; flex-direction: column;">
                    <strong style="font-size: 0.8em; color: #888;">${date}</strong>
                    <span>${ev.title}</span>
                </div>
            `;
            this.sidebarList.appendChild(li);
        });
    });

    if (datesToShow.length === 0) {
        this.sidebarList.innerHTML = '<li class="category" style="color: #ccc; justify-content: center;">No events this ' + this.view + '</li>';
    }
}

    async addEvent(dateKey) {
        const title = await Modal.open('Enter Event Name', '', 'Meeting, Birthday...');
        if (!title) return;
        this.events[dateKey] = this.events[dateKey] || [];
        this.events[dateKey].push({ id: Date.now(), title });
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        this.render();
    }

    async editEvent(dateKey, id) {
        const ev = this.events[dateKey].find(e => e.id === id);
        const newTitle = await Modal.open('Edit Event', ev.title, 'Delete name to remove');
        
        if (newTitle === null) return; 
        
        if (newTitle === '') {
            this.events[dateKey] = this.events[dateKey].filter(e => e.id !== id);
        } else {
            ev.title = newTitle;
        }
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        this.render();
    }

    deleteEvent(dateKey, id) {
        if (!confirm("Delete this event?")) return;
        this.events[dateKey] = this.events[dateKey].filter(e => e.id !== id);
        if (this.events[dateKey].length === 0) delete this.events[dateKey];
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        this.render();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.todo = new TODoList({
        categoryList: document.querySelector('.mode-task ul'),
        boardTitle: document.getElementById('boardTitle'), // Add this
        addCategoryBtn: document.getElementById('addCat')
    });

    const savedHabits = JSON.parse(localStorage.getItem('habits')) || [];
    window.habitManager = new Habit({
        habits: savedHabits,
        addHabitBtn: document.getElementById('addHabit'),
        filter: 'Daily',
        habitDailyFilter: document.getElementById('habitDailyFilter'),
        habitWeeklyFilter: document.getElementById('habitWeeklyFilter'),
        list: document.getElementById('habitSidebarList'),
        chart: document.getElementById('habitChart'),
        rate: document.getElementById('completionRate')
    });

    const savedEvents = JSON.parse(localStorage.getItem('calendarEvents')) || {};
    const calendar = new Calendar(
        new Date(),
        document.getElementById('prevMonth'),
        document.getElementById('nextMonth'),
        document.getElementById('toggleMonth'),
        document.getElementById('toggleWeek'),
        'month',
        savedEvents,
        document.getElementById('calendarGrid'),
        document.getElementById('calendarTitle'),
        document.getElementById('eventSidebarList')
    );

    const modeButtons = document.querySelectorAll('.field');
    const modes = document.querySelectorAll('.mode');

    modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        
        // 1. UI Styling
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 2. Hide all sidebar modes
        modes.forEach(m => m.classList.add('hidden'));
        const activeSidebar = document.querySelector(`.mode-${mode}`);
        if (activeSidebar) activeSidebar.classList.remove('hidden');

        // 3. Main Content Switching
        const isTask = mode === 'task';
        document.getElementById('habitView').classList.toggle('hidden', mode !== 'habit');
        document.getElementById('calendarView').classList.toggle('hidden', mode !== 'calendar');
        document.getElementById('taskHeader').classList.toggle('hidden', !isTask);

        if (isTask) {
            // Check if we were already inside a board
            if (todo.currentBoardId) {
                todo.kanbanView.classList.remove('hidden');
                todo.boardsContainer.classList.add('hidden');
                document.getElementById('taskMain').classList.remove('hidden');
                todo.loadTasks(); // <--- RE-INITIALIZE THE COLUMNS AND TASKS
            } else {
                todo.showDashboard();
            }
        } else {
            // Hide everything task-related
            todo.kanbanView.classList.add('hidden');
            todo.boardsContainer.classList.add('hidden');
            document.getElementById('taskMain').classList.add('hidden');
        }
    });
});
});
