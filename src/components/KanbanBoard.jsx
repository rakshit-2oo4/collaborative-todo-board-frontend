import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TaskModal from './TaskModal'; // Import the TaskModal
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './KanbanBoard.css';

// Task Card Component for reusability and potential animation
const TaskCard = React.memo(({ task, index, onEdit, onDelete, onSmartAssign }) => {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
        >
          <h4>{task.title}</h4>
          <p>{task.description}</p>
          <p className="task-meta">Assigned: {task.assignedTo?.email || 'N/A'}</p>
          <p className="task-meta">Priority: {task.priority}</p>
          <div className="task-actions">
            <button onClick={() => onEdit(task)} className="edit-button">Edit</button>
            <button onClick={() => onDelete(task._id)} className="delete-button">Delete</button>
            <button onClick={() => onSmartAssign(task._id)} className="smart-assign-button">Smart Assign</button>
          </div>
        </div>
      )}
    </Draggable>
  );
});

function KanbanBoard() {
  const { API_URL, socket, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // State to store all users for assignment
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [error, setError] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // Task being edited
  const [conflictDetected, setConflictDetected] = useState(false);
  const [clientVersion, setClientVersion] = useState(null);
  const [serverVersion, setServerVersion] = useState(null);


  // Fetch all users for assignment dropdown
  const fetchUsers = useCallback(async () => {
    try {
        const res = await axios.get(`${API_URL}/auth/users`);
        setAllUsers(res.data);
    } catch (err) {
        console.error('Failed to fetch users:', err);
    }
  }, [API_URL]);


  // Function to fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      setError(null);
      const response = await axios.get(`${API_URL}/tasks`);
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoadingTasks(false);
    }
  }, [API_URL]);

  // Function to fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const response = await axios.get(`${API_URL}/activity`);
      setActivityLogs(response.data);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchTasks();
    fetchActivityLogs();
    fetchUsers(); 
  }, [fetchTasks, fetchActivityLogs, fetchUsers]);

  // --- Socket.IO Real-time event listeners ---
  useEffect(() => {
    if (socket) {
      socket.on('taskAdded', (task) => {
        console.log('Task Added (Socket.IO):', task);
        setTasks(prevTasks => [...prevTasks, task]);
        fetchActivityLogs(); // Refresh activity logs
      });

      socket.on('taskUpdated', (updatedTask) => {
        console.log('Task Updated (Socket.IO):', updatedTask);
        setTasks(prevTasks =>
          prevTasks.map(task => (task._id === updatedTask._id ? updatedTask : task))
        );
        fetchActivityLogs();
      });

      socket.on('taskDeleted', (taskId) => {
        console.log('Task Deleted (Socket.IO):', taskId);
        setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
        fetchActivityLogs();
      });

      socket.on('activityLogged', (log) => {
        console.log('Activity Logged (Socket.IO):', log);
        setActivityLogs(prevLogs => [log, ...prevLogs].slice(0, 20)); // Keep only latest 20
      });

      // Cleanup on unmount or socket change
      return () => {
        socket.off('taskAdded');
        socket.off('taskUpdated');
        socket.off('taskDeleted');
        socket.off('activityLogged');
      };
    }
  }, [socket, fetchActivityLogs]); // Depend on socket and fetchActivityLogs

  // --- Task Modal Handlers ---
  const handleAddTaskClick = () => {
    setCurrentTask(null); // No task selected for editing
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setCurrentTask(task);
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setCurrentTask(null);
    setError(null); // Clear errors from modal
    setConflictDetected(false); // Clear conflict state
    setClientVersion(null);
    setServerVersion(null);
  };

  const handleSaveTask = (savedTask, serverConflictVersion = null) => {
      if (serverConflictVersion) {
          setClientVersion(currentTask); 
          setServerVersion(serverConflictVersion);
          setConflictDetected(true);
      } else {
          console.log('Task saved successfully via API. Socket.IO will update UI.');
          handleCloseTaskModal(); // Close modal on success
      }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);
      // Socket.IO will handle updating the tasks state
    } catch (err) {
      console.error('Failed to delete task:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  const handleSmartAssign = async (taskId) => {
    try {
      const res = await axios.post(`${API_URL}/tasks/smart-assign/${taskId}`);
      // Socket.IO will handle updating the tasks state
      alert(res.data.message);
    } catch (err) {
      console.error('Failed to smart assign task:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Failed to smart assign task.');
    }
  };

  // --- Drag and Drop Logic ---
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskId = draggableId;
    const newStatus = destination.droppableId; // Droppable ID is the new status

    const taskToMove = tasks.find(task => task._id === taskId);
    if (!taskToMove) return;

    // Optimistic update for smooth UX
    const originalTasks = [...tasks];
    setTasks(prevTasks =>
        prevTasks.map(task =>
            task._id === taskId ? { ...task, status: newStatus } : task
        )
    );

    try {
      const updatedTaskData = {
        ...taskToMove,
        status: newStatus,
        lastUpdatedAt: taskToMove.updatedAt // Send current timestamp for conflict detection
      };
      const res = await axios.put(`${API_URL}/tasks/${taskId}`, updatedTaskData);
      // Backend will send socket event, which will re-render, no need to update here explicitly
      // If the backend returns a conflict, handle it
      if (res.status === 200) {
          console.log('Task status updated successfully via drag-drop.');
      }
    } catch (err) {
      console.error('Failed to update task status via drag-drop:', err.response?.data || err.message);
      if (err.response && err.response.status === 409) {
          setClientVersion(taskToMove); // The task as it was known on client before drag
          setServerVersion(err.response.data.serverVersion);
          setConflictDetected(true);
          alert('Conflict: This task was updated by another user. Please resolve.');
      }
      // Revert to original state on error
      setTasks(originalTasks);
      alert(err.response?.data?.message || 'Failed to update task status.');
    }
  };


  // --- Conflict Resolution UI and Logic ---
  const handleResolveConflict = async (resolutionType) => {
    if (!clientVersion || !serverVersion) return;

    let finalTaskData = {};
    if (resolutionType === 'overwrite') {
      finalTaskData = clientVersion; // Use client's version
    } else if (resolutionType === 'merge') {
      // Simple merge: client's title, server's description, etc.
      // In a real app, you'd have more granular merge options/UI
      finalTaskData = {
          ...serverVersion, // Start with server's latest version
          title: clientVersion.title, // Prioritize client's title
          description: clientVersion.description, // Prioritize client's description
          // You might need a more complex merge strategy depending on fields
          // For simplicity, let's take client's title/description, and server's status/priority/assignedTo
      };
    } else {
        // Just use server's version (effectively "cancel" client changes)
        finalTaskData = serverVersion;
    }

    // Attempt to save the resolved version. Do not send lastUpdatedAt for conflict resolution.
    // The backend will now treat this as a definitive update.
    try {
        const res = await axios.put(`${API_URL}/tasks/${finalTaskData._id}`, finalTaskData);
        // Socket.IO will handle the update
        alert('Conflict resolved successfully!');
    } catch (err) {
        console.error('Error resolving conflict:', err.response?.data || err.message);
        alert(err.response?.data?.message || 'Failed to resolve conflict.');
    } finally {
        handleCloseTaskModal(); // Close conflict resolution UI
    }
  };


  // Organize tasks by status for display
  const tasksByStatus = {
    Todo: tasks.filter(task => task.status === 'Todo').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    'In Progress': tasks.filter(task => task.status === 'In Progress').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    Done: tasks.filter(task => task.status === 'Done').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  };

  if (loadingTasks || loadingLogs) {
    return <div className="loading-message">Loading board data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="kanban-board-container">
      <h2>Your To-Do Board</h2>
      <button onClick={handleAddTaskClick} className="add-task-button">Add New Task</button>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-columns">
          {['Todo', 'In Progress', 'Done'].map(status => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`kanban-column ${status.toLowerCase().replace(' ', '-')}-column`}
                >
                  <h3>{status} ({tasksByStatus[status].length})</h3>
                  <div className="task-list">
                    {tasksByStatus[status].length === 0 ? (
                      <p className="no-tasks-message">No tasks in this column.</p>
                    ) : (
                      tasksByStatus[status].map((task, index) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          index={index}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                          onSmartAssign={handleSmartAssign}
                        />
                      ))
                    )}
                    {provided.placeholder} {/* Important for dnd */}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <div className="activity-log-panel">
        <h3>Activity Log (Last 20 Actions)</h3>
        {activityLogs.length === 0 ? (
          <p>No recent activity.</p>
        ) : (
          <ul>
            {activityLogs.map(log => (
              <li key={log._id}>
                <strong>{log.performedByEmail}</strong> {log.action} task "<em>{log.taskTitle}</em>" on {new Date(log.timestamp).toLocaleString()}
                {log.details && Object.keys(log.details).length > 0 && (
                    <span className="log-details">
                        &nbsp;({Object.entries(log.details).map(([key, value]) =>
                            `${key}: ${typeof value === 'object' ? `${value.old} &rarr; ${value.new}` : value}`
                        ).join(', ')})
                    </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          task={currentTask}
          onClose={handleCloseTaskModal}
          onSave={handleSaveTask}
          users={allUsers} // Pass all users to the modal
        />
      )}

      {conflictDetected && (
          <div className="modal-overlay">
              <div className="modal-content conflict-modal">
                  <h2>Conflict Detected!</h2>
                  <p>This task has been updated by another user. Please choose how to resolve:</p>

                  <div className="conflict-versions">
                      <div className="version-card client-version">
                          <h3>Your Version</h3>
                          <p><strong>Title:</strong> {clientVersion?.title}</p>
                          <p><strong>Description:</strong> {clientVersion?.description}</p>
                          <p><strong>Status:</strong> {clientVersion?.status}</p>
                          <p><strong>Assigned:</strong> {clientVersion?.assignedTo?.email || clientVersion?.assignedTo}</p>
                      </div>
                      <div className="version-card server-version">
                          <h3>Server Version (Latest)</h3>
                          <p><strong>Title:</strong> {serverVersion?.title}</p>
                          <p><strong>Description:</strong> {serverVersion?.description}</p>
                          <p><strong>Status:</strong> {serverVersion?.status}</p>
                          <p><strong>Assigned:</strong> {serverVersion?.assignedTo?.email || serverVersion?.assignedTo}</p>
                      </div>
                  </div>

                  <div className="modal-actions">
                      <button className="resolve-button overwrite" onClick={() => handleResolveConflict('overwrite')}>
                          Overwrite with Mine
                      </button>
                      <button className="resolve-button merge" onClick={() => handleResolveConflict('merge')}>
                          Merge (Prioritize Mine's Title/Description)
                      </button>
                      <button className="resolve-button cancel" onClick={() => handleCloseTaskModal()}>
                          Discard Mine (Keep Server's)
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

export default KanbanBoard;