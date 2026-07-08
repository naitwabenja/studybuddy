/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');
require('dotenv').config();

const { getFirebase } = require('./firebaseAdmin');

const { geminiChat, geminiEmbeddings } = require('./geminiGateway');

// Firestore collection/table: analyses



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Firebase (Firestore)
const { firestore } = getFirebase();



// File upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Rate limiting middleware
const userRequests = new Map();

const rateLimit = (req, res, next) => {
  const userId = req.headers['x-user-id'] || 'anonymous';
  const now = Date.now();
  const window = 24 * 60 * 60 * 1000; // 24 hours
  
  if (!userRequests.has(userId)) {
    userRequests.set(userId, []);
  }
  
  const userReqs = userRequests.get(userId);
  userReqs = userReqs.filter(time => now - time < window);
  
  if (userReqs.length >= 5 && !req.headers['x-subscription']) {
    return res.status(429).json({ error: 'Free limit reached (5/day). Upgrade to Pro!' });
  }
  
  userReqs.push(now);
  userRequests.set(userId, userReqs);
  next();
};

// OCR Function
async function extractTextFromImage(buffer) {
  try {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
      logger: m => console.log(m)
    });
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('OCR extraction failed');
  }
}

// DeepSeek AI Integration
async function getAIExplanation(assignmentText) {
  const systemPrompt = `You are an expert teacher and academic guide.

Your role is NOT to complete assignments for students, but to help them understand what is being asked and how to approach it with clarity and confidence.

A student will provide:
- Assignment text (possibly unclear or complex)
- OR an image/PDF converted via OCR

Your job is to transform that into a simple, structured explanation.

Follow these rules strictly:
1. DO NOT provide full answers, completed essays, or direct solutions.
2. DO provide guidance, structure, and examples that help the student start independently.
3. Use simple, clear language (as if explaining to a beginner).
4. Break down hidden expectations teachers often assume students understand.
5. Make the output feel like a supportive teacher guiding step-by-step.

---

### OUTPUT FORMAT (ALWAYS FOLLOW THIS STRUCTURE)

📌 WHAT THIS ASSIGNMENT IS ABOUT  
- Explain the purpose of the assignment in plain language  
- Identify the subject area and core theme  

🎯 WHAT YOU NEED TO DO (SIMPLIFIED)  
- Translate the instructions into clear, actionable tasks  
- Remove academic jargon  

🪜 STEP-BY-STEP PLAN  
- Step 1 → Step N (logical workflow)  
- Include thinking steps, not just actions  

⚠️ WHAT TEACHERS ARE LOOKING FOR  
- Hidden grading criteria  
- Common mistakes to avoid  
- Depth, clarity, referencing expectations  

🧠 KEY CONCEPTS YOU SHOULD UNDERSTAND  
- List and briefly explain important ideas or topics  
- Keep explanations short and digestible  

---

### CONVERT INTO ACTIONABLE WORKFLOW

Rewrite the assignment into a checklist like this:

- Choose a topic  
- Research reliable sources  
- Write introduction  
- Develop main points  
- Add references  

---

### AUTO-GENERATE SUPPORT MATERIALS

Provide:

1. ESSAY OUTLINE  
- Introduction  
- Body Paragraph 1  
- Body Paragraph 2  
- Conclusion  

2. REPORT STRUCTURE (if applicable)  
- Title Page  
- Abstract (if needed)  
- Methodology / Discussion  
- Conclusion  

3. SLIDE BREAKDOWN (if presentation)  
- Slide 1 → Title  
- Slide 2 → Overview  
- etc.

---

### "START FOR ME" (ETHICAL GUIDANCE ONLY)

Provide ONLY:
- A sample introduction paragraph (generic, not answering the full assignment)
- A sample thesis statement
- An opening idea or angle

DO NOT:
- Complete the assignment
- Provide full body paragraphs answering the task

---

### TONE & STYLE
- Clear
- Encouraging
- Structured
- Teacher-like (not robotic)

---

### INPUT:
${assignmentText}

### OUTPUT:
(Structured response following all sections above)`;

  try {
    const explanation = await geminiChat({
      model: 'gemini-2.5-flash',
      systemPrompt,
      userText: assignmentText,
      max_tokens: 4000,
      temperature: 0.7
    });

    return explanation;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('AI processing failed');
  }
}

// Routes
app.post('/api/embeddings', async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ error: 'Input text is required' });
    }

    const result = await geminiEmbeddings({
      model: 'text-embedding-004',
      input
    });

    res.json(result);
  } catch (error) {
    console.error('Embeddings route error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze', rateLimit, upload.single('file'), async (req, res) => {
  try {
    let assignmentText = req.body.text || '';

    // Handle file upload
    if (req.file) {
      const extractedText = await extractTextFromImage(req.file.buffer);
      assignmentText = extractedText;
    }

    if (!assignmentText.trim()) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Get AI explanation
    const explanation = await getAIExplanation(assignmentText);

    // Save to database (Firestore)
    const userId = req.headers['x-user-id'] || 'anonymous';

    const docData = {
      user_id: userId,
      assignment_text: assignmentText,
      explanation: explanation,
      is_pro: !!req.headers['x-subscription'],
      created_at: new Date().toISOString()
    }

    await firestore.collection('analyses').add(docData)

    res.json({ explanation });
  } catch (error) {

    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history/:userId', async (req, res) => {
  try {
    const userId = req.params.userId

    const snapshot = await firestore
      .collection('analyses')
      .where('user_id', '==', userId)
      .get()

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))

    // Sort in-memory to prevent FAILED_PRECONDITION (requiring a composite index in Firestore)
    data.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
      return timeB - timeA
    })

    const limitedData = data.slice(0, 10)

    res.json(limitedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});