import React, { useEffect, useRef } from 'react';
import TaskCard from './TaskCard';
import { useTaskContext, Task } from '../context/Context';
import { useDrop } from 'react-dnd';
import { updateTaskInDb } from './firestoreTasks';
import './KanbanView.css';

interface KanbanViewProps {
    tasks: Task[];
    filteredTasks: Task[];
    selectedTasks: string[];
    handleOpenModal: (task: any) => void;
    handleDeleteTask: (id: string) => void;
    toggleTaskSelection: (id: string) => void;
    openModal: () => void;
    closeModal: () => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({
    tasks,
    filteredTasks,
    selectedTasks,
    handleOpenModal,
    handleDeleteTask,
    toggleTaskSelection,
    openModal,
    closeModal,
}) => {
    const { setTasks } = useTaskContext();
    const tasksRef = useRef(tasks);
    const statuses: ('to-do' | 'inprogress' | 'completed')[] = ['to-do', 'inprogress', 'completed'];
    const statusTitles = {
        'to-do': 'To Do',
        'inprogress': 'In Progress',
        'completed': 'Completed'
    };

    useEffect(() => {
        tasksRef.current = tasks;
    }, [tasks]);

    const getStatusColor = (status: 'to-do' | 'inprogress' | 'completed') => {
        const colors = {
            'to-do': '#d4a4ed',
            'inprogress': '#aec6cf',
            'completed': '#b2d8b2'
        };
        return colors[status] || colors['to-do'];
    };

    const generateTaskIndex = (status: 'to-do' | 'inprogress' | 'completed', position: number) => {
        const statusMap = { 'to-do': 1, 'inprogress': 2, 'completed': 3 };
        return parseInt(`${statusMap[status]}${String(position + 1).padStart(2, '0')}`);
    };

    const handleDrop = async (status: 'to-do' | 'inprogress' | 'completed', droppedItem: any) => {
        try {
            const currentTasks = tasksRef.current;
            if (!currentTasks) return;

            const existingTask = currentTasks.find(task => task.id === droppedItem.id);
            if (!existingTask || existingTask.status === status) return;

            const tasksInNewStatus = currentTasks.filter(task => task.status === status);
            const newIndex = generateTaskIndex(status, tasksInNewStatus.length);

            const updatedTask = {
                ...existingTask,
                status,
                index: newIndex,
            };


            setTasks(prevTasks =>
                prevTasks?.map(t => t.id === droppedItem.id ? updatedTask : t) || []
            );


            await updateTaskInDb(updatedTask);
        } catch (error) {
            console.error('Failed to update task:', error);
            setTasks(tasks);
        }
    };

    return (
        <div className="kanbanContainer" >
            {statuses.map(status => {
                const [, drop] = useDrop(() => ({
                    accept: 'TASK',
                    drop: (item) => handleDrop(status, item),
                }), [status, tasks]);

                const statusTasks = filteredTasks.filter(task => task.status === status);

                return (
                    <div ref={drop} key={status} className="kanbanTopRow">
                        <h3 className="kanbanHeader" style={{ backgroundColor: getStatusColor(status) }}>
                            {statusTitles[status]} ({statusTasks.length})
                        </h3>

                        <div className="kanbanColumn">
                            {statusTasks.length > 0 ? (
                                statusTasks
                                    .sort((a, b) => (a.index || 0) - (b.index || 0))
                                    .map((task, position) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            index={task.index || generateTaskIndex(status, position)}
                                            tasks={tasks}
                                            setTasks={setTasks}
                                            onEdit={() => handleOpenModal(task)}
                                            onDelete={() => handleDeleteTask(task.id)}
                                            toggleTaskSelection={() => toggleTaskSelection(task.id)}
                                            isSelected={selectedTasks.includes(task.id)}
                                            openModal={openModal}
                                            closeModal={closeModal}
                                            selectedTasks={selectedTasks}
                                            updateTaskInDb={updateTaskInDb}
                                            handleDrop={handleDrop}
                                            draggable
                                            onDragStart={() => { }}
                                        />
                                    ))
                            ) : (
                                <div className="noTasks">
                                    No tasks
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default KanbanView;