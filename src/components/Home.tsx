import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button } from 'antd'
import { useTaskContext, Task } from '../context/Context';
import { Dropdown } from 'react-bootstrap';
import './../App.css';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from "./Firebase";
import Header from './Header';
import { createTaskInDb, updateTaskInDb, deleteTaskInDb } from './firestoreTasks';
import BoardView from './BoardView';
import KanbanView from './kanbanView';
import './Home.css'

dayjs.extend(isBetween);

const Home: React.FC = () => {
    const { tasks, setTasks, userDetails, setUserDetails, viewType } = useTaskContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
    const [categoryFilter, setCategoryFilter] = useState<('Personal' | 'Work' | 'All')>('All');
    const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [isModal2Open, setModal2Open] = useState(false);
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        category: 'Personal' as 'Personal' | 'Work',
        dueDate: '',
        status: 'to-do' as 'to-do' | 'inprogress' | 'completed',
        files: [] as string[]
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [previewFiles, setPreviewFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [charCount, setCharCount] = useState<number>(300);
    const editorRef = useRef<HTMLDivElement | null>(null);



    console.log(isModal2Open);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                if (!userDetails) return;
                const taskRef = collection(db, "tasks");
                const q = query(taskRef, where("userId", "==", userDetails.uid));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setTasks([]);
                    return;
                }

                const tasks = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Task[];
                setTasks(tasks);
                console.log('tasks fetched successfully');
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };

        fetchTasks();
    }, [setTasks]);


    useEffect(() => {

        let updatedTasks: Task[] = [...tasks];
        if (searchQuery) {
            updatedTasks = updatedTasks.filter(task =>
                task.title.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }
        if (dateRange[0] && dateRange[1]) {
            updatedTasks = updatedTasks.filter(task => {
                const taskDate = new Date(task.dueDate);
                const startDate = dateRange[0]?.toDate();
                const endDate = dateRange[1]?.toDate();

                return startDate && endDate && taskDate >= startDate && taskDate <= endDate;
            });
        }

        if (categoryFilter !== 'All') {
            updatedTasks = updatedTasks.filter(task => task.category === categoryFilter);
        }

        setFilteredTasks(updatedTasks);
    }, [searchQuery, dateRange, categoryFilter, tasks]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const fileNames = Array.from(files).map((file) => file.name); setTaskForm((prev) => ({
                ...prev,
                files: [...prev.files, ...fileNames],
            }));
            setPreviewFiles((prev) => [...prev, ...Array.from(files)]);
        }
    };


    const generateTaskIndex = (status: 'to-do' | 'inprogress' | 'completed', position: number) => {
        const statusMap = { 'to-do': 1, 'inprogress': 2, 'completed': 3 };
        const generatedIndex = parseInt(`${statusMap[status]}${String(position + 1).padStart(2, '0')}`);
        return generatedIndex;
    };


    const handleOpenModal = (task: Task | null) => {
        if (task) {
            setTaskForm({ ...task, files: [] });
            setCurrentTask(task);
            setIsEditMode(true);
        } else {
            setTaskForm({
                title: '',
                description: '',
                category: 'Personal',
                dueDate: '',
                status: 'to-do',
                files: [],
            });
            setIsEditMode(false);
        }
        setIsModalOpen(true);
    };



    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentTask(null);
        setTaskForm({
            title: '',
            description: '',
            category: 'Personal',
            dueDate: '',
            status: 'to-do',
            files: [],
        });
        setFormErrors({});
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setPreviewFiles([]);
    };


    const handleCreateOrUpdateTask = async (newTask: Partial<Task>, id?: string) => {
        try {
            const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });


            if (id) {
                // Handle task update
                let taskToSubmit: Task | null = null;

                setTasks((prevTasks) => {
                    const updatedTasks = [...prevTasks];
                    const taskIndex = updatedTasks.findIndex((task) => task.id === id);

                    if (taskIndex === -1) return prevTasks;

                    const taskToUpdate = updatedTasks[taskIndex];
                    const changes: string[] = [];

                    if (newTask.status && newTask.status !== taskToUpdate.status) {
                        changes.push(`status to ${newTask.status}`);
                        handleStatusChange(id, newTask.status);

                    }
                    if (newTask.dueDate && newTask.dueDate !== taskToUpdate.dueDate) {
                        changes.push(`due date to ${newTask.dueDate}`);
                    }
                    if (newTask.category && newTask.category !== taskToUpdate.category) {
                        changes.push(`category to ${newTask.category}`);
                    }
                    // Handle file uploads for updates
                    if (newTask.files && newTask.files.length > 0) {
                        changes.push(`attached files`);
                    }

                    if (changes.length > 0) {
                        const updatedTask = {
                            ...taskToUpdate,
                            ...newTask,

                            updatedDates: [
                                ...taskToUpdate.updatedDates,
                                {
                                    change: `You changed ${changes.join(' and ')}`,
                                    time: timestamp,
                                },
                            ],
                        };

                        taskToSubmit = updatedTask;
                        updatedTasks[taskIndex] = updatedTask;
                        return updatedTasks;
                    } else {
                        return prevTasks;
                    }
                });

                if (taskToSubmit) {
                    await updateTaskInDb(taskToSubmit);
                }
            } else {
                // Handle new task creation

                const allTasks = await new Promise<Task[]>((resolve) => {
                    setTasks((prevTasks) => {
                        resolve(prevTasks);
                        return prevTasks;
                    });
                });



                const initialStatus = newTask.status || "to-do";

                const tasksInStatus = allTasks.filter(t => t.status === initialStatus);
                const newIndex = generateTaskIndex(initialStatus, tasksInStatus.length);
                const newTaskObject: Task = {
                    id: '',
                    title: newTask.title || "",
                    description: newTask.description || "",
                    category: newTask.category || "Personal",
                    dueDate: newTask.dueDate || "",
                    status: initialStatus,
                    files: newTask.files || [],
                    createdDate: timestamp,
                    index: newIndex,
                    updatedDates: [
                        {
                            change: "Task created",
                            time: timestamp,
                        },
                    ],
                    userId: userDetails?.uid || "",
                };

                const createdTask = await createTaskInDb(newTaskObject);

                setTasks((prevTasks) => [...prevTasks, createdTask]);
            }
        } catch (error) {
            console.error("Error handling task:", error);
        }
    };




    const handleDeleteTask = async (taskId: string) => {
        try {
            await deleteTaskInDb(taskId);
            setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
            console.log("Task removed from the state.");
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };



    const toggleTaskSelection = async (taskId: string) => {

        setSelectedTasks((prevSelected) => {
            const newSelected = prevSelected.includes(taskId)
                ? prevSelected.filter((id) => id !== taskId)
                : [...prevSelected, taskId];

            // Open or close the modal based on the new selection
            if (newSelected.length > 0) {
                setModal2Open(true);
            } else {
                setModal2Open(false);
            }

            return newSelected;
        });
    };

    const handleStatusChange = async (taskId: string | undefined, newStatus: 'to-do' | 'inprogress' | 'completed') => {
        setTasks(prevTasks => {
            const newTasks = [...prevTasks];
            const taskToUpdate = newTasks.find(t => t.id === taskId);
            if (!taskToUpdate) return prevTasks;

            const tasksInNewStatus = newTasks.filter(t => t.status === newStatus);
            const newIndex = generateTaskIndex(newStatus, tasksInNewStatus.length);
            taskToUpdate.status = newStatus;
            taskToUpdate.index = newIndex;

            return newTasks.map(task => {
                if (task.id === taskId) return taskToUpdate;

                const statusTasks = newTasks.filter(t =>
                    t.status === task.status && t.id !== taskId
                );
                const position = statusTasks.findIndex(t => t.id === task.id);

                if (position !== -1) {
                    return {
                        ...task,
                        index: generateTaskIndex(task.status, position)
                    };
                }

                return task;
            });
        });

        try {
            const updatedTask = tasks.find(t => t.id === taskId);
            if (updatedTask) {
                await updateTaskInDb(updatedTask);
            }
        } catch (error) {
            console.error("Error updating task in Firestore:", error);
        }
    };

    const handleStatusChangeSelected = (newStatus: 'to-do' | 'inprogress' | 'completed') => {
        const updatedTasks: Task[] = [];
        setTasks(prevTasks => {
            const tasksWithUpdatedStatus = prevTasks.map(task => {
                if (selectedTasks.includes(task.id)) {
                    const tasksInNewStatus = prevTasks.filter(t => t.status === newStatus);
                    const newIndex = generateTaskIndex(newStatus, tasksInNewStatus.length);

                    const updatedTask = {
                        ...task,
                        status: newStatus,
                        index: newIndex,
                    };

                    updatedTasks.push(updatedTask);
                    return updatedTask;
                }
                return task;
            });

            // Re-index remaining tasks within their respective status groups
            return tasksWithUpdatedStatus.map((task, _, allTasks) => {
                const statusTasks = allTasks.filter(t => t.status === task.status);
                const position = statusTasks.findIndex(t => t.id === task.id);

                return {
                    ...task,
                    index: generateTaskIndex(task.status, position),
                };
            });
        });

        try {
            for (const task of updatedTasks) {
                updateTaskInDb(task);
            }
        } catch (error) {
            console.error("Error updating task in Firestore:", error);
        }

        setSelectedTasks([]);
        setModal2Open(false);
    };


    const handleDeleteSelected = async () => {
        try {

            await Promise.all(
                selectedTasks.map(async (taskId) => {
                    await deleteTaskInDb(taskId);
                })
            );
            setTasks((prevTasks) =>
                prevTasks.filter((task) => !selectedTasks.includes(task.id))
            );
            setSelectedTasks([]);
            setModal2Open(false);
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchQuery(e.target.value);
    };

    const openModal = () => {
        if (selectedTasks.length > 0) {
            setModal2Open(true);
        }
    };

    const closeModal = () => {
        setModal2Open(false);
        setSelectedTasks([]);
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
        setUserDetails({
            displayName: '',
            email: '',
            photoURL: '',
            uid: ''
        });
    };

    const renderFilePreview = (file: File) => {
        const fileType = file.type.split('/')[0];
        if (fileType === 'image') {
            return <img src={URL.createObjectURL(file)} alt={file.name} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />;
        } else if (file.type === 'application/pdf') {
            return <iframe src={URL.createObjectURL(file)} title={file.name} width="200" height="200" />;
        } return <span>{file.name}</span>;

    }

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (editorRef.current) {
            let text = editorRef.current.innerHTML;

            // Prevent input beyond 300 characters
            if (text.length > 300) {
                e.preventDefault();
                text = text.slice(0, 300);
                editorRef.current.innerHTML = text;
            }

            // Update char count and taskForm description with the content (trimmed if necessary)
            setCharCount(300 - text.length);
            setTaskForm({ ...taskForm, description: text });
        }
    };


    const applyFormatting = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
    };




    return (
        <div>

            <div className="home">


                <Header
                    handleLogout={handleLogout}
                    handleOpenModal={handleOpenModal}
                    searchQuery={searchQuery}
                    handleSearchChange={handleSearchChange}
                    setCategoryFilter={setCategoryFilter}
                    setDateRange={(dates: [Dayjs | null, Dayjs | null] | null) => {
                        setDateRange(dates ?? [null, null]);
                    }}
                />


                {viewType === 'board' ? <BoardView
                    tasks={tasks}
                    filteredTasks={filteredTasks}
                    selectedTasks={selectedTasks}
                    handleOpenModal={handleOpenModal}
                    handleDeleteTask={handleDeleteTask}
                    toggleTaskSelection={toggleTaskSelection}
                    openModal={openModal}
                    closeModal={closeModal}

                />
                    :
                    <KanbanView
                        tasks={tasks}
                        filteredTasks={filteredTasks}
                        selectedTasks={selectedTasks}
                        handleOpenModal={handleOpenModal}
                        handleDeleteTask={handleDeleteTask}
                        toggleTaskSelection={toggleTaskSelection}
                        openModal={openModal}
                        closeModal={closeModal}
                    />}

                <Modal
                    title={isEditMode ? 'Edit Task ' : 'Create Task '}
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    onOk={() => {

                        const errors: { [key: string]: string } = {};
                        if (!taskForm.title) errors.title = 'Title is required';
                        if (!taskForm.dueDate) errors.dueDate = 'Due date is required';


                        setFormErrors(errors);


                        if (Object.keys(errors).length === 0) {
                            const newTask: Partial<Task> = {
                                title: taskForm.title,
                                description: taskForm.description,
                                category: taskForm.category,
                                dueDate: taskForm.dueDate,
                                status: taskForm.status,
                                files: taskForm.files,
                            };
                            handleCreateOrUpdateTask(newTask, currentTask?.id);
                            handleCloseModal();
                        }
                    }}
                    style={{ minWidth: '60vw', maxHeight: '70vh' }}
                >
                    <div className="modalContainer">
                        {/* Form Section */}
                        <div className="formContainer">
                            <div className="form">
                                <label className="labelName" >Task Title<span style={{ color: 'red' }}>*</span></label>
                                {isEditMode ?
                                    <div className="taskTitle1">{taskForm.title}</div>
                                    :
                                    <input
                                        type="text"
                                        placeholder="Task Title"
                                        value={taskForm.title}
                                        onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                                        className="taskTitle2"
                                    />}

                                {formErrors.title && <span style={{ color: 'red' }}>{formErrors.title}</span>}

                                <label className="labelName">Description</label>
                                {isEditMode && currentTask ? <div className="description1"><div dangerouslySetInnerHTML={{ __html: currentTask.description || '' }}></div></div>
                                    : <div className="description2" >
                                        {/* Container for the Textarea and Toolbar */}
                                        <div style={{ position: "relative" }}>
                                            {/* Textarea */}
                                            <div
                                                ref={editorRef}
                                                contentEditable
                                                onInput={handleInput}
                                                onPaste={handlePaste}
                                                className="textArea"
                                                aria-placeholder='Description'
                                            />

                                            {/* Formatting toolbar */}
                                            <div >
                                                <button
                                                    onClick={() => applyFormatting("bold")}
                                                    className="buttonStyle"
                                                    title="Bold"
                                                >
                                                    <b>B</b>
                                                </button>
                                                <button
                                                    onClick={() => applyFormatting("italic")}
                                                    className="buttonStyle"
                                                    title="Italic"
                                                >
                                                    <i>I</i>
                                                </button>
                                                <button
                                                    onClick={() => applyFormatting("strikeThrough")}
                                                    className="buttonStyle"
                                                    title="Strikethrough"
                                                >
                                                    <s>S</s>
                                                </button>

                                            </div>

                                            {/* Character counter */}
                                            <div
                                                className="charCount"
                                                style={{ color: charCount < 20 ? "red" : "gray" }}
                                            >
                                                {charCount}/300 characters
                                            </div>
                                        </div>
                                    </div>}




                                <div className="taskRow">
                                    <div className="taskColumn">
                                        <label className="labelName">Category</label>
                                        <div className="column1">
                                            <button
                                                className="categoryButton"
                                                style={{
                                                    background: taskForm.category === 'Personal' ? '#7b1984' : '#fff',
                                                    color: taskForm.category === 'Personal' ? '#fff' : '#000',
                                                }}
                                                onClick={() => setTaskForm({ ...taskForm, category: 'Personal' })}
                                            >
                                                Personal
                                            </button>
                                            <button
                                                className="categoryButton"
                                                style={{
                                                    background: taskForm.category === 'Work' ? '#7b1984' : '#fff',
                                                    color: taskForm.category === 'Work' ? '#fff' : '#000',
                                                }}
                                                onClick={() => setTaskForm({ ...taskForm, category: 'Work' })}
                                            >
                                                Work
                                            </button>
                                        </div>
                                    </div>

                                    <div className="taskColumn">
                                        <label className="labelName">Status</label>
                                        <select
                                            value={taskForm.status}
                                            onChange={e => setTaskForm({ ...taskForm, status: e.target.value as 'to-do' | 'inprogress' | 'completed' })}
                                            className="statusDropdown"
                                        >
                                            <option value="to-do">To-Do</option>
                                            <option value="inprogress">InProgress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    <div className="taskColumn">
                                        <label className="labelName">
                                            Due Date<span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={taskForm.dueDate}
                                            onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                            className="statusDropdown"
                                        />
                                        {formErrors.dueDate && <span style={{ color: 'red' }}>{formErrors.dueDate}</span>}
                                    </div>
                                </div>


                                <label className="labelName">Attach Files</label>
                                <input type="file" multiple onChange={handleFileChange} ref={fileInputRef} style={{ marginBottom: '10px' }} />
                                {currentTask && currentTask.files.length > 0 && (
                                    <div className="filePadding">
                                        <h6 className="fileHeader" >Attached Files:</h6>
                                        <ul className="uList" >
                                            {currentTask?.files && currentTask.files.map((file, index) => <li key={index}>{file}</li>)}
                                            {taskForm.files.map((file, index) => (
                                                <li key={index}>{file}</li>
                                            ))}


                                        </ul>
                                    </div>
                                )}
                                {previewFiles.length > 0 && (
                                    <ul>
                                        {previewFiles.map((file, index) => (
                                            <li key={index} className="renderFile" >{renderFilePreview(file)}</li>
                                        ))}
                                    </ul>
                                )}

                            </div>
                        </div>

                        {/* Updates Section */}
                        {isEditMode && currentTask?.updatedDates && (
                            <div className="activityContainer">
                                <h5 className="activityHeader">Activity:</h5>
                                <ul className="uList">
                                    {currentTask.updatedDates && currentTask.updatedDates.map((update, index) => (
                                        <li key={index} className="list" >
                                            {update.change} <span className="listSpan" >{update.time}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </Modal>




                {selectedTasks.length > 0 && (
                    <div className="modal2">
                        <span>{selectedTasks.length} task(s) selected</span>
                        <div className="selectedTasks" >

                            <Dropdown>
                                <Dropdown.Toggle variant="primary" size="sm">
                                    Change Status
                                </Dropdown.Toggle>
                                <Dropdown.Menu >
                                    <Dropdown.Item onClick={() => handleStatusChangeSelected('to-do')} >To Do</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleStatusChangeSelected('inprogress')}>In Progress</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleStatusChangeSelected('completed')}>Completed</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleDeleteSelected}
                                className="modalDelete"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
};

export default Home;