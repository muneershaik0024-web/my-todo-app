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

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    updateWeekDatesUI();
    updateDashboardUI();
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
        const dateString = `${loopDate.getDate()}/${loopDate.getMonth() + 1}`;
        
        const dateElement = document.getElementById(`date-${day}`);
        if (dateElement) {
            dateElement.innerText = dateString;
        }
    });
}

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "") {
        alert("Please write something in the task box!");
        return;
    }

    const now = new Date();
    const timeStr = `${now.getDate()}/${now.getMonth() + 1} at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dayCreated = daysOfWeek[now.getDay()];

    const taskObj = { 
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
    li.innerHTML = `
        <div>
            <span>${taskObj.text}</span>
            <span class="task-time">⏰ ${taskObj.time} (${taskObj.day})</span>
        </div>
    `;

    if (taskObj.completed) {
        li.classList.add('completed');
    }

    li.addEventListener('click', function() {
        li.classList.toggle('completed');
        toggleTaskStatusInLocal(taskObj.text);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = "X";
    deleteBtn.classList.add('delete-btn');

    deleteBtn.onclick = function(e) {
        e.stopPropagation();
        taskList.removeChild(li);
        removeTaskFromLocal(taskObj.text);
    };

    li.appendChild(deleteBtn);
    taskList.appendChild(li);
}

function updateDashboardUI() {
    let progressData = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    
    tasks.forEach(task => {
        if (task.completed && progressData[task.day] !== undefined) {
            progressData[task.day] += 1;
        }
    });

    Object.keys(progressData).forEach(day => {
        const count = progressData[day];
        const barElement = document.getElementById(`bar-${day}`);
        const countElement = document.getElementById(`count-${day}`);
        
        if(barElement && countElement) {
            countElement.innerText = count;
            const calculatedHeight = Math.min(count * 15, 60);
            barElement.style.height = `${calculatedHeight}px`;
        }
    });
}

function filterAndSearchTasks() {
    const searchText = searchInput.value.toLowerCase();
    const listItems = taskList.querySelectorAll('li');

    listItems.forEach(li => {
        const taskText = li.querySelector('span').innerText.toLowerCase();
        const isCompleted = li.classList.contains('completed');
        const matchesSearch = taskText.includes(searchText);

        let matchesFilter = false;
        if (currentFilter === 'all') matchesFilter = true;
        else if (currentFilter === 'completed' && isCompleted) matchesFilter = true;
        else if (currentFilter === 'active' && !isCompleted) matchesFilter = true;

        if (matchesSearch && matchesFilter) li.style.display = 'flex';
        else li.style.display = 'none';
    });
}

function saveTaskToLocal(taskObj) {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    tasks.push(taskObj);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    tasks.forEach(taskObj => createTaskElement(taskObj));
    filterAndSearchTasks();
}

function toggleTaskStatusInLocal(taskText) {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    tasks = tasks.map(task => {
        if (task.text === taskText) {
            task.completed = !task.completed;
        }
        return task;
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    updateDashboardUI();
    filterAndSearchTasks();
}

function removeTaskFromLocal(taskTextToRemove) {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    tasks = tasks.filter(task => task.text !== taskTextToRemove);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateDashboardUI();
}

filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelector('.filter-btn.active').classList.remove('active');
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-filter');
        filterAndSearchTasks();
    });
});

searchInput.addEventListener('input', filterAndSearchTasks);

clearAllBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all tasks?")) {
        taskList.innerHTML = "";
        localStorage.removeItem('tasks');
        updateDashboardUI();
    }
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    if (document.body.classList.contains('dark-theme')) {
        themeToggle.innerText = "☀️ Light Mode";
        localStorage.setItem('darkMode', 'enabled');
    } else {
        themeToggle.innerText = "🌙 Dark Mode";
        localStorage.setItem('darkMode', 'disabled');
    }
});

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});
