class PomodoroTimer {
    constructor() {
        this.currentMode = 'pomodoro';
        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = 45 * 60; // 45 minutes in seconds
        this.totalTime = 45 * 60;
        this.timer = null;
        this.tasks = [];
        this.currentTaskIndex = 0;
        this.selectedTaskId = null;
        this.autoSwitch = true; // Auto-switch between work and break
        this.soundEnabled = true; // Enable chime sounds
        this.animationsEnabled = true; // Enable background animations
        this.completionUpdateInterval = null;
        
        this.modes = {
            pomodoro: { time: 45 * 60, label: 'Pomodoro' },
            'short-break': { time: 15 * 60, label: 'Short Break' },
            'long-break': { time: 30 * 60, label: 'Long Break' }
        };
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.updateDisplay();
        this.updateCompletionInfo();
        this.startClock();
    }
    
    initializeElements() {
        this.timerDisplay = document.getElementById('timer');
        this.timerBtn = document.getElementById('timer-btn');
        this.modeBtns = document.querySelectorAll('.mode-btn');
        this.taskInput = document.getElementById('task-input');
        this.pomodoroCountDisplay = document.getElementById('pomodoro-count');
        this.pomodoroDecreaseBtn = document.getElementById('pomodoro-decrease');
        this.pomodoroIncreaseBtn = document.getElementById('pomodoro-increase');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.tasksList = document.getElementById('tasks-list');
        this.currentTaskNumber = document.getElementById('current-task-number');
        this.currentTaskName = document.getElementById('current-task-name');
        this.completionTime = document.getElementById('completion-time');
        this.totalCount = document.getElementById('total-count');
        
        // Settings elements
        this.settingsModal = document.getElementById('settings-modal');
        this.settingsBtn = document.getElementById('settings-btn');
        this.closeSettingsBtn = document.getElementById('close-settings');
        this.colorOptions = document.querySelectorAll('.color-option');
        this.autoSwitchCheckbox = document.getElementById('auto-switch');
        this.soundEnabledCheckbox = document.getElementById('sound-enabled');
        this.animationsEnabledCheckbox = document.getElementById('animations-enabled');
        
        // Timer duration controls
        this.pomodoroTimeDisplay = document.getElementById('pomodoro-time-display');
        this.shortBreakTimeDisplay = document.getElementById('short-break-time-display');
        this.longBreakTimeDisplay = document.getElementById('long-break-time-display');
        this.pomodoroDecreaseTimeBtn = document.getElementById('pomodoro-decrease-time');
        this.pomodoroIncreaseTimeBtn = document.getElementById('pomodoro-increase-time');
        this.shortBreakDecreaseTimeBtn = document.getElementById('short-break-decrease-time');
        this.shortBreakIncreaseTimeBtn = document.getElementById('short-break-increase-time');
        this.longBreakDecreaseTimeBtn = document.getElementById('long-break-decrease-time');
        this.longBreakIncreaseTimeBtn = document.getElementById('long-break-increase-time');
        
        // Task menu elements
        this.taskMenu = document.getElementById('task-menu');
        this.editPomodoroCountBtn = document.getElementById('edit-pomodoro-count');
        this.deleteTaskBtn = document.getElementById('delete-task');
        
        // Clock element
        this.currentTimeDisplay = document.getElementById('current-time');
    }
    
    bindEvents() {
        this.timerBtn.addEventListener('click', () => this.toggleTimer());
        
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });
        
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // Pomodoro counter controls
        this.pomodoroDecreaseBtn.addEventListener('click', () => this.adjustPomodoroCount(-1));
        this.pomodoroIncreaseBtn.addEventListener('click', () => this.adjustPomodoroCount(1));
        
        // Add task placeholder click
        document.querySelector('.add-task-placeholder').addEventListener('click', () => {
            this.taskInput.focus();
        });
        
        // Settings events
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.autoSwitchCheckbox.addEventListener('change', (e) => {
            this.autoSwitch = e.target.checked;
            this.saveSettings();
        });
        
        this.soundEnabledCheckbox.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            this.saveSettings();
        });
        
        this.animationsEnabledCheckbox.addEventListener('change', (e) => {
            this.animationsEnabled = e.target.checked;
            this.updateBackgroundAnimation();
            this.saveSettings();
        });
        
        // Timer duration event listeners
        this.pomodoroDecreaseTimeBtn.addEventListener('click', () => this.adjustTimerDuration('pomodoro', -5));
        this.pomodoroIncreaseTimeBtn.addEventListener('click', () => this.adjustTimerDuration('pomodoro', 5));
        this.shortBreakDecreaseTimeBtn.addEventListener('click', () => this.adjustTimerDuration('short-break', -5));
        this.shortBreakIncreaseTimeBtn.addEventListener('click', () => this.adjustTimerDuration('short-break', 5));
        this.longBreakDecreaseTimeBtn.addEventListener('click', () => this.adjustTimerDuration('long-break', -5));
        this.longBreakIncreaseTimeBtn.addEventListener('click', () => this.adjustTimerDuration('long-break', 5));
        
        // Color option events
        this.colorOptions.forEach(option => {
            option.addEventListener('click', () => this.changeBackgroundColor(option.dataset.color));
        });
        
        // Close settings when clicking outside
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });
        
        // Task menu events
        this.editPomodoroCountBtn.addEventListener('click', () => this.editTaskPomodoros());
        this.deleteTaskBtn.addEventListener('click', () => this.deleteTask());
        
        // Close task menu when clicking outside
        this.taskMenu.addEventListener('click', (e) => {
            if (e.target === this.taskMenu) {
                this.closeTaskMenu();
            }
        });
    }
    
    switchMode(mode) {
        if (this.isRunning) return;
        
        this.currentMode = mode;
        this.timeLeft = this.modes[mode].time;
        this.totalTime = this.modes[mode].time;
        
        this.modeBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        this.updateDisplay();
    }
    
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.isPaused = false;
        this.timerBtn.textContent = 'PAUSE';
        this.timerDisplay.classList.add('pulse');
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.completeTimer();
            }
        }, 1000);
        
        // Start updating completion time every minute
        this.startCompletionTimeUpdates();
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.isPaused = true;
        this.timerBtn.textContent = 'RESUME';
        this.timerDisplay.classList.remove('pulse');
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Stop completion time updates when paused
        this.stopCompletionTimeUpdates();
    }
    
    stopTimer() {
        this.isRunning = false;
        this.isPaused = false;
        this.timerBtn.textContent = 'START';
        this.timerDisplay.classList.remove('pulse');
        this.timeLeft = this.totalTime;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Stop completion time updates when stopped
        this.stopCompletionTimeUpdates();
        
        this.updateDisplay();
    }
    
    completeTimer() {
        this.stopTimer();
        
        // Play completion sound
        this.playCompletionSound();
        
        // If it was a pomodoro, increment current task pomodoro count
        if (this.currentMode === 'pomodoro' && this.tasks.length > 0) {
            this.incrementCurrentTaskPomodoros();
        }
        
        // Auto-switch between work and break if enabled
        if (this.autoSwitch) {
            const previousMode = this.currentMode;
            if (this.currentMode === 'pomodoro') {
                this.switchMode('short-break');
                // Play break start chime
                this.playBreakStartChime();
            } else if (this.currentMode === 'short-break') {
                this.switchMode('pomodoro');
                // Play break end chime
                this.playBreakEndChime();
            } else if (this.currentMode === 'long-break') {
                this.switchMode('pomodoro');
                // Play break end chime
                this.playBreakEndChime();
            }
        }
        
        // Show completion notification
        this.showNotification(`${this.modes[this.currentMode].label} completed!`);
    }
    
    incrementCurrentTaskPomodoros() {
        if (this.tasks.length === 0) return;
        
        const currentTask = this.tasks[this.currentTaskIndex];
        currentTask.completed++;
        
        // Update task display
        this.updateTaskDisplay(currentTask);
        
        // Move to next task if current is completed
        if (currentTask.completed >= currentTask.total) {
            this.moveToNextTask();
        }
        
        this.updateCurrentTaskDisplay();
        this.updateCompletionInfo();
    }
    
    moveToNextTask() {
        if (this.currentTaskIndex < this.tasks.length - 1) {
            this.currentTaskIndex++;
        } else {
            // All tasks completed, start over
            this.currentTaskIndex = 0;
        }
        this.updateCurrentTaskDisplay();
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    addTask() {
        const taskName = this.taskInput.value.trim();
        if (!taskName) return;
        
        const pomodoroCount = parseInt(this.pomodoroCountDisplay.textContent) || 1;
        
        const task = {
            id: Date.now(),
            name: taskName,
            total: pomodoroCount,
            completed: 0,
            createdAt: new Date()
        };
        
        this.tasks.push(task);
        this.taskInput.value = '';
        this.pomodoroCountDisplay.textContent = '1';
        
        this.renderTasks();
        this.updateCurrentTaskDisplay();
        this.updateCompletionInfo();
        
        // Remove example task if it exists
        const exampleTask = document.querySelector('.example-task');
        if (exampleTask) {
            exampleTask.remove();
        }
    }
    
    adjustPomodoroCount(change) {
        const currentCount = parseInt(this.pomodoroCountDisplay.textContent) || 1;
        const newCount = Math.max(1, Math.min(99, currentCount + change));
        this.pomodoroCountDisplay.textContent = newCount;
    }
    
    adjustTimerDuration(mode, change) {
        const currentMinutes = Math.floor(this.modes[mode].time / 60);
        const newMinutes = Math.max(1, Math.min(120, currentMinutes + change));
        this.modes[mode].time = newMinutes * 60;
        
        // Update display
        if (mode === 'pomodoro') {
            this.pomodoroTimeDisplay.textContent = newMinutes;
        } else if (mode === 'short-break') {
            this.shortBreakTimeDisplay.textContent = newMinutes;
        } else if (mode === 'long-break') {
            this.longBreakTimeDisplay.textContent = newMinutes;
        }
        
        // Update current timer if it matches the current mode
        if (this.currentMode === mode) {
            this.timeLeft = this.modes[mode].time;
            this.totalTime = this.modes[mode].time;
            this.updateDisplay();
        }
        
        // Update completion info
        this.updateCompletionInfo();
        
        // Save settings
        this.saveSettings();
    }
    
    renderTasks() {
        this.tasksList.innerHTML = '';
        
        this.tasks.forEach((task, index) => {
            const taskElement = this.createTaskElement(task, index);
            this.tasksList.appendChild(taskElement);
        });
    }
    
    createTaskElement(task, index) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        if (task.completed >= task.total) {
            taskDiv.classList.add('completed');
        }
        
        taskDiv.innerHTML = `
            <div class="task-content">
                <i class="fas fa-circle task-icon" data-task-id="${task.id}"></i>
                <span class="task-name">${task.name}</span>
            </div>
            <div class="task-stats">
                <span class="pomodoro-count">${task.completed}/${task.total}</span>
                <button class="task-menu-btn" data-task-id="${task.id}">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        `;
        
        // Bind events
        const taskIcon = taskDiv.querySelector('.task-icon');
        taskIcon.addEventListener('click', () => this.toggleTaskCompletion(task.id));
        
        const menuBtn = taskDiv.querySelector('.task-menu-btn');
        menuBtn.addEventListener('click', () => this.showTaskMenu(task.id));
        
        return taskDiv;
    }
    
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        if (task.completed < task.total) {
            task.completed++;
        } else {
            task.completed = 0;
        }
        
        this.renderTasks();
        this.updateCurrentTaskDisplay();
        this.updateCompletionInfo();
    }
    
    showTaskMenu(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        this.selectedTaskId = taskId;
        
        // Position the menu near the clicked button
        const menuBtn = document.querySelector(`[data-task-id="${taskId}"]`).closest('.task-item').querySelector('.task-menu-btn');
        const rect = menuBtn.getBoundingClientRect();
        
        const menuContent = this.taskMenu.querySelector('.task-menu-content');
        menuContent.style.top = `${rect.bottom + 5}px`;
        menuContent.style.left = `${rect.right - 180}px`; // Align right edge
        
        this.taskMenu.style.display = 'block';
    }
    
    closeTaskMenu() {
        this.taskMenu.style.display = 'none';
        this.selectedTaskId = null;
    }
    
    editTaskPomodoros() {
        if (!this.selectedTaskId) return;
        
        const task = this.tasks.find(t => t.id === this.selectedTaskId);
        if (!task) return;
        
        const newTotal = prompt(`Set pomodoro count for "${task.name}":`, task.total);
        if (newTotal !== null && !isNaN(newTotal) && newTotal > 0) {
            task.total = parseInt(newTotal);
            if (task.completed > task.total) {
                task.completed = task.total;
            }
            
            this.renderTasks();
            this.updateCurrentTaskDisplay();
            this.updateCompletionInfo();
        }
        
        this.closeTaskMenu();
    }
    
    deleteTask() {
        if (!this.selectedTaskId) return;
        
        const task = this.tasks.find(t => t.id === this.selectedTaskId);
        if (!task) return;
        
        // Remove the task from the array
        this.tasks = this.tasks.filter(t => t.id !== this.selectedTaskId);
        
        // Adjust current task index if needed
        const deletedIndex = this.tasks.findIndex(t => t.id === this.selectedTaskId);
        if (deletedIndex !== -1 && deletedIndex <= this.currentTaskIndex) {
            this.currentTaskIndex = Math.max(0, this.currentTaskIndex - 1);
        }
        
        // If we deleted the current task, move to the next one
        if (this.tasks.length > 0 && this.currentTaskIndex >= this.tasks.length) {
            this.currentTaskIndex = this.tasks.length - 1;
        }
        
        this.renderTasks();
        this.updateCurrentTaskDisplay();
        this.updateCompletionInfo();
        this.closeTaskMenu();
    }
    
    updateTaskDisplay(task) {
        const taskElements = document.querySelectorAll('.task-item');
        taskElements.forEach(element => {
            const taskId = element.querySelector('.task-icon').dataset.taskId;
            if (parseInt(taskId) === task.id) {
                const pomodoroCount = element.querySelector('.pomodoro-count');
                pomodoroCount.textContent = `${task.completed}/${task.total}`;
                
                if (task.completed >= task.total) {
                    element.classList.add('completed');
                }
            }
        });
    }
    
    updateCurrentTaskDisplay() {
        if (this.tasks.length === 0) {
            this.currentTaskNumber.textContent = '#1';
            this.currentTaskName.textContent = 'Add your first task';
            return;
        }
        
        const currentTask = this.tasks[this.currentTaskIndex];
        this.currentTaskNumber.textContent = `#${this.currentTaskIndex + 1}`;
        this.currentTaskName.textContent = currentTask.name;
    }
    
    updateCompletionInfo() {
        const totalPomodoros = this.tasks.reduce((sum, task) => sum + task.total, 0);
        const completedPomodoros = this.tasks.reduce((sum, task) => sum + task.completed, 0);
        const remainingPomodoros = totalPomodoros - completedPomodoros;
        
        this.totalCount.textContent = totalPomodoros;
        
        if (remainingPomodoros > 0) {
            const currentTime = new Date();
            // Use current timer durations from settings
            const pomodoroTime = this.modes.pomodoro.time;
            const breakTime = this.modes['short-break'].time;
            const totalTimeSeconds = remainingPomodoros * pomodoroTime + (remainingPomodoros - 1) * breakTime;
            
            const completionTime = new Date(currentTime.getTime() + totalTimeSeconds * 1000);
            const timeString = completionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            this.completionTime.textContent = timeString;
        } else {
            this.completionTime.textContent = 'All tasks completed!';
        }
    }
    
    playCompletionSound() {
        if (!this.soundEnabled) return;
        
        // Simple completion beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio notification not available');
        }
    }
    
    playBreakStartChime() {
        if (!this.soundEnabled) return;
        
        // Pleasant chime for break start
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a pleasant chime sequence
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (C major chord)
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                const startTime = audioContext.currentTime + (index * 0.1);
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.8);
            });
        } catch (error) {
            console.log('Break start chime not available');
        }
    }
    
    playBreakEndChime() {
        if (!this.soundEnabled) return;
        
        // Different chime for break end (work resumption)
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a motivational chime sequence
            const frequencies = [392.00, 493.88, 587.33]; // G4, B4, D5 (G major chord)
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                const startTime = audioContext.currentTime + (index * 0.15);
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 1.0);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 1.0);
            });
        } catch (error) {
            console.log('Break end chime not available');
        }
    }
    
    showNotification(message) {
        // Simple notification - could be enhanced with a proper notification system
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomofocus', {
                body: message,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23d73e3e"/></svg>'
            });
        }
    }
    
    // Settings methods
    openSettings() {
        this.settingsModal.style.display = 'block';
        this.loadSettings();
    }
    
    closeSettings() {
        this.settingsModal.style.display = 'none';
    }
    
    changeBackgroundColor(color) {
        // Remove all background classes
        document.body.classList.remove('bg-red', 'bg-blue', 'bg-green', 'bg-purple', 'bg-orange', 'bg-teal', 'animations-enabled');
        
        // Add new background class
        document.body.classList.add(`bg-${color}`);
        
        // Add animation class if animations are enabled
        this.updateBackgroundAnimation();
        
        // Update active color option
        this.colorOptions.forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-color="${color}"]`).classList.add('active');
        
        // Save settings
        this.saveSettings();
    }
    
    updateBackgroundAnimation() {
        if (this.animationsEnabled) {
            document.body.classList.add('animations-enabled');
        } else {
            document.body.classList.remove('animations-enabled');
        }
    }
    
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('pomofocus-settings') || '{}');
        
        // Load background color
        const bgColor = settings.backgroundColor || 'red';
        this.changeBackgroundColor(bgColor);
        
        // Load auto-switch setting
        this.autoSwitch = settings.autoSwitch !== false; // Default to true
        this.autoSwitchCheckbox.checked = this.autoSwitch;
        
        // Load sound enabled setting
        this.soundEnabled = settings.soundEnabled !== false; // Default to true
        this.soundEnabledCheckbox.checked = this.soundEnabled;
        
        // Load animations enabled setting
        this.animationsEnabled = settings.animationsEnabled !== false; // Default to true
        this.animationsEnabledCheckbox.checked = this.animationsEnabled;
        
        // Load timer durations
        this.modes.pomodoro.time = (settings.pomodoroTime || 45) * 60;
        this.modes['short-break'].time = (settings.shortBreakTime || 15) * 60;
        this.modes['long-break'].time = (settings.longBreakTime || 30) * 60;
        
        // Update display values
        this.pomodoroTimeDisplay.textContent = settings.pomodoroTime || 45;
        this.shortBreakTimeDisplay.textContent = settings.shortBreakTime || 15;
        this.longBreakTimeDisplay.textContent = settings.longBreakTime || 30;
        
        // Update current timer if it matches the current mode
        if (this.currentMode === 'pomodoro') {
            this.timeLeft = this.modes.pomodoro.time;
            this.totalTime = this.modes.pomodoro.time;
        } else if (this.currentMode === 'short-break') {
            this.timeLeft = this.modes['short-break'].time;
            this.totalTime = this.modes['short-break'].time;
        } else if (this.currentMode === 'long-break') {
            this.timeLeft = this.modes['long-break'].time;
            this.totalTime = this.modes['long-break'].time;
        }
        
        this.updateDisplay();
        this.updateBackgroundAnimation();
    }
    
    saveSettings() {
        const activeColor = document.querySelector('.color-option.active').dataset.color;
        const settings = {
            backgroundColor: activeColor,
            autoSwitch: this.autoSwitch,
            soundEnabled: this.soundEnabled,
            animationsEnabled: this.animationsEnabled,
            pomodoroTime: Math.floor(this.modes.pomodoro.time / 60),
            shortBreakTime: Math.floor(this.modes['short-break'].time / 60),
            longBreakTime: Math.floor(this.modes['long-break'].time / 60)
        };
        
        localStorage.setItem('pomofocus-settings', JSON.stringify(settings));
    }
    
    // Clock methods
    startClock() {
        this.updateClock();
        // Update clock every second
        setInterval(() => {
            this.updateClock();
        }, 1000);
    }
    
    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        this.currentTimeDisplay.textContent = timeString;
    }
    
    // Completion time update methods
    startCompletionTimeUpdates() {
        // Update completion time every minute when timer is running
        this.completionUpdateInterval = setInterval(() => {
            this.updateCompletionInfo();
        }, 60000); // Update every minute
    }
    
    stopCompletionTimeUpdates() {
        if (this.completionUpdateInterval) {
            clearInterval(this.completionUpdateInterval);
            this.completionUpdateInterval = null;
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
