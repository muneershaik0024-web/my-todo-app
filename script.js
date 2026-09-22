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
    
    // FIX 2: Mobile vertical browser pull-to-refresh pull up block logic
    taskList.addEventListener('touchmove', function(e) {
        if (taskList.scrollTop > 0 && taskList.scrollTop < (taskList.scrollHeight - taskList.clientHeight)) {
            e.stopPropagation(); // List ke andar rehne par touch page level par nahi jayega
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

    const taskObj = { 
        id: taskId,
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

    if (taskObj.completed) {
        li.classList.add('completed');
    }

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

// FIX 1: DUAL CHANNEL MEMORY BACKEND ARCHITECTURE
function updateDashboardUI() {
    let progressData = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    
    // Memory Channel 2 (Permanent Analytics Logs load karna)
    let history = localStorage.getItem('completedHistory') ? JSON.parse(localStorage.getItem('completedHistory')) : [];
    
    history.forEach(log => {
        if (progressData[log.day] !== undefined) {
            progressData[log.day] += 1;
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

function toggleTaskStatusInLocal(targetId, day) {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    let history = localStorage.getItem('completedHistory') ? JSON.parse(localStorage.getItem('completedHistory')) : [];
    
    tasks = tasks.map(task => {
        if (task.id === targetId) {
            task.completed = !task.completed;
            
            if (task.completed) {
                // Agar task complete hua toh permanent history channel mein save karein
                history.push({ id: targetId, day: day });
            } else {
                // Agar unstrike kiya toh history channel se remove karein
                history = history.filter(log => log.id !== targetId);
            }
        }
        return task;
    });
    
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('completedHistory', JSON.stringify(history));
    updateDashboardUI();
    filterAndSearchTasks();
}

function removeTaskFromLocal(targetId) {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    tasks = tasks.filter(task => task.id !== targetId);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Note: User agar specific task manual delete karega tabhi graph se minus hoga, clear-all par nahi!
    let history = localStorage.getItem('completedHistory') ? JSON.parse(localStorage.getItem('completedHistory')) : [];
    history = history.filter(log => log.id !== targetId);
    localStorage.setItem('completedHistory', JSON.stringify(history));
    
    updateDashboardUI();
}

// FIX 1 OPTIMIZATION: CLEAR BUTTON SE SIRF ACTIVE LIST UDEGI, GRAPH KA PERMANENT RECORD NAHI
clearAllBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear your current tasks list? (Your weekly analytics graph will remain saved! 📈)")) {
        taskList.innerHTML = "";
        localStorage.removeItem('tasks'); // Current tasks saaf
        filterAndSearchTasks();
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
