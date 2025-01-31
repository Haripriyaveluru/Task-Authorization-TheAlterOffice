import React from 'react';
import { useDrag, useDrop, } from 'react-dnd';
import { EllipsisOutlined } from '@ant-design/icons';
import { Dropdown, CardBody, Card } from 'react-bootstrap';
import { Task, useTaskContext } from '../context/Context';
import dayjs from 'dayjs';
import './TaskCard.css';

interface TaskCardProps {
    task: Task;
    index: number;
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
    toggleTaskSelection: (taskId: string) => void;
    isSelected: boolean;
    openModal: () => void;
    closeModal: () => void;
    selectedTasks: string[];
    updateTaskInDb: (task: Task) => Promise<void>;
    draggable: boolean;
    onDragStart: () => void;
    handleDrop: (status: 'to-do' | 'inprogress' | 'completed', droppedItem: any) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
    task,
    index,
    setTasks,
    onEdit,
    onDelete,
    toggleTaskSelection,
    isSelected,
    openModal,
    closeModal,
    selectedTasks,
    updateTaskInDb,
    handleDrop

}) => {
    const [, drag] = useDrag(() => ({
        type: 'TASK',
        item: { id: task.id, index, status: task.status },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    const [, drop] = useDrop(() => ({
        accept: 'TASK',
        drop: (droppedItem: { id: string; status: string }) => {
            if (droppedItem.id !== task.id) {
                handleDrop(task.status, droppedItem);
            }
        },
    }));
    const { tasks, viewType } = useTaskContext();
    const statuses: ('to-do' | 'inprogress' | 'completed')[] = ['to-do', 'inprogress', 'completed'];
    const statusTitles = {
        'to-do': 'To Do',
        'inprogress': 'In Progress',
        'completed': 'Completed',
    };

    const handleStatusChange = async (newStatus: 'to-do' | 'inprogress' | 'completed') => {
        if (task.status !== newStatus) {
            const tasksInNewStatus = tasks.filter(task => task.status === newStatus);
            const newIndex = generateTaskIndex(newStatus, tasksInNewStatus.length);
            const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });


            const updatedTask = {
                ...task,
                status: newStatus,
                index: newIndex,
                updatedDates: [
                    ...task.updatedDates,
                    {
                        change: `You Changed status to ${newStatus}`,
                        time: timestamp
                    }
                ]
            };

            try {
                await updateTaskInDb(updatedTask);
                setTasks((prevTasks) =>
                    prevTasks
                        .map((t) => (t.id === task.id ? updatedTask : t))
                        .sort((a, b) => a.index - b.index)
                );
            } catch (error) {
                console.error('Failed to update task:', error);
            }
        }
    };

    const generateTaskIndex = (status: 'to-do' | 'inprogress' | 'completed', position: number) => {
        const statusMap = { 'to-do': 1, 'inprogress': 2, 'completed': 3 };
        const generatedIndex = parseInt(`${statusMap[status]}${String(position + 1).padStart(2, '0')}`);
        return generatedIndex;
    };

    const handledueDate = (newDueDate: string) => {
        const today = dayjs().startOf('day');
        const tomorrow = today.add(1, 'day');
        const taskDate = dayjs(newDueDate).startOf('day');

        if (taskDate.isSame(today, 'day')) return 'Today';
        if (taskDate.isSame(tomorrow, 'day')) return 'Tomorrow';

        return taskDate.format('D MMM, YYYY');
    };




    return (
        <div ref={(node) => drag(drop(node))} className="taskCard">
            <Card className="card" >
                {viewType === 'board' ?
                    <CardBody className="cardBody1" >
                        <div className="taskCheckbox" >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                    toggleTaskSelection(task.id);
                                    if (!isSelected) openModal();
                                    else if (selectedTasks.length === 1) closeModal();
                                }}
                            />
                            <span className="space" >::</span>
                            <p className="taskGeneral" ><span className="material-symbols-outlined" style={{ color: task.status === 'completed' ? 'green' : 'black', fontSize: '20px' }}>check_circle</span><span style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>{task.title}</span></p></div>
                        <p className="taskGeneral" >{handledueDate(task.dueDate)}</p>
                        <p className="taskGeneralDrop" >
                            <Dropdown>
                                <Dropdown.Toggle
                                    variant="light"
                                    size="sm"
                                    className="taskDropdown">
                                    {statusTitles[task.status]}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {statuses.map((status) => (
                                        <Dropdown.Item key={status} onClick={() => handleStatusChange(status)}>
                                            {statusTitles[status]}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </p>
                        <p className="taskGeneral" >{task.category}</p>
                        <Dropdown align="end">
                            <Dropdown.Toggle
                                variant="light"
                                size="sm"
                                className='taskDropdown'>
                                <EllipsisOutlined />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => onEdit(task)} className="Button"><span className='material-symbols-outlined span1'>border_color</span>Edit</Dropdown.Item>
                                <Dropdown.Item onClick={() => onDelete(task.id)} className="text-danger Button" >
                                    <span className='material-symbols-outlined span1'>delete</span>Delete
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </CardBody>
                    :
                    <CardBody className="cardBody2">
                        <div className="taskCard2">
                            <p className="p" style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>{task.title}</p>
                            <Dropdown align="end">
                                <Dropdown.Toggle
                                    variant="light"
                                    size="sm"
                                    className="taskDropdown"

                                >
                                    <EllipsisOutlined />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => onEdit(task)} className="Button" ><span className='material-symbols-outlined span1'>border_color</span>Edit</Dropdown.Item>
                                    <Dropdown.Item onClick={() => onDelete(task.id)} className="text-danger Button">
                                        <span className='material-symbols-outlined span1'>delete</span>Delete
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>


                        <div className="categoryDiv">
                            <p>{task.category}</p>
                            <p>{handledueDate(task.dueDate)}</p>
                        </div>
                    </CardBody>}
            </Card >
        </div >
    );
};

export default TaskCard;
