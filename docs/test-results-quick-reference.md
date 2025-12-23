# Test Results API - Quick Reference

## 🚀 Quick Start

### Fetch All Test Submissions
```javascript
import { getTestSubmissions } from '@/lib/testData';
const submissions = await getTestSubmissions();
```

### Fetch Specific SEC's Results  
```javascript
const submissions = await getTestSubmissions('9876543210');
```

### View Individual Answers
```javascript
import { getTestSubmissionDetails } from '@/lib/testData';
const details = await getTestSubmissionDetails(submissionId);
```

### Get Statistics
```javascript
import { getTestStatistics } from '@/lib/testData';
const stats = await getTestStatistics();
```

---

## 📡 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/test-submissions` | GET | All submissions with filters |
| `/api/admin/test-submissions/[id]` | GET | Single submission with answers |
| `/api/admin/test-submissions/statistics` | GET | Aggregated statistics |

---

## 🔍 Query Parameters

### GET /api/admin/test-submissions

| Param | Type | Description | Example |
|-------|------|-------------|---------|
| `secId` | string | Filter by SEC ID/phone | `?secId=9876543210` |
| `status` | string | Filter by pass/fail | `?status=pass` |
| `limit` | number | Results per page | `?limit=50` |
| `offset` | number | Pagination offset | `?offset=100` |

**Examples:**
```
/api/admin/test-submissions                          // All submissions
/api/admin/test-submissions?secId=9876543210         // Specific SEC
/api/admin/test-submissions?status=pass              // Only passed
/api/admin/test-submissions?limit=20&offset=40       // Page 3 (20 per page)
/api/admin/test-submissions?secId=123&status=fail    // Failed tests for SEC 123
```

---

## 📊 Response Format

### Test Submission Object
```typescript
{
  id: string;                    // Unique submission ID
  secId: string;                 // SEC identifier
  phone: string;                 // Phone number
  score: number;                 // 0-100
  totalQuestions: number;        // Usually 10
  completionTime: number;        // Seconds
  submittedAt: string;           // ISO timestamp
  storeName: string;             // Store name
  storeCity: string;             // City
  isProctoringFlagged: boolean;  // Violation flag
  responses: [{
    questionId: number;
    questionText: string;
    options: string[];
    selectedAnswer: string;      // A, B, C, or D
    correctAnswer: string;       // A, B, C, or D
    isCorrect: boolean;          // true/false
  }]
}
```

### Statistics Object
```typescript
{
  totalSubmissions: number;      // Total count
  averageScore: number;          // Average % (0-100)
  passRate: number;              // % passed (score >= 60)
  averageTime: number;           // Average seconds
}
```

---

## 🎨 UI Components

### Display Score Badge
```tsx
const ScoreBadge = ({ score }) => (
  <span className={`badge ${
    score >= 80 ? 'excellent' :
    score >= 60 ? 'pass' :
    'fail'
  }`}>
    {score}%
  </span>
);
```

### Show Correct/Wrong Indicator
```tsx
const AnswerIndicator = ({ isCorrect, correctAnswer }) => (
  <div className={isCorrect ? 'correct' : 'wrong'}>
    {isCorrect ? (
      <span>✓ Correct</span>
    ) : (
      <span>✗ Wrong - Correct: {correctAnswer}</span>
    )}
  </div>
);
```

### Format Time Display
```tsx
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};
```

---

## 🔧 Common Use Cases

### 1. Show all test results in table
```typescript
const [submissions, setSubmissions] = useState([]);

useEffect(() => {
  async function loadData() {
    const data = await getTestSubmissions();
    setSubmissions(data);
  }
  loadData();
}, []);
```

### 2. View answers for specific test
```typescript
const router = useRouter();

const handleViewAnswers = (submissionId) => {
  router.push(`/answer-details?id=${submissionId}`);
};
```

### 3. Filter by pass/fail status
```typescript
const passedTests = submissions.filter(s => s.score >= 60);
const failedTests = submissions.filter(s => s.score < 60);
```

### 4. Show question breakdown
```typescript
const AnswerBreakdown = ({ responses }) => (
  <div>
    {responses.map((r, i) => (
      <div key={i} className={r.isCorrect ? 'correct' : 'wrong'}>
        <h4>Q{i+1}: {r.questionText}</h4>
        <p>Selected: {r.selectedAnswer}</p>
        <p>Correct: {r.correctAnswer}</p>
        <p>{r.isCorrect ? '✓ Correct' : '✗ Wrong'}</p>
      </div>
    ))}
  </div>
);
```

---

## 🎯 Data Fields Reference

### Available in All Submissions List

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID |
| `secId` | string | SEC identifier |
| `phone` | string | Phone number |
| `score` | number | Test score (0-100) |
| `totalQuestions` | number | Total questions |
| `completionTime` | number | Time in seconds |
| `submittedAt` | string | Submission timestamp |
| `storeName` | string | Store name |
| `storeCity` | string | Store city |
| `isProctoringFlagged` | boolean | Violation flag |
| `responses.length` | number | Questions attempted |

### Additional in Individual Submission

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | "PASS" or "FAIL" |
| `correctAnswers` | number | Count of correct |
| `wrongAnswers` | number | Count of wrong |
| `responses[].questionText` | string | Full question |
| `responses[].options` | array | All options |
| `responses[].isCorrect` | boolean | Answer correctness |
| `responses[].category` | string | Question section |

---

## ⚡ Performance Tips

1. **Use pagination** for large datasets:
   ```javascript
   const submissions = await fetch(
     '/api/admin/test-submissions?limit=50&offset=0'
   );
   ```

2. **Server-side filtering** instead of client-side:
   ```javascript
   // Good ✓
   const passed = await fetch('/api/admin/test-submissions?status=pass');
   
   // Avoid ✗
   const all = await getTestSubmissions();
   const passed = all.filter(s => s.score >= 60);
   ```

3. **Cache statistics** if they don't need real-time updates:
   ```javascript
   const [stats, setStats] = useState(null);
   useEffect(() => {
     if (!stats) {
       getTestStatistics().then(setStats);
     }
   }, []);
   ```

---

## 🐛 Debugging

### Check API Response
```javascript
fetch('/api/admin/test-submissions')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e));
```

### Verify Database Records
```javascript
// In MongoDB or Prisma Studio
// Collection: TestSubmission
// Check if records exist and have phone/secId field
```

### Test Question Generation
```javascript
import { getQuestionsForPhone } from '@/lib/testData';
const questions = getQuestionsForPhone('9876543210');
console.log('Generated questions:', questions);
```

---

## 📝 Checklist for Integration

- [ ] API routes accessible
- [ ] Database has TestSubmission records
- [ ] Frontend helper functions work
- [ ] Test results page displays submissions
- [ ] View button links to answer details
- [ ] Answer details page created
- [ ] Correct/wrong answers shown
- [ ] Statistics display correctly
- [ ] Filters working (pass/fail, SEC ID)
- [ ] Export includes answer details

---

## 🔗 Related Files

- `/src/app/api/admin/test-submissions/route.ts` - Main submissions API
- `/src/app/api/admin/test-submissions/[id]/route.ts` - Individual details API
- `/src/app/api/admin/test-submissions/statistics/route.ts` - Statistics API
- `/src/lib/testData.ts` - Helper functions
- `/src/app/Zopper-Administrator/test-results/page.tsx` - Results page
- `/docs/test-results-api.md` - Full documentation
- `/prisma/schema.prisma` - Database schema

---

## 💡 Tips

1. **Phone number is key** - Used to regenerate test questions
2. **Deterministic questions** - Same phone = same 10 questions
3. **Auto-enrichment** - Responses automatically include question details
4. **Store lookup** - Store info fetched automatically if storeId exists
5. **Pass threshold** - Score >= 60% is considered passing

---

## 🎓 Example Usage Flow

```typescript
// 1. Page loads
useEffect(() => {
  loadSubmissions();
}, []);

// 2. Fetch submissions
const loadSubmissions = async () => {
  const data = await getTestSubmissions();
  setSubmissions(data);
};

// 3. User clicks "View Answers"
const handleView = async (id) => {
  const details = await getTestSubmissionDetails(id);
  setSelectedTest(details);
  setShowModal(true);
};

// 4. Display answers
{selectedTest?.responses.map((r, i) => (
  <QuestionCard
    key={i}
    number={i+1}
    text={r.questionText}
    selected={r.selectedAnswer}
    correct={r.correctAnswer}
    isCorrect={r.isCorrect}
  />
))}
```

---

**Last Updated:** December 20, 2025  
**Version:** 1.0
