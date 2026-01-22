# Dashboard Page Load Flow - Complete Summary

## Jab tum `/canvasser/home` page kholta ho:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Browser URL bar mein type karta ho                              │
│ URL: http://localhost:3000/canvasser/home                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Next.js Router page load karta hai                              │
│ File: src/app/canvasser/layout.tsx (parent layout)                      │
│ File: src/app/canvasser/home/page.tsx (actual page)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Layout.tsx render hota hai                                      │
│ File: src/app/canvasser/layout.tsx                                      │
│                                                                          │
│ useRequireAuth(['CANVASSER']) hook call hota hai                        │
│ ├─ localStorage se 'authUser' read karta hai                            │
│ ├─ authUser check karta hai (exist karta hai ya nahi?)                  │
│ ├─ role check karta hai (CANVASSER hai ya nahi?)                        │
│ └─ loading state set karta hai                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
        ┌──────────────────────┐      ┌──────────────────────┐
        │ authUser EXIST KARTA │      │ authUser NAHI KARTA  │
        │ HAI + VALID ROLE     │      │ YA INVALID ROLE      │
        └──────────────────────┘      └──────────────────────┘
                    ↓                               ↓
        ┌──────────────────────┐      ┌──────────────────────┐
        │ STEP 4A: Page render │      │ STEP 4B: Logout flow │
        │ hota hai             │      │ trigger hota hai     │
        │                      │      │                      │
        │ ✅ User authorized   │      │ clientLogout()       │
        │ ✅ Page load hota    │      │ call hota hai        │
        │ ✅ Data show hota    │      │                      │
        └──────────────────────┘      └──────────────────────┘
                    ↓                               ↓
        ┌──────────────────────┐      ┌──────────────────────┐
        │ STEP 5A: home/page   │      │ STEP 5B: clientLogout│
        │ .tsx render hota hai │      │ kya karta hai?       │
        │                      │      │                      │
        │ useEffect mein:      │      │ 1. localStorage      │
        │ - localStorage se    │      │    clear karta hai   │
        │   authUser read      │      │                      │
        │ - userName extract   │      │ 2. Toast dikhata hai │
        │ - LandingPage render │      │                      │
        │                      │      │ 3. /api/auth/logout  │
        │ ✅ Dashboard show    │      │    call karta hai    │
        │    hota hai          │      │    (cookies delete)  │
        └──────────────────────┘      │                      │
                                      │ 4. /login/canvasser  │
                                      │    pe redirect       │
                                      └──────────────────────┘
```

---

## Detailed Flow - 3 Scenarios:

### ✅ SCENARIO 1: User Authorized Hai (Happy Path)

```
1. Browser: /canvasser/home kholta hai
   ↓
2. Layout.tsx: useRequireAuth(['CANVASSER']) call
   ↓
3. clientAuth.ts: readAuthUserFromStorage()
   ├─ localStorage.getItem('authUser') ✅ EXIST KARTA HAI
   ├─ JSON.parse() ✅ VALID
   ├─ role check ✅ 'CANVASSER' hai
   └─ setUser(authUser) + setLoading(false)
   ↓
4. Layout.tsx: loading = false, user = {...}
   ├─ checkingProfile logic run hota hai
   ├─ fullName, storeId, employeeId check
   └─ Agar sab valid hai toh children render
   ↓
5. home/page.tsx: render hota hai
   ├─ useEffect mein authUser read
   ├─ userName extract
   └─ LandingPage component render
   ↓
6. ✅ DASHBOARD SHOW HOTA HAI
```

---

### ❌ SCENARIO 2: authUser localStorage mein nahi hai

```
1. Browser: /canvasser/home kholta hai
   ↓
2. Layout.tsx: useRequireAuth(['CANVASSER']) call
   ↓
3. clientAuth.ts: readAuthUserFromStorage()
   ├─ localStorage.getItem('authUser') ❌ NULL
   └─ return null
   ↓
4. clientAuth.ts: if (!authUser) check
   ├─ clientLogout('/login/canvasser') call
   └─ return (exit hook)
   ↓
5. clientLogout.ts: kya karta hai?
   ├─ localStorage.removeItem('authUser')
   ├─ localStorage.removeItem('canvasserUserName')
   ├─ showSessionExpiredToast() - "Session expired" message
   ├─ fetch('/api/auth/logout', {method: 'POST'})
   │  └─ Server: cookies delete karta hai
   └─ setTimeout 3 seconds
      └─ window.location.href = '/login/canvasser'
   ↓
6. ❌ LOGIN PAGE PE REDIRECT
```

---

### ❌ SCENARIO 3: authUser hai lekin role invalid hai

```
1. Browser: /canvasser/home kholta hai
   ↓
2. Layout.tsx: useRequireAuth(['CANVASSER']) call
   ↓
3. clientAuth.ts: readAuthUserFromStorage()
   ├─ localStorage.getItem('authUser') ✅ EXIST
   ├─ JSON.parse() ✅ VALID
   ├─ role check ❌ 'ZOPPER_ADMINISTRATOR' hai (CANVASSER nahi)
   └─ return authUser (lekin role invalid)
   ↓
4. clientAuth.ts: if (!requiredRoles.includes(authUser.role)) check
   ├─ target = getHomePathForRole('ZOPPER_ADMINISTRATOR')
   ├─ target = '/Zopper-Administrator' (login path nahi)
   └─ router.replace(target)
   ↓
5. ✅ ZOPPER_ADMINISTRATOR HOME PAGE PE REDIRECT
   (Ya agar role bilkul invalid ho toh clientLogout call)
```

---

## Files Involved:

| File | Role |
|------|------|
| `src/app/canvasser/layout.tsx` | Auth check + profile validation |
| `src/app/canvasser/home/page.tsx` | Dashboard page render |
| `src/lib/clientAuth.ts` | useRequireAuth hook - localStorage check |
| `src/lib/clientLogout.ts` | Logout logic - clear storage + cookies |
| `src/app/api/auth/logout/route.ts` | Server-side cookie deletion |
| `src/components/GlobalAuthInterceptor.tsx` | 401 response handling |

---

## Key Points:

1. **Client-side auth check** - localStorage se authUser read
2. **Role validation** - CANVASSER role check
3. **Profile validation** - fullName, storeId, employeeId check
4. **Unauthorized flow** - clientLogout trigger
5. **Server-side cleanup** - /api/auth/logout call
6. **Redirect** - Login page pe redirect

---

## Timeline:

```
T=0ms   : Browser /canvasser/home request
T=10ms  : Layout.tsx render
T=20ms  : useRequireAuth hook run
T=30ms  : localStorage check
T=40ms  : Role validation
T=50ms  : home/page.tsx render (agar authorized)
T=100ms : LandingPage component render
T=150ms : Dashboard visible ✅

OR

T=0ms   : Browser /canvasser/home request
T=10ms  : Layout.tsx render
T=20ms  : useRequireAuth hook run
T=30ms  : localStorage check ❌ NOT FOUND
T=40ms  : clientLogout() trigger
T=50ms  : localStorage clear
T=60ms  : Toast show
T=70ms  : /api/auth/logout call
T=80ms  : Server cookies delete
T=3000ms: Redirect to /login/canvasser ❌
```
