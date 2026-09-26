const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const clearAllBtn = document.getElementById('clearAllBtn');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const routineCheckbox = document.getElementById('routineCheckbox');
let currentFilter = 'all';

const dashboardDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

document.addEventListener('DOMContentLoaded', () => {
    checkAndSmartRolloverTasks();
    loadTasks();
    updateWeekDatesUI(); // Dates load karne ka function
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

// BULLETPROOF DYNAMIC WEEK DATES CALCULATOR
function updateWeekDatesUI() {
    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 = Sun, 1 = Mon...
    
    // Monday se aaj ka gap nikalna
    const distanceToMonday = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;
    
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() + distanceToMonday);

    dashboardDays.forEach((day, index) => {
        const loopDate = new Date(mondayDate);
        loopDate.setDate(mondayDate.getDate() + index);
        
        // Dynamic Format: "21 Sep", "22 Sep" - Yeh hamesha 100% visible rahega!
        const dateString = `${loopDate.getDate()} ${months[loopDate.getMonth()]}`;
        
        const dateElement = document.getElementById(`date-${day}`);
        if (dateElement) {
            dateElement.innerText = dateString;
            // Style adjustment taaki text chhipe nahi
            dateElement.style.display = 'block';
            dateElement.style.fontSize = '10px';
            dateElement.style.opacity = '0.7';
            dateElement.style.margin = '2px 0';
        }
    });
}

function checkAndSmartRolloverTasks() {
    const now = new Date();
    const todayStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const lastOpenedDate = localStorage.getItem('lastOpenedDate');
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];

    if (!lastOpenedDate) {
        localStorage.setItem('lastOpenedDate', todayStr);
        return;
    }

    if (lastOpenedDate !== todayStr) {
        const timeStr = `${now.getDate()} ${months[now.getMonth()]} at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const dayCreated = daysOfWeek[now.getDay()];

        const routineTasksToKeep = tasks.filter(task => task.isRoutine === true);

        const freshRolledTasks = routineTasksToKeep.map(oldTask => {
            return {
                id: (Date.now() + Math.random()).toString(),
                text: oldTask.text,
                completed: false,
                time: timeStr,
                day: dayCreated,
                isRoutine: true
            };
        });

        localStorage.setItem('tasks', JSON.stringify(freshRolledTasks));
        localStorage.setItem('lastOpenedDate', todayStr);
    }
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
        day: dayCreated,
        isRoutine: routineCheckbox.checked
    };

    createTaskElement(taskObj);
    saveTaskToLocal(taskObj);
    
    taskInput.value = "";
    routineCheckbox.checked = false;
    filterAndSearchTasks();
}

function createTaskElement(taskObj) {
    const li = document.createElement('li');
    li.setAttribute('data-id', taskObj.id);
    
    const routineTag = taskObj.isRoutine ? ` <span style="font-size:10px; color:#007bff; background:rgba(0,123,255,0.1); padding:2px 5px; border-radius:4px; margin-left:5px;">🔄 Daily</span>` : '';
    
    li.innerHTML = `
        <div>
            <span>${taskObj.text}${routineTag}</span>
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

function updateDashboardUI() {
    let progressData = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
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

// LOCAL STORAGE HANDLERS
function saveTaskToLocal(taskObj) {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    tasks.push(taskObj);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    const now = new Date();
    const todayStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    localStorage.setItem('lastOpenedDate', todayStr);
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
                history.push({ id: targetId, day: day });
            } else {
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
    
    let history = localStorage.getItem('completedHistory') ? JSON.parse(localStorage.getItem('completedHistory')) : [];
    history = history.filter(log => log.id !== targetId);
    localStorage.setItem('completedHistory', JSON.stringify(history));
    
    updateDashboardUI();
}

clearAllBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear your current tasks list? (Your weekly analytics graph will remain saved! 📈)")) {
        taskList.innerHTML = "";
        localStorage.removeItem('tasks');
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
taskInput.addEventListener('keypress', (e) => {if (e.key === 'Enter') addTask();});