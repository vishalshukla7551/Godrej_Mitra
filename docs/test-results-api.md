# Test Results API Documentation

## Overview
This document describes the API endpoints for fetching SEC test submissions and viewing detailed answer breakdowns in the Admin Test Results page.

## API Endpoints

### 1. Get All Test Submissions

**Endpoint:** `GET /api/admin/test-submissions`

**Description:** Fetches all test submissions with enriched question/answer data and store information.

**Query Parameters:**
- `secId` (optional): Filter by SEC ID or phone number
- `status` (optional): Filter by pass/fail status (`pass` | `fail`)
- `limit` (optional): Limit number of results (default: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Example Request:**
```javascript
// Fetch all submissions
const response = await fetch('/api/admin/test-submissions');

// Fetch submissions for specific SEC
const response = await fetch('/api/admin/test-submissions?secId=9876543210');

// Fetch only passed submissions
const response = await fetch('/api/admin/test-submissions?status=pass');

// Paginated results
const response = await fetch('/api/admin/test-submissions?limit=20&offset=40');
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "submission_id_123",
      "secId": "9876543210",
      "phone": "9876543210",
      "sessionToken": "session_12345",
      "testName": "Samsung Protect Max Certification",
      "responses": [
        {
          "questionId": 1,
          "selectedAnswer": "A",
          "answeredAt": "2025-12-20T10:30:00.000Z",
          "questionText": "What is the coverage period...",
          "options": ["A) 1 Year", "B) 2 Years", ...],
          "correctAnswer": "A",
          "isCorrect": true
        }
      ],
      "score": 85,
      "totalQuestions": 10,
      "completionTime": 420,
      "submittedAt": "2025-12-20T10:35:00.000Z",
      "isProctoringFlagged": false,
      "storeId": "store_001",
      "storeName": "Croma - Mumbai Central",
      "storeCity": "Mumbai",
      "screenshotUrls": []
    }
  ],
  "meta": {
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

---

### 2. Get Single Test Submission Details

**Endpoint:** `GET /api/admin/test-submissions/[id]`

**Description:** Fetches detailed information for a specific test submission, including question-by-question breakdown showing correct/incorrect answers.

**Example Request:**
```javascript
const submissionId = 'submission_id_123';
const response = await fetch(`/api/admin/test-submissions/${submissionId}`);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "submission_id_123",
    "secId": "9876543210",
    "phone": "9876543210",
    "sessionToken": "session_12345",
    "testName": "Samsung Protect Max Certification",
    "score": 85,
    "totalQuestions": 10,
    "completionTime": 420,
    "submittedAt": "2025-12-20T10:35:00.000Z",
    "isProctoringFlagged": false,
    "storeId": "store_001",
    "storeName": "Croma - Mumbai Central",
    "storeCity": "Mumbai",
    "status": "PASS",
    "correctAnswers": 8,
    "wrongAnswers": 2,
    "responses": [
      {
        "questionNumber": 1,
        "questionId": 1,
        "questionText": "What is the coverage period for Samsung Protect Max ADLD plan?",
        "options": [
          "A) 1 Year",
          "B) 2 Years",
          "C) 6 Months",
          "D) 3 Years"
        ],
        "selectedAnswer": "A",
        "correctAnswer": "A",
        "isCorrect": true,
        "answeredAt": "2025-12-20T10:30:00.000Z",
        "category": "Section C"
      },
      {
        "questionNumber": 2,
        "questionId": 11,
        "questionText": "You're trying to convince a hesitant customer...",
        "options": [...],
        "selectedAnswer": "C",
        "correctAnswer": "B",
        "isCorrect": false,
        "answeredAt": "2025-12-20T10:31:00.000Z",
        "category": "Section B"
      }
    ]
  }
}
```

---

### 3. Get Test Statistics

**Endpoint:** `GET /api/admin/test-submissions/statistics`

**Description:** Returns aggregated statistics for all test submissions.

**Example Request:**
```javascript
const response = await fetch('/api/admin/test-submissions/statistics');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSubmissions": 156,
    "averageScore": 72,
    "passRate": 85,
    "averageTime": 385
  }
}
```

**Response Fields:**
- `totalSubmissions`: Total number of test submissions
- `averageScore`: Average test score (percentage)
- `passRate`: Percentage of tests that passed (score >= 60%)
- `averageTime`: Average completion time in seconds

---

## Frontend Integration

### Using the Helper Functions

The `/src/lib/testData.ts` file provides convenient helper functions:

```typescript
import { 
  getTestSubmissions, 
  getTestSubmissionDetails,
  getTestStatistics 
} from '@/lib/testData';

// In your React component:
const [submissions, setSubmissions] = useState([]);
const [stats, setStats] = useState({});

useEffect(() => {
  async function fetchData() {
    // Fetch all submissions
    const data = await getTestSubmissions();
    setSubmissions(data);

    // Fetch statistics
    const statistics = await getTestStatistics();
    setStats(statistics);
  }
  fetchData();
}, []);

// View individual submission details
const handleViewAnswers = async (submissionId) => {
  const details = await getTestSubmissionDetails(submissionId);
  console.log('Submission details:', details);
  // Navigate to answer review page with details
};
```

---

## Database Schema

The test submissions are stored in the `TestSubmission` collection with the following fields:

```prisma
model TestSubmission {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  secId               String?  // SEC identifier
  phone               String?  // SEC phone number
  sessionToken        String?  // Test session identifier
  testName            String?  // Name of the test taken
  responses           Json?    // Test answers/responses array
  score               Int      // Test score achieved (0-100)
  totalQuestions      Int      // Total number of questions
  completionTime      Int      // Time taken in seconds
  isProctoringFlagged Boolean  @default(false)
  storeId             String?  // Store identifier
  storeName           String?  // Store name
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

## Response Enrichment

The API automatically enriches test responses with question details:

**Raw database response:**
```json
{
  "questionId": 1,
  "selectedAnswer": "A",
  "answeredAt": "2025-12-20T10:30:00.000Z"
}
```

**Enriched API response:**
```json
{
  "questionId": 1,
  "selectedAnswer": "A",
  "answeredAt": "2025-12-20T10:30:00.000Z",
  "questionText": "What is the coverage period for Samsung Protect Max ADLD plan?",
  "options": ["A) 1 Year", "B) 2 Years", "C) 6 Months", "D) 3 Years"],
  "correctAnswer": "A",
  "isCorrect": true,
  "category": "Section C"
}
```

The enrichment process:
1. Retrieves the phone number from the submission
2. Generates the same questions shown to that user during their test
3. Maps each response to its corresponding question
4. Calculates if the answer was correct

---

## UI Implementation Guide

### Test Results Table

Display all submissions in the admin panel:

```tsx
<table>
  <thead>
    <tr>
      <th>SEC ID</th>
      <th>Store</th>
      <th>Score</th>
      <th>Questions</th>
      <th>Time</th>
      <th>Submitted</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {submissions.map((submission) => (
      <tr key={submission.id}>
        <td>{submission.secId}</td>
        <td>{submission.storeName}</td>
        <td>{submission.score}%</td>
        <td>{submission.responses.length}/{submission.totalQuestions}</td>
        <td>{formatTime(submission.completionTime)}</td>
        <td>{new Date(submission.submittedAt).toLocaleString()}</td>
        <td>
          <span className={submission.score >= 60 ? 'pass' : 'fail'}>
            {submission.score >= 60 ? 'PASS' : 'FAIL'}
          </span>
        </td>
        <td>
          <button onClick={() => viewAnswers(submission.id)}>
            View Answers
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Answer Details Page

Show question-by-question breakdown:

```tsx
const AnswerDetailsPage = ({ submissionId }) => {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    async function loadDetails() {
      const data = await getTestSubmissionDetails(submissionId);
      setDetails(data);
    }
    loadDetails();
  }, [submissionId]);

  return (
    <div>
      <h1>Test Results for {details?.secId}</h1>
      <div>
        <p>Score: {details?.score}%</p>
        <p>Correct: {details?.correctAnswers}</p>
        <p>Wrong: {details?.wrongAnswers}</p>
      </div>

      {details?.responses.map((response) => (
        <div key={response.questionNumber} 
             className={response.isCorrect ? 'correct' : 'incorrect'}>
          <h3>Question {response.questionNumber}</h3>
          <p>{response.questionText}</p>
          
          {response.options.map((option, idx) => (
            <div key={idx} className={
              option.startsWith(response.selectedAnswer) ? 'selected' :
              option.startsWith(response.correctAnswer) ? 'correct-answer' : ''
            }>
              {option}
            </div>
          ))}

          <div className="result">
            {response.isCorrect ? (
              <span className="badge-correct">✓ Correct</span>
            ) : (
              <span className="badge-wrong">
                ✗ Wrong • Correct answer: {response.correctAnswer}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Error Handling

All endpoints return a consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common error codes:
- `404`: Submission not found
- `500`: Server error

Example error handling:

```typescript
try {
  const data = await getTestSubmissions();
  if (data.length === 0) {
    // No submissions found, show empty state
  }
} catch (error) {
  console.error('Failed to fetch submissions:', error);
  // Show error message to user
}
```

---

## Performance Considerations

1. **Pagination**: Use `limit` and `offset` for large datasets
2. **Caching**: Results are not cached - implement client-side caching if needed
3. **Filtering**: Use server-side filtering (`secId`, `status`) instead of client-side
4. **Question Generation**: Questions are deterministically generated per phone number

---

## Next Steps

1. **Implement answer details page** in `/Zopper-Administrator/answer-details`
2. **Add filtering UI** for score ranges, date ranges, store selection
3. **Export functionality** to download results with question details
4. **Screenshot integration** when proctoring system is implemented

---

## Testing

Test the APIs using curl or Postman:

```bash
# Get all submissions
curl http://localhost:3000/api/admin/test-submissions

# Get specific submission
curl http://localhost:3000/api/admin/test-submissions/[id]

# Get statistics
curl http://localhost:3000/api/admin/test-submissions/statistics

# Filter by SEC ID
curl http://localhost:3000/api/admin/test-submissions?secId=9876543210

# Filter passed tests
curl http://localhost:3000/api/admin/test-submissions?status=pass
```
