const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const clearAllBtn = document.getElementById('clearAllBtn');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
let currentFilter = 'all';

const dashboardDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    updateWeekDatesUI();
    updateDashboardUI();
    
    taskList.addEventListener('touchmove', function(e) {
        if (taskList.scrollTop > 0 && taskList.scrollTop < (taskList.scrollHeight - taskList.clientHeight)) {
            e.stopPropagation();
        }
    }, { passive: true });

    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-theme');
        themeToggle.innerText = "☀️ Light Mode";
    }
});

function updateWeekDatesUI() {
    const today = new Date();
    const currentDayIndex = today.getDay();
    const distanceToMonday = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() + distanceToMonday);

    dashboardDays.forEach((day, index) => {
        const loopDate = new Date(mondayDate);
        loopDate.setDate(mondayDate.getDate() + index);
        const dateString = `${loopDate.getDate()} ${months[loopDate.getMonth()]}`;
        const dateElement = document.getElementById(`date-${day}`);
        if (dateElement) dateElement.innerText = dateString;
    });
}

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "") return;

    const now = new Date();
    const timeStr = `${now.getDate()} ${months[now.getMonth()]} at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dayCreated = daysOfWeek[now.getDay()];

    const taskObj = { 
        id: Date.now().toString(),
        text: taskText, 
        completed: false, 
        time: timeStr,
        day: dayCreated
    };

    createTaskElement(taskObj);
    saveTaskToLocal(taskObj);
    taskInput.value = "";
    filterAndSearchTasks();
}

function createTaskElement(taskObj) {
    const li = document.createElement('li');
    li.setAttribute('data-id', taskObj.id);
    li.innerHTML = `
        <div>
            <span>${taskObj.text}</span>
            <span class="task-time">⏰ ${taskObj.time} (${taskObj.day})</span>
        </div>
    `;

    if (taskObj.completed) li.classList.add('completed');

    li.addEventListener('click', function() {
        li.classList.toggle('completed');
        toggleTaskStatusInLocal(taskObj.id, taskObj.day);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = "X";
    deleteBtn.classList.add('delete-btn');
    deleteBtn.onclick = function(e) {
        e.stopPropagation();
        taskList.removeChild(li);
        removeTaskFromLocal(taskObj.id);
    };

    li.appendChild(deleteBtn);
    taskList.appendChild(li);
}

function updateDashboardUI() {
    let progressData = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    let history = localStorage.getItem('completedHistory') ? JSON.parse(localStorage.getItem('completedHistory')) : [];
    
    history.forEach(log => {
        if (progressData[log.day] !== undefined) progressData[log.day] += 1;
    });

    Object.keys(progressData).forEach(day => {
        const count = progressData[day];
        const barElement = document.getElementById(`bar-${day}`);
        const countElement = document.getElementById(`count-${day}`);
        if(barElement && countElement) {
            countElement.innerText = count;
            barElement.style.height = `${Math.min(count * 15, 60)}px`;
        }
    });
}

// Search and Filter Logics
function filterAndSearchTasks() {
    const searchText = searchInput.value.toLowerCase();
    taskList.querySelectorAll('li').forEach(li => {
        const taskText = li.querySelector('span').innerText.toLowerCase();
        const isCompleted = li.classList.contains('completed');
        const matchesSearch = taskText.includes(searchText);
        let matchesFilter = currentFilter === 'all' || (currentFilter === 'completed' && isCompleted) || (currentFilter === 'active' && !isCompleted);
        li.style.display = (matchesSearch && matchesFilter) ? 'flex' : 'none';
    });
}

function saveTaskToLocal(taskObj) {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    tasks.push(taskObj);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    taskList.innerHTML = "";
    tasks.forEach(taskObj => createTaskElement(taskObj));
    filterAndSearchTasks();
}

function toggleTaskStatusInLocal(targetId, day) {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    let history = localStorage.getItem('completedHistory') ? JSON.parse(localStorage.getItem('completedHistory')) : [];
    
    tasks = tasks.map(task => {
        if (task.id === targetId) {
            task.completed = !task.completed;
            if (task.completed) history.push({ id: targetId, day: day });
            else history = history.filter(log => log.id !== targetId);
        }
        return task;
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('completedHistory', JSON.stringify(history));
    updateDashboardUI();
}

function removeTaskFromLocal(targetId) {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    tasks = tasks.filter(task => task.id !== targetId);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    let history = localStorage.getItem('completedHistory') ? JSON.parse(localStorage.getItem('completedHistory')) : [];
    history = history.filter(log => log.id !== targetId);
    localStorage.setItem('completedHistory', JSON.stringify(history));
    updateDashboardUI();
}

clearAllBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear your current tasks list?")) {
        taskList.innerHTML = "";
        localStorage.removeItem('tasks');
        filterAndSearchTasks();
    }
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelector('.filter-btn.active').classList.remove('active');
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-filter');
        filterAndSearchTasks();
    });
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-theme') ? 'enabled' : 'disabled');
    themeToggle.innerText = document.body.classList.contains('dark-theme') ? "☀️ Light Mode" : "🌙 Dark Mode";
});
