import { db } from './Firebase'; // Adjust the path to your Firebase configuration file
import { Task } from '../context/Context'; // Adjust the path to your Task type definition
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export const createTaskInDb = async (task: Task): Promise<Task> => {
    try {
        const { id, ...taskWithoutId } = task;
        const docRef = await addDoc(collection(db, "tasks"), taskWithoutId);
        return { ...taskWithoutId, id: docRef.id };
    } catch (error) {
        console.error("Error creating task in Firestore:", error);
        throw error;
    }
};


export const updateTaskInDb = async (task: Task) => {
    try {
        if (!task.id) {
            throw new Error("Task ID is missing.");
        }
        const taskRef = doc(db, "tasks", task.id);
        const { id, ...updateData } = task;
        await updateDoc(taskRef, updateData);

        console.log("Task updated successfully.");
    } catch (error) {
        console.error("Error updating task in Firestore:", error);
    }
};

export const deleteTaskInDb = async (taskId: string) => {
    try {
        if (!taskId) {
            throw new Error("Task ID is required for deletion.");
        }
        const taskRef = doc(db, "tasks", taskId);
        await deleteDoc(taskRef);
        console.log("Task deleted successfully.");
    } catch (error) {
        console.error("Error deleting task in Firestore:", error);
    }
};