const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection string - REPLACE WITH YOUR MONGODB ATLAS CONNECTION STRING
const MONGODB_URI = process.env.MONGODB_URI || 'Here_Put_Your_MongoDB_Connection_String';
const DB_NAME = 'userManagementDB';
const COLLECTION_NAME = 'users';

let db;
let usersCollection;

// Connect to MongoDB
async function connectToDatabase() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('Connected to MongoDB successfully!');
        
        db = client.db(DB_NAME);
        usersCollection = db.collection(COLLECTION_NAME);
        
        // Create index for faster searches
        await usersCollection.createIndex({ firstName: 1, lastName: 1 });
        
        // Optional: Add default users if collection is empty
        const count = await usersCollection.countDocuments();
        if (count === 0) {
            await insertDefaultUsers();
        }
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

// Insert default users
async function insertDefaultUsers() {
    const defaultUsers = [
        { firstName: "John", lastName: "Doe", email: "john.doe@email.com", age: 28, password: "password123", role: "user" },
        { firstName: "Jane", lastName: "Smith", email: "jane.smith@email.com", age: 32, password: "password123", role: "admin" },
        { firstName: "Alice", lastName: "Johnson", email: "alice.j@email.com", age: 25, password: "password123", role: "user" },
        { firstName: "Bob", lastName: "Williams", email: "bob.w@email.com", age: 45, password: "password123", role: "user" },
        { firstName: "Charlie", lastName: "Brown", email: "charlie.b@email.com", age: 38, password: "password123", role: "moderator" },
        { firstName: "Diana", lastName: "Davis", email: "diana.d@email.com", age: 29, password: "password123", role: "user" },
        { firstName: "Eve", lastName: "Martinez", email: "eve.m@email.com", age: 41, password: "password123", role: "user" },
        { firstName: "Frank", lastName: "Garcia", email: "frank.g@email.com", age: 35, password: "password123", role: "admin" },
        { firstName: "Grace", lastName: "Wilson", email: "grace.w@email.com", age: 27, password: "password123", role: "user" },
        { firstName: "Henry", lastName: "Anderson", email: "henry.a@email.com", age: 50, password: "password123", role: "user" }
    ];
    
    await usersCollection.insertMany(defaultUsers);
    console.log('Default users inserted successfully!');
}

// Routes

// GET all users with optional sorting and searching
app.get('/api/users', async (req, res) => {
    try {
        const { sortBy, order, search } = req.query;
        
        let query = {};
        
        // Search functionality
        if (search) {
            query = {
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        // Prepare sort options
        let sortOptions = {};
        if (sortBy) {
            const sortOrder = order === 'desc' ? -1 : 1;
            sortOptions[sortBy] = sortOrder;
        }
        
        const users = await usersCollection.find(query).sort(sortOptions).toArray();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET single user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await usersCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// POST - Create new user
app.post('/api/users', async (req, res) => {
    try {
        const { firstName, lastName, email, age, password, role } = req.body;
        
        // Validation
        if (!firstName || !lastName || !email || !age) {
            return res.status(400).json({ error: 'firstName, lastName, email, and age are required' });
        }
        
        // Check if email already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        const newUser = {
            firstName,
            lastName,
            email,
            age: parseInt(age),
            password: password || 'defaultPassword',
            role: role || 'user',
            createdAt: new Date()
        };
        
        const result = await usersCollection.insertOne(newUser);
        const insertedUser = await usersCollection.findOne({ _id: result.insertedId });
        
        res.status(201).json(insertedUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT - Update existing user
app.put('/api/users/:id', async (req, res) => {
    try {
        const { firstName, lastName, email, age, password, role } = req.body;
        
        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;
        if (age) updateData.age = parseInt(age);
        if (password) updateData.password = password;
        if (role) updateData.role = role;
        updateData.updatedAt = new Date();
        
        const result = await usersCollection.findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        
        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE - Delete user
app.delete('/api/users/:id', async (req, res) => {
    try {
        const result = await usersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully', deletedCount: result.deletedCount });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Start server
connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});
