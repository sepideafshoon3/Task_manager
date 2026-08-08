// class User {
//     constructor({
//         userName,
//         password,
//         loginBtn,
//     }) {
//         this.userName = userName;
//         this.password = password;
//         this.loginBtn = loginBtn;

//         this.bindEvents();
//     }

//     bindEvents(){
//         this.loginBtn.addEventListener('click', () => this.login());
//     }

//     login(userName, password) {
//         if (username === "user" && password === "") {
//             window.location.href = "index.html"; 
//         } else {
//             alert("Invalid username or password");
//         };
//     };
// }

class TODoList {
    constructor({
        categoryList,
        activeCategory,
        addCategoryBtn,
        taskInput,
        addTaskBtn,
        taskList
    }) {
        this.categoryList = categoryList;
        this.activeCategory = activeCategory;
        this.addCategoryBtn = addCategoryBtn;
        this.taskInput = taskInput;
        this.addTaskBtn = addTaskBtn;
        this.taskList = taskList;

        this.currentCategory = null;

        this.bindEvents();
        this.loadCategories();
        this.enableCategoryEdit();


    }

    bindEvents() {
        this.addCategoryBtn.addEventListener('click', () => this.addCategory());
        this.categoryList.addEventListener('click', (e) => this.handleCategoryClick(e));
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskList.addEventListener('click', (e) => this.toggleTask(e));
        this.taskList.addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN') {
            this.editTask(e.target);
        }
    });

    }
    // cat

    addCategory() {
        const name = prompt('Enter category name');
        if (!name) return;

        this.createCategory(name);
        this.saveCategory(name);
    }

    createCategory(name) {
        const li = document.createElement('li');
        li.className = 'category';
        li.dataset.name = name;

        li.innerHTML = `
            <span>${name}</span>
            <span class="deleteCat"><svg class="deleteCat" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg></span>
        `;

        this.categoryList.insertBefore(li, this.addCategoryBtn.parentElement);
    }

    handleCategoryClick(e) {
        const categoryItem = e.target.closest('.category');
        if (!categoryItem) return;

        if (e.target.classList.contains('deleteCat')) {
            const name = categoryItem.dataset.name;

            this.deleteCategory(name);
            categoryItem.remove();

            if (this.currentCategory === name) {
                this.goToDefaultCategory();
            }

            return;
        }

        

        this.currentCategory = categoryItem.dataset.name;
        this.activeCategory.textContent = this.currentCategory;
        this.loadTasks();
    }

    saveCategory(name) {
        const categories = JSON.parse(localStorage.getItem('categories')) || [];
        categories.push(name);
        localStorage.setItem('categories', JSON.stringify(categories));
    }

    loadCategories() {
        const categories = JSON.parse(localStorage.getItem('categories')) || [];
        categories.forEach(cat => this.createCategory(cat));
    }

    deleteCategory(name) {
        const categories = JSON.parse(localStorage.getItem('categories')) || [];
        localStorage.setItem(
            'categories',
            JSON.stringify(categories.filter(c => c !== name))
        );

        const tasks = JSON.parse(localStorage.getItem('tasks')) || {};
        delete tasks[name];
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    enableCategoryEdit() {
        const editBtn = document.querySelector('.editCat');
        const title = this.activeCategory;

        const startEdit = () => {
            if (!this.currentCategory) return;

            const input = document.createElement('input');
            input.type = 'text';
            input.value = this.currentCategory;
            input.className = 'category-edit-input';

            title.replaceWith(input);
            input.focus();

            input.addEventListener('blur', () => {
                const newName = input.value.trim();

                if (!newName) {
                    input.replaceWith(title);
                    return;
                }

                this.renameCategory(this.currentCategory, newName);
                title.textContent = newName;
                input.replaceWith(title);
            });
        };

        editBtn.addEventListener('click', startEdit);
        title.addEventListener('click', startEdit);
    }

    goToDefaultCategory() {
        const defaultCat = 'Daily Tasks';
        this.currentCategory = defaultCat;
        this.activeCategory.textContent = defaultCat;
        this.loadTasks();
    }


    renameCategory(oldName, newName) {
        this.activeCategory.textContent = newName;

        const item = this.categoryList.querySelector(
            `[data-name="${oldName}"]`
        );
        if (item) {
            item.dataset.name = newName;
            item.querySelector('span').textContent = newName;
        }

        let categories = JSON.parse(localStorage.getItem('categories')) || [];
        categories = categories.map(c => c === oldName ? newName : c);
        localStorage.setItem('categories', JSON.stringify(categories));

        const tasks = JSON.parse(localStorage.getItem('tasks')) || {};
        if (tasks[oldName]) {
            tasks[newName] = tasks[oldName];
            delete tasks[oldName];
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }

        this.currentCategory = newName;
    }



// task
    addTask() {
        if (!this.currentCategory) {
            alert('Select a category first');
            return;
        }

        const name = this.taskInput.value.trim();
        if (!name) return;

        this.createTask(name);
        this.saveTask(name);
        this.taskInput.value = '';
    }

    createTask(name, completed = false) {
        const li = document.createElement('li');
        li.className = `task ${completed ? 'completed' : ''}`;

        li.innerHTML = `
            <input type="checkbox" ${completed ? 'checked' : ''}>
            <span>${name}</span>
        `;

        this.taskList.appendChild(li);
    }

    toggleTask(e) {
        if (e.target.type !== 'checkbox') return;

        const li = e.target.closest('.task');
        li.classList.toggle('completed');
        this.saveTasksState();
    }

    saveTask(name) {
        const data = JSON.parse(localStorage.getItem('tasks')) || {};
        data[this.currentCategory] = data[this.currentCategory] || [];
        data[this.currentCategory].push({ name, completed: false });
        localStorage.setItem('tasks', JSON.stringify(data));
    }

    loadTasks() {
        this.taskList.innerHTML = '';

        const data = JSON.parse(localStorage.getItem('tasks')) || {};
        const tasks = data[this.currentCategory] || [];

        tasks.forEach(t => this.createTask(t.name, t.completed));
    }

    saveTasksState() {
        const data = JSON.parse(localStorage.getItem('tasks')) || {};
        data[this.currentCategory] = [...this.taskList.children].map(li => ({
            name: li.querySelector('span').textContent,
            completed: li.classList.contains('completed')
        }));
        localStorage.setItem('tasks', JSON.stringify(data));
    }

    editTask(span) {
        const li = span.closest('.task');
        const oldText = span.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = oldText;

        li.replaceChild(input, span);
        input.focus();

        input.addEventListener('blur', () => {
            const newText = input.value.trim();

            if (newText === '') {
                li.remove();
            } else {
                span.textContent = newText;
                li.replaceChild(span, input);
            }

            this.saveTasksState();
        });
    }

}

class HabitManager {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('habits')) || [];
        this.filter = 'Daily'; 

        this.listUI = document.getElementById('habitSidebarList');
        this.chartUI = document.getElementById('habitChart');
        
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('addHabitBtn').onclick = () => this.addHabit();
        document.getElementById('habitDailyFilter').onclick = () => this.setFilter('Daily');
        document.getElementById('habitWeeklyFilter').onclick = () => this.setFilter('Weekly');
        this.render();
    }

    setFilter(type) {
        this.filter = type;
        document.querySelectorAll('.mode-habit .mini-btn').forEach(btn => 
            btn.classList.toggle('active', btn.innerText === type));
        this.render();
    }

    addHabit() {
        const name = prompt("Habit Name:");
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

    deleteHabit(id) {
        if (!confirm("Delete this habit?")) return;
        this.habits = this.habits.filter(h => h.id !== id);
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
    }

    render() {
        this.renderSidebar();
        this.renderMainChart();
    }

    renderSidebar() {
        this.listUI.innerHTML = '';
        const filtered = this.habits.filter(h => h.type === this.filter);
        const today = new Date().toISOString().split('T')[0];

        filtered.forEach(habit => {
            const li = document.createElement('li');
            li.className = 'habit-item';
            const isChecked = habit.history[today] ? 'checked' : '';
            
            li.innerHTML = `
                <div class="habit-info">
                    <input type="checkbox" ${isChecked} onclick="habitManager.toggleHabit(${habit.id})">
                    <span>${habit.name}</span>
                </div>
                <button class="del-habit" onclick="habitManager.deleteHabit(${habit.id})">×</button>
            `;
            this.listUI.appendChild(li);
        });
    }

    renderMainChart() {
        const chartUI = document.getElementById('habitChart');
        const rateUI = document.getElementById('completionRate');
        if (!chartUI) return;

        chartUI.innerHTML = '';
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
            chartUI.appendChild(barGroup);
        }
        
        rateUI.innerText = `${todayPercent}%`;
    }
}


class Calendar {
    constructor() {
        this.date = new Date();
        this.view = 'month'; 
        this.events = JSON.parse(localStorage.getItem('calendarEvents')) || {};
        
        this.grid = document.getElementById('calendarGrid');
        this.title = document.getElementById('calendarTitle');
        this.sidebarList = document.getElementById('eventSidebarList');

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('prevMonth').onclick = () => this.navigate(-1);
        document.getElementById('nextMonth').onclick = () => this.navigate(1);
        
        document.getElementById('toggleMonth').onclick = (e) => this.switchView('month', e.target);
        document.getElementById('toggleWeek').onclick = (e) => this.switchView('week', e.target);

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
        Object.keys(this.events).sort().forEach(date => {
            this.events[date].forEach(ev => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${date}</strong><br>${ev.title}`;
                this.sidebarList.appendChild(li);
            });
        });
    }

    addEvent(dateKey) {
        const title = prompt('Enter Event Name:');
        if (!title) return;
        this.events[dateKey] = this.events[dateKey] || [];
        this.events[dateKey].push({ id: Date.now(), title });
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        this.render();
    }

    editEvent(dateKey, id) {
        const ev = this.events[dateKey].find(e => e.id === id);
        const newTitle = prompt('Edit Event (Delete if empty):', ev.title);
        if (newTitle === null) return;
        if (newTitle === '') {
            this.events[dateKey] = this.events[dateKey].filter(e => e.id !== id);
        } else {
            ev.title = newTitle;
        }
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        this.render();
    }
}



let habitManager;
document.addEventListener('DOMContentLoaded', () => {
    new TODoList({
        categoryList: document.querySelector('.bar ul'),
        activeCategory: document.querySelector('.category_name'),
        addCategoryBtn: document.querySelector('#addCat'),
        taskInput: document.querySelector('.newTaskName'),
        addTaskBtn: document.querySelector('#addTaskBtn'),
        taskList: document.querySelector('.task-list')
    });
    new Calendar(); 
    habitManager = new HabitManager();
});

const modeButtons = document.querySelectorAll('.field');
const modes = document.querySelectorAll('.mode');


modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        modes.forEach(m => m.classList.add('hidden'));
        const activeSidebarMode = document.querySelector(`.mode-${mode}`);
        if (activeSidebarMode) activeSidebarMode.classList.remove('hidden');

        const taskHeader = document.getElementById('taskHeader');
        const taskMain = document.getElementById('taskMain');
        const calendarView = document.getElementById('calendarView');

        if (mode === 'calendar') {
            calendarView.classList.remove('hidden');
            taskHeader.classList.add('hidden');
            taskMain.classList.add('hidden');
            document.getElementById('habitView').classList.add('hidden');
        } else if (mode === 'task') {
            calendarView.classList.add('hidden');
            taskHeader.classList.remove('hidden');
            taskMain.classList.remove('hidden');
            document.getElementById('habitView').classList.add('hidden');
        } else if (mode === 'habit') {
            calendarView.classList.add('hidden');
            taskHeader.classList.add('hidden');
            taskMain.classList.add('hidden');
            document.getElementById('habitView').classList.remove('hidden');
        }
    });
});

