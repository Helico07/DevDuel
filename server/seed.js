import mongoose from "mongoose";
import dotenv from "dotenv";
import { Question } from "./models/question.model.js"; // ✅ Adjusted for your structure
import { DB_NAME } from "./const.js";

// Load env variables to get MONGODB_URI
dotenv.config({
    path: "./.env"
});

const sampleQuestions = [
    // --- DSA Questions ---
    {
        title: "What is the time complexity of Binary Search?",
        options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
        correctOption: 1, // "O(log n)"
        category: "DSA",
        difficulty: "Easy"
    },
    {
        title: "Which data structure follows LIFO?",
        options: ["Queue", "Stack", "Tree", "Graph"],
        correctOption: 1, // "Stack"
        category: "DSA",
        difficulty: "Easy"
    },
    {
        title: "In a Max-Heap, the parent is always ___ than the child.",
        options: ["Smaller", "Greater", "Equal", "None"],
        correctOption: 1, 
        category: "DSA",
        difficulty: "Medium"
    },

    // --- OS Questions ---
    {
        title: "Which is NOT a CPU scheduling algorithm?",
        options: ["Round Robin", "SJF", "LIFO", "Banker's Algorithm"],
        correctOption: 3, // Banker's is for Deadlock, not scheduling
        category: "OS",
        difficulty: "Medium"
    },
    {
        title: "What is 'Thrashing'?",
        options: ["High CPU usage", "Excessive paging", "Hard disk failure", "Network lag"],
        correctOption: 1,
        category: "OS",
        difficulty: "Hard"
    },

    // --- DBMS Questions ---
    {
        title: "What does SQL stand for?",
        options: ["Structured Question Language", "Structured Query Language", "Simple Query Language", "None"],
        correctOption: 1,
        category: "DBMS",
        difficulty: "Easy"
    },
    {
        title: "Which normal form deals with partial dependency?",
        options: ["1NF", "2NF", "3NF", "BCNF"],
        correctOption: 1, // 2NF removes partial dependency
        category: "DBMS",
        difficulty: "Hard"
    }
];

// Duplicate the data to reach ~50 questions easily
const extendedData = [
    ...sampleQuestions, 
    ...sampleQuestions, 
    ...sampleQuestions, 
    ...sampleQuestions,
    ...sampleQuestions,
    ...sampleQuestions
];

const seedDB = async () => {
 
            try {
                const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
                console.log(`Mongo DB connected successfully ! DB host : ${connectionInstance.connection.host}`)
                await Question.deleteMany({});
        console.log("🗑️  Cleared existing questions");

        // 2. Insert new questions
        await Question.insertMany(extendedData);
        console.log(`🌱 Successfully seeded ${extendedData.length} questions!`);
            } catch (error) {
                console.log("Mongo DB connection Failed" , error)
                process.exit(1)
            }
    
};

seedDB();