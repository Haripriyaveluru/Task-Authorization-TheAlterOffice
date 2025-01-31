import React, { createContext, useContext, useState } from 'react';

export interface Task {
    id: string;
    title: string;
    description: string;
    category: 'Personal' | 'Work';
    dueDate: string;
    status: 'to-do' | 'inprogress' | 'completed';
    files: string[];
    createdDate: string;
    updatedDates: {
        change: string;
        time: string;
    }[];
    index: number;
    userId: string;
}

export interface UserInfo {
    uid: string | null;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;


}



interface TaskContextType {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    userDetails: UserInfo | null;
    setUserDetails: React.Dispatch<React.SetStateAction<UserInfo | null>>;
    viewType: 'kanban' | 'board';
    setViewType: React.Dispatch<React.SetStateAction<'kanban' | 'board'>>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [userDetails, setUserDetails] = useState<UserInfo | null>(null);
    const [viewType, setViewType] = useState<('kanban' | 'board')>('board');

    return (

        <TaskContext.Provider value={{ tasks, setTasks, userDetails, setUserDetails, viewType, setViewType }}>
            {children}
        </TaskContext.Provider>

    );
};

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTaskContext must be used within a TaskProvider');
    }
    return context;
};