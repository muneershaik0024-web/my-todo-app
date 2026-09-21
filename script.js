const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const clearAllBtn = document.getElementById('clearAllBtn');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const timelineHistory = document.getElementById('timelineHistory');
let currentFilter = 'all';

const dashboardDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    updateWeekDatesUI();
    updateDashboardUI();
    updateVerticalTimeline(); // Normal dynamic timeline load karna
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
    const taskId = Date.now().toString();
    const timeStr = `${now.getDate()} ${months[now.getMonth()]} at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dayCreated = daysOfWeek[now.getDay()];
    const dateKey = `${now.getDate()} ${months[now.getMonth()]}`;

    const taskObj = { 
        id: taskId,
        text: taskText, 
        completed: false, 
        time: timeStr,
        day: dayCreated,
        dateKey: dateKey
    };

    createTaskElement(taskObj);
    saveTaskToLocal(taskObj);
    taskInput.value = "";
    filterAndSearchTasks();
}

function createTaskElement(taskObj) {
    const li = document.createElement('li');
    li.setAttribute('data-id', taskObj.id || taskObj.text);
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
        toggleTaskStatusInLocal(taskObj.id || taskObj.text);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = "X";
    deleteBtn.classList.add('delete-btn');

    deleteBtn.onclick = function(e) {
        e.stopPropagation();
        taskList.removeChild(li);
        removeTaskFromLocal(taskObj.id || taskObj.text);
    };

    li.appendChild(deleteBtn);
    taskList.appendChild(li);
}

// NORMAL DYNAMIC TIMELINE FUNCTION
function updateVerticalTimeline() {
    if (!timelineHistory) return;
    timelineHistory.innerHTML = "";

    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    
    // Sirf completed tasks ko date-wise group karna
    let groupedHistory = {};
    tasks.forEach(task => {
        if (task.completed) {
            let key = task.dateKey;
            if(!key && task.time) {
                key = task.time.split(' at ')[0];
            }
            if(!key) key = "Completed Tasks";

            if (!groupedHistory[key]) {
                groupedHistory[key] = 0;
            }
            groupedHistory[key]++;
        }
    });

    const dateKeys = Object.keys(groupedHistory);
    if (dateKeys.length === 0) {
        timelineHistory.innerHTML = `<p style="font-size: 13px; color: #777; font-style: italic;">No completed tasks yet. Clear topics to update history! 🎯</p>`;
        return;
    }

    // Normal history log list items show karna
    dateKeys.forEach(dateKey => {
        const count = groupedHistory[dateKey];
        const item = document.createElement('div');
        item.classList.add('timeline-item');
        
        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-date">📅 ${dateKey}</div>
            <div class="timeline-content">🎉 Cleared <strong>${count}</strong> concept${count > 1 ? 's' : ''}! Awesome Consistency!</div>
        `;
        timelineHistory.appendChild(item);
    });
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
    taskList.innerHTML = "";
    tasks.forEach(taskObj => createTaskElement(taskObj));
    filterAndSearchTasks();
}

function toggleTaskStatusInLocal(targetId) {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    
    tasks = tasks.map(task => {
        const matchCondition = task.id ? (task.id === targetId) : (task.text === targetId);
        if (matchCondition) {
            task.completed = !task.completed;
        }
        return task;
    });
    
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateDashboardUI();
    updateVerticalTimeline(); // Live normal timeline update
    filterAndSearchTasks();
}

function removeTaskFromLocal(targetId) {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    tasks = tasks.filter(task => task.id ? (task.id !== targetId) : (task.text !== targetId));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateDashboardUI();
    updateVerticalTimeline();
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
        updateVerticalTimeline();
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
