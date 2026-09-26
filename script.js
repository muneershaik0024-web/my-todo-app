import { initializeApp } from "https://gstatic.com";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://gstatic.com";
import { getFirestore, doc, setDoc, getDoc } from "https://gstatic.com";

// 🔥 Your authenticated Firebase parameters from screenshot
const firebaseConfig = {
  apiKey: "AIzaSyBqCxS1nHfYDZyhVuqiU0ty9A6FonFFHhk",
  authDomain: "://firebaseapp.com",
  projectId: "my-pro-tracker-82de4",
  storageBucket: "://appspot.com",
  messagingSenderId: "166118917060",
  appId: "1:166118917060:web:1cc6ae4b25d6d4baa95f83"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM pointers
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authMessage = document.getElementById('authMessage');
const userBadge = document.getElementById('userBadge');

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const clearAllBtn = document.getElementById('clearAllBtn');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const routineCheckbox = document.getElementById('routineCheckbox');

let currentUser = null;
let userTasks = [];
let userHistory = [];
let currentFilter = 'all';

const dashboardDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// AUTH WATCHER STATE MONITORING
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        userBadge.innerText = `👤 ${user.email.split('@')[0]}`;
        
        await syncFromCloud();
        checkAndSmartRolloverTasks();
        updateWeekDatesUI();
        renderTasksUI();
        updateDashboardUI();
    } else {
        currentUser = null;
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
});

// SIGN UP ACTION
signupBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    if(!email || !password) {
        authMessage.innerText = "Please enter both Email and Password.";
        return;
    }
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        authMessage.style.color = "green";
        authMessage.innerText = "Account Created Successfully! Signing in...";
    } catch (err) {
        authMessage.style.color = "red";
        authMessage.innerText = err.message.replace("Firebase: ", "");
    }
});

// LOGIN ACTION
loginBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    if(!email || !password) {
        authMessage.innerText = "Please enter both Email and Password.";
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        authMessage.style.color = "red";
        authMessage.innerText = "Invalid credentials or user doesn't exist.";
    }
});

// LOGOUT ACTION
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        userTasks = [];
        userHistory = [];
        authEmail.value = "";
        authPassword.value = "";
        authMessage.innerText = "";
    });
});

async function syncToCloud() {
    if (!currentUser) return;
    await setDoc(doc(db, "users", currentUser.uid), {
        tasks: userTasks,
        history: userHistory,
        lastOpenedDate: localStorage.getItem('lastOpenedDate') || ""
    });
}

async function syncFromCloud() {
    if (!currentUser) return;
    const docSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (docSnap.exists()) {
        const data = docSnap.data();
        userTasks = data.tasks || [];
        userHistory = data.history || [];
        if(data.lastOpenedDate) localStorage.setItem('lastOpenedDate', data.lastOpenedDate);
    }
}

function checkAndSmartRolloverTasks() {
    const now = new Date();
    const todayStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const lastOpenedDate = localStorage.getItem('lastOpenedDate');

    if (!lastOpenedDate) {
        localStorage.setItem('lastOpenedDate', todayStr);
        return;
    }

    if (lastOpenedDate !== todayStr) {
        const timeStr = `${now.getDate()} ${months[now.getMonth()]} at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const dayCreated = daysOfWeek[now.getDay()];

        const routineTasksToKeep = userTasks.filter(task => task.isRoutine === true);
        userTasks = routineTasksToKeep.map(oldTask => ({
            id: (Date.now() + Math.random()).toString(),
            text: oldTask.text,
            completed: false,
            time: timeStr,
            day: dayCreated,
            isRoutine: true
        }));

        localStorage.setItem('lastOpenedDate', todayStr);
        syncToCloud();
    }
}

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
        day: dayCreated,
        isRoutine: routineCheckbox.checked
    };

    userTasks.push(taskObj);
    taskInput.value = "";
    routineCheckbox.checked = false;
    
    renderTasksUI();
    syncToCloud();
}

function renderTasksUI() {
    taskList.innerHTML = "";
    userTasks.forEach(taskObj => {
        const li = document.createElement('li');
        li.setAttribute('data-id', taskObj.id);
        const routineTag = taskObj.isRoutine ? ` <span style="font-size:10px; color:#007bff; background:rgba(0,123,255,0.1); padding:2px 5px; border-radius:4px; margin-left:5px;">🔄 Daily</span>` : '';
        
        li.innerHTML = `
            <div>
                <span>${taskObj.text}${routineTag}</span>
                <span class="task-time">⏰ ${taskObj.time} (${taskObj.day})</span>
            </div>
        `;

        if (taskObj.completed) li.classList.add('completed');

        li.addEventListener('click', () => {
            taskObj.completed = !taskObj.completed;
            if (taskObj.completed) {
                userHistory.push({ id: taskObj.id, day: taskObj.day });
            } else {
                userHistory = userHistory.filter(log => log.id !== taskObj.id);
            }
            renderTasksUI();
            updateDashboardUI();
            syncToCloud();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = "X";
        deleteBtn.classList.add('delete-btn');
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            userTasks = userTasks.filter(t => t.id !== taskObj.id);
            userHistory = userHistory.filter(log => log.id !== taskObj.id);
            renderTasksUI();
            updateDashboardUI();
            syncToCloud();
        };

        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
    filterAndSearchTasks();
}

function updateDashboardUI() {
    let progressData = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    userHistory.forEach(log => {
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

function filterAndSearchTasks() {
    const searchText = searchInput.value.toLowerCase();
    taskList.querySelectorAll('li').forEach(li => {
        const taskText = li.querySelector('span').innerText.toLowerCase();
        const isCompleted = li.classList.contains('completed');
        const matchesSearch = taskText.includes(searchText);
