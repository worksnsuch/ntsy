// priorityTracker.js

const PRIORITY_KEY = 'notesApp_priority_tasks';
window.ptTasks = [];
let ptTasks = window.ptTasks;

// DOM Elements (populated in init)
let priorityList, addTaskDashboardBtn, viewAllTasksBtn;
let addTaskModal, viewTasksModal;
let taskIdInput, taskTitleInput, taskDescInput, taskPriorityInput, taskDueDateInput, taskError;
let cancelTaskBtn, saveTaskBtn, closeTasksModalBtn, addTaskFromModalBtn, allTasksList, taskModalTitle;

// Utility to save and sort
function saveAndRenderTasks() {
  // Sort: Pending first, then by priority (1=High, 3=Low), then Due Date
  ptTasks.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'Pending' ? -1 : 1;
    }
    // Urgency (Due Date) first
    if (a.dueDate && b.dueDate) {
      if (a.dueDate !== b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
    } else if (a.dueDate) {
      return -1; // Task with date is more urgent than one without
    } else if (b.dueDate) {
      return 1;
    }
    
    // Then Priority (Importance)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    return b.createdAt - a.createdAt; // newest first fallback
  });
  
  renderDashboardTasks();
  if (viewTasksModal && viewTasksModal.classList.contains('visible')) {
    renderAllTasks();
  }
}

async function saveTaskToDB(task) {
    if (!window.userSession || !window.supabaseClient) return;
    const { error } = await window.supabaseClient.from('priority_tasks').upsert({
        id: task.id,
        user_id: window.userSession.user.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: task.dueDate,
        status: task.status,
        created_at: new Date(task.createdAt).toISOString()
    });
    if (error) console.error('[PriorityTracker] upsert error:', error.message);
}

async function deleteTaskFromDB(taskId) {
    if (!window.userSession || !window.supabaseClient) return;
    await window.supabaseClient.from('priority_tasks').delete().eq('id', taskId);
}

function getPriorityColor(priority) {
  if (priority == 1) return 'var(--accent-red)';
  if (priority == 2) return 'var(--accent-yellow)';
  return 'var(--accent-green)';
}

function renderDashboardTasks() {
  if (!priorityList) return;
  priorityList.innerHTML = '';
  
  const pendingTasks = ptTasks.filter(t => t.status === 'Pending');
  const topTasks = pendingTasks.slice(0, 3); // display top 3 as requested
  
  if (topTasks.length === 0) {
    priorityList.innerHTML = '<li style="color: var(--text-secondary);justify-content:center; font-size: 13px;">No pending tasks.</li>';
  } else {
    topTasks.forEach(task => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.gap = '10px';
      
      const pColor = getPriorityColor(task.priority);
      
      li.innerHTML = `
        <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${pColor}; flex-shrink: 0;" title="Priority ${task.priority}"></div>
        <div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
          <span style="font-size: 14px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${task.title}</span>
          ${task.dueDate ? `<span style="font-size: 11px; color: var(--text-secondary);">${task.dueDate}</span>` : ''}
        </div>
      `;
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.style.margin = '0';
      cb.style.cursor = 'pointer';
      cb.addEventListener('change', () => {
        task.status = 'Completed';
        saveTaskToDB(task);
        saveAndRenderTasks();
      });
      li.prepend(cb);
      
      priorityList.appendChild(li);
    });
  }
}

function renderAllTasks() {
  if (!allTasksList) return;
  allTasksList.innerHTML = '';
  
  if (ptTasks.length === 0) {
    allTasksList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; font-size: 14px; margin-top: 20px;">No tasks created.</p>';
    return;
  }
  
  ptTasks.forEach(task => {
    const card = document.createElement('div');
    card.style.background = 'var(--bg-panel)';
    card.style.border = '1px solid var(--border-color)';
    card.style.borderRadius = '8px';
    card.style.padding = '14px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '10px';
    
    if (task.status === 'Completed') {
      card.style.opacity = '0.6';
    }
    
    const pColor = getPriorityColor(task.priority);
    const pLabel = task.priority == 1 ? 'High' : (task.priority == 2 ? 'Medium' : 'Low');
    
    let isOverdue = false;
    if (task.dueDate && task.status === 'Pending') {
      const today = new Date().toISOString().split('T')[0];
      if (task.dueDate < today) isOverdue = true;
    }
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="display: flex; gap: 10px; align-items: flex-start; flex: 1; padding-right: 12px;">
          <input type="checkbox" class="modal-task-cb" style="margin-top: 4px; cursor: pointer;" ${task.status === 'Completed' ? 'checked' : ''}>
          <div style="display: flex; flex-direction: column;">
            <h4 style="margin: 0; font-size: 15px; color: var(--text-primary); ${task.status === 'Completed' ? 'text-decoration: line-through;' : ''}">${task.title}</h4>
            ${task.description ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-secondary); line-height: 1.4;">${task.description}</p>` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
          <button class="icon-btn edit-task-btn" style="padding: 6px;" title="Edit"><i data-lucide="edit-2" size="14"></i></button>
          <button class="icon-btn delete-task-btn" style="padding: 6px; color: var(--accent-red);" title="Delete"><i data-lucide="trash-2" size="14"></i></button>
        </div>
      </div>
      <div style="display: flex; gap: 12px; font-size: 11px; margin-top: 4px;">
        <span style="color: ${pColor}; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: ${pColor}20;">${pLabel} Priority</span>
        ${task.dueDate ? `<span style="color: var(--text-secondary); padding: 3px 8px; border-radius: 4px; background: var(--bg-hover);">Due: ${task.dueDate}</span>` : ''}
        ${isOverdue ? `<span style="color: var(--accent-red); font-weight: 600; padding: 3px 8px; border-radius: 4px; background: var(--accent-red)20;">Overdue</span>` : ''}
      </div>
    `;
    
    // Bind actions
    const cb = card.querySelector('.modal-task-cb');
    cb.addEventListener('change', () => {
      task.status = cb.checked ? 'Completed' : 'Pending';
      saveTaskToDB(task);
      saveAndRenderTasks();
    });
    
    const delBtn = card.querySelector('.delete-task-btn');
    delBtn.addEventListener('click', async () => {
      const confirmed = await window.customConfirm('Are you sure you want to delete this task?', 'Delete Task?');
      if (confirmed) {
        ptTasks = ptTasks.filter(t => t.id !== task.id);
        deleteTaskFromDB(task.id);
        saveAndRenderTasks();
      }
    });
    
    const editBtn = card.querySelector('.edit-task-btn');
    editBtn.addEventListener('click', () => {
      if (viewTasksModal) viewTasksModal.classList.remove('visible');
      openTaskModal(task);
    });
    
    allTasksList.appendChild(card);
  });
  
  window.safeCreateIcons();
}

function openTaskModal(task = null) {
  if (!taskError || !addTaskModal) return;
  taskError.style.display = 'none';
  if (task) {
    taskModalTitle.textContent = 'Edit Task';
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description;
    taskPriorityInput.value = task.priority;
    taskDueDateInput.value = task.dueDate;
  } else {
    taskModalTitle.textContent = 'Add Task';
    taskIdInput.value = '';
    taskTitleInput.value = '';
    taskDescInput.value = '';
    taskPriorityInput.value = '3'; // Default Low
    taskDueDateInput.value = '';
  }
  addTaskModal.classList.add('visible');
}


window.initPriorityTracker = async function() {
  console.log("[PriorityTracker] initPriorityTracker invoked.");

  if (window.userSession && window.supabaseClient) {
      const { data } = await window.supabaseClient.from('priority_tasks').select('*').eq('user_id', window.userSession.user.id);
      if (data) {
          window.ptTasks = data.map(t => ({
              id: t.id,
              title: t.title,
              description: t.description,
              priority: t.priority,
              dueDate: t.due_date,
              status: t.status,
              createdAt: new Date(t.created_at).getTime()
          }));
          ptTasks = window.ptTasks;
      }
  }

  // Map DOM Elements
  priorityList = document.getElementById('priority-list');
  addTaskDashboardBtn = document.getElementById('add-task-dashboard-btn');
  viewAllTasksBtn = document.getElementById('view-all-tasks-btn');
  addTaskModal = document.getElementById('add-task-modal');
  viewTasksModal = document.getElementById('view-tasks-modal');
  taskIdInput = document.getElementById('task-id');
  taskTitleInput = document.getElementById('task-title');
  taskDescInput = document.getElementById('task-desc');
  taskPriorityInput = document.getElementById('task-priority');
  taskDueDateInput = document.getElementById('task-due-date');
  taskError = document.getElementById('task-error');
  cancelTaskBtn = document.getElementById('cancel-task-btn');
  saveTaskBtn = document.getElementById('save-task-btn');
  closeTasksModalBtn = document.getElementById('close-tasks-modal-btn');
  addTaskFromModalBtn = document.getElementById('add-task-from-modal-btn');
  allTasksList = document.getElementById('all-tasks-list');
  taskModalTitle = document.getElementById('task-modal-title');

  // Bind Listeners
  if (addTaskDashboardBtn) addTaskDashboardBtn.addEventListener('click', () => {
    openTaskModal();
  });

  if (addTaskFromModalBtn) addTaskFromModalBtn.addEventListener('click', () => {
    openTaskModal();
  });

  if (viewAllTasksBtn) viewAllTasksBtn.addEventListener('click', (e) => {
    e.preventDefault();
    renderAllTasks();
    if (viewTasksModal) viewTasksModal.classList.add('visible');
  });

  if (closeTasksModalBtn) closeTasksModalBtn.addEventListener('click', () => {
    viewTasksModal.classList.remove('visible');
  });

  if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', () => {
    addTaskModal.classList.remove('visible');
  });

  if (saveTaskBtn) saveTaskBtn.addEventListener('click', () => {
    const title = taskTitleInput.value.trim();
    if (!title) {
      taskError.style.display = 'block';
      return;
    }
    
    const id = taskIdInput.value;
    let targetTask;
    if (id) {
      targetTask = ptTasks.find(t => t.id == id);
      if (targetTask) {
        targetTask.title = title;
        targetTask.description = taskDescInput.value.trim();
        targetTask.priority = parseInt(taskPriorityInput.value);
        targetTask.dueDate = taskDueDateInput.value;
      }
    } else {
      targetTask = {
        id: Date.now().toString(),
        title,
        description: taskDescInput.value.trim(),
        priority: parseInt(taskPriorityInput.value),
        dueDate: taskDueDateInput.value,
        status: 'Pending',
        createdAt: Date.now()
      };
      ptTasks.push(targetTask);
    }
    
    saveTaskToDB(targetTask);
    
    saveAndRenderTasks();
    addTaskModal.classList.remove('visible');
  });

  // Initial render
  saveAndRenderTasks();
  console.log("[PriorityTracker] initialized.");
};
