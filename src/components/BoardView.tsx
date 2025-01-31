import React, { useEffect, useRef } from 'react';
import TaskCard from './TaskCard';
import { updateTaskInDb } from './firestoreTasks';
import { useTaskContext, Task } from '../context/Context';
import { useDrop } from 'react-dnd';
import './BoardView.css'

interface BoardViewProps {
    tasks: Task[];
    filteredTasks: Task[];
    selectedTasks: string[];
    handleOpenModal: (task: any) => void;
    handleDeleteTask: (id: string) => void;
    toggleTaskSelection: (id: string) => void;
    openModal: () => void;
    closeModal: () => void;

}

const BoardView: React.FC<BoardViewProps> = ({

    filteredTasks,
    selectedTasks,
    handleOpenModal,
    handleDeleteTask,
    toggleTaskSelection,
    openModal,
    closeModal,

}) => {
    const { tasks, setTasks } = useTaskContext();
    const tasksRef = useRef(tasks);
    const statuses: ('to-do' | 'inprogress' | 'completed')[] = ['to-do', 'inprogress', 'completed'];
    const statusTitles = {
        'to-do': 'To Do',
        'inprogress': 'In Progress',
        'completed': 'Completed',
    };

    useEffect(() => {
        tasksRef.current = tasks;
    }, [tasks]);

    const generateTaskIndex = (status: 'to-do' | 'inprogress' | 'completed', position: number) => {
        const statusMap = { 'to-do': 1, 'inprogress': 2, 'completed': 3 };
        const generatedIndex = parseInt(`${statusMap[status]}${String(position + 1).padStart(2, '0')}`);
        return generatedIndex;
    };

    const getStatusColor = (status: 'to-do' | 'inprogress' | 'completed') => {
        switch (status) {
            case 'to-do':
                return '#d4a4ed';
            case 'inprogress':
                return '#aec6cf';
            case 'completed':
                return '#b2d8b2';
            default:
                return '#d4a4ed';
        }
    }



    const handleDrop = async (status: 'to-do' | 'inprogress' | 'completed', droppedItem: any) => {
        const currentTasks = tasksRef.current;
        const existingTask = currentTasks.find(task => task.id === droppedItem.id);
        if (!existingTask) {
            console.error('Task not found:', droppedItem.id);
            return;
        }

        if (existingTask.status === status) {
            return;
        }

        const tasksInNewStatus = currentTasks.filter(task => task.status === status);
        const newIndex = generateTaskIndex(status, tasksInNewStatus.length);
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const updatedTask = {
            ...existingTask,
            status,
            index: newIndex,
            updatedDates: [
                ...existingTask.updatedDates,
                {
                    change: `You Changed status to ${status}`,
                    time: timestamp
                }
            ]
        };

        try {
            await updateTaskInDb(updatedTask);
            setTasks(prevTasks =>
                prevTasks.map(t => t.id === droppedItem.id ? updatedTask : t)
            );
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    };


    return (
        <div className="BoardContainer">
            {statuses.map((status, index) => {
                const [, drop] = useDrop(() => ({
                    accept: 'TASK',
                    drop: (item) => handleDrop(status, item),
                }));

                return (
                    <div
                        ref={drop}
                        key={status}
                        className="BoardTopRow"
                        style={{ height: index === 2 ? '17vh' : '28vh' }}
                    >
                        <h3 className="BoardHeader" style={{ backgroundColor: getStatusColor(status) }}>
                            {statusTitles[status]} ({tasks.filter(t => t.status === status).length})
                        </h3>

                        {filteredTasks.filter((task) => task.status === status).length > 0 ? (
                            filteredTasks
                                .filter((task) => task.status === status)
                                .sort((a, b) => (a.index || 0) - (b.index || 0))
                                .map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        index={task.index}
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
                                No tasks in {status}
                            </div>
                        )}

                    </div>
                );
            })}
        </div>
    );
};

export default BoardView;