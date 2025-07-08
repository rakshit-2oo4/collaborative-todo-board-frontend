import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './TaskModal.css';

const TaskModal = ({ task, onClose, onSave, users }) => {
  const { API_URL } = useAuth();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo?._id || (users.length > 0 ? users[0]._id : ''));
  const [status, setStatus] = useState(task?.status || 'Todo');
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Default priority order
  const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };

  // Sort users alphabetically for dropdown
  const sortedUsers = [...users].sort((a, b) => a.email.localeCompare(b.email));

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setAssignedTo(task.assignedTo?._id || '');
      setStatus(task.status);
      setPriority(task.priority);
    } else {
      // For new tasks, set default assignee if users exist
      if (users.length > 0) {
        setAssignedTo(users[0]._id);
      }
    }
  }, [task, users]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!title || !assignedTo || !status || !priority) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    const taskData = {
      title,
      description,
      assignedTo,
      status,
      priority,
      lastUpdatedAt: task ? task.updatedAt : undefined // Send lastUpdatedAt for conflict detection
    };

    try {
      let res;
      if (task) { // Editing existing task
        res = await axios.put(`${API_URL}/tasks/${task._id}`, taskData);
      } else { // Creating new task
        res = await axios.post(`${API_URL}/tasks`, taskData);
      }
      onSave(res.data);
      onClose();
    } catch (err) {
      console.error('Failed to save task:', err.response?.data || err.message);
      if (err.response && err.response.status === 409) {
          // Conflict detected, pass both versions to parent for resolution
          onSave(null, err.response.data.serverVersion); // Pass null for client version, send serverVersion
          onClose(); // Close modal to show conflict resolution UI
      } else {
          setError(err.response?.data?.message || 'Failed to save task.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{task ? 'Edit Task' : 'Add New Task'}</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              disabled={loading}
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="assignedTo">Assigned To:</label>
            <select
              id="assignedTo"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              required
              disabled={loading}
            >
              {sortedUsers.map(u => (
                <option key={u._id} value={u._id}>{u.email}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
              disabled={loading}
            >
              {['Todo', 'In Progress', 'Done'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority:</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
              disabled={loading}
            >
              {Object.keys(priorityOrder).sort((a, b) => priorityOrder[b] - priorityOrder[a]).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="submit" className="save-button" disabled={loading}>
              {loading ? 'Saving...' : (task ? 'Save Changes' : 'Add Task')}
            </button>
            <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;