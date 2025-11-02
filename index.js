const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = "mongodb+srv://learnFirstAdmin:mT4aOUQ8IeZlGqf6@khareedofrokht.h4nje.mongodb.net/theapainvisa?retryWrites=true&w=majority&appName=khareedofrokht";
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.log('❌ MongoDB connection error:', err));

// Cookie Data Schema
const cookieDataSchema = new mongoose.Schema({
    url: { type: String, required: true },
    domain: { type: String, required: true },
    userAgent: { type: String, required: true },
    cookies: [{
        name: String,
        value: String,
        domain: String,
        path: String,
        secure: Boolean,
        httpOnly: Boolean,
        expirationDate: Number,
        sameSite: String
    }],
    exportDate: { type: Date, default: Date.now },
    sessionId: { type: String, unique: true }
});

const CookieData = mongoose.model('CookieData', cookieDataSchema);

// Routes

// 1. Save cookies and user agent
app.post('/api/save-cookies', async (req, res) => {
    try {
        const { url, domain, userAgent, cookies, sessionId } = req.body;
        
        if (!url || !userAgent || !cookies) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: url, userAgent, cookies' 
            });
        }

        const cookieData = new CookieData({
            url,
            domain: domain || new URL(url).hostname,
            userAgent,
            cookies,
            sessionId: sessionId || generateSessionId()
        });

        await cookieData.save();
        
        res.json({
            success: true,
            message: 'Cookies saved successfully',
            sessionId: cookieData.sessionId,
            id: cookieData._id
        });
        
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 2. Get cookies and user agent by sessionId
app.get('/api/get-cookies/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const cookieData = await CookieData.findOne({ sessionId });
        
        if (!cookieData) {
            return res.status(404).json({ 
                success: false, 
                error: 'Cookie data not found' 
            });
        }

        res.json({
            success: true,
            data: {
                url: cookieData.url,
                domain: cookieData.domain,
                userAgent: cookieData.userAgent,
                cookies: cookieData.cookies,
                exportDate: cookieData.exportDate,
                sessionId: cookieData.sessionId
            }
        });
        
    } catch (error) {
        console.error('Get error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 3. Get all saved sessions (optional)
app.get('/api/sessions', async (req, res) => {
    try {
        const sessions = await CookieData.find({}, 'url domain userAgent exportDate sessionId')
            .sort({ exportDate: -1 });
        
        res.json({
            success: true,
            sessions
        });
        
    } catch (error) {
        console.error('Sessions error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 4. Delete session by sessionId
app.delete('/api/delete-cookies/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const result = await CookieData.deleteOne({ sessionId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Cookie data not found' 
            });
        }

        res.json({
            success: true,
            message: 'Cookie data deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Helper function to generate session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 MongoDB: ${MONGODB_URI}`);
});