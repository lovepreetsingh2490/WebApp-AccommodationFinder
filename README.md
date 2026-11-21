# Accommodation Center Finder for Overseas Students

A full-stack **MERN** web application that helps international students find, filter, compare and save student accommodation. Students can search by city, budget, amenities, property type, distance to campus and rating, view results on an interactive map, save a shortlist and store personal preferences in their account.

This project was created for **CCO5011 Web Apps – Assessment 1** and addresses the brief by deploying all four MERN layers, custom React components, custom Express routes, and additional web technologies/practices (responsive design, accessibility, Leaflet maps and the OpenStreetMap API).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Database | MongoDB + Mongoose |
| Server | Node.js + Express (JWT auth, bcryptjs, helmet, compression, CORS, express-validator) |
| Client | React 18 + React Router 6 + Axios-compatible fetch wrapper |
| UI | Tailwind CSS, React Icons, Leaflet.js |
| Extra standards | WCAG-inspired accessibility, responsive mobile-first design, OpenStreetMap tiles |

---

## Project Structure

```
accommodation-finder/
├── client/                     # React frontend
│   ├── public/index.html
│   └── src/
│       ├── components/         # Navbar, Footer, CenterCard, FilterPanel,
│       │                       # CenterMap, AmenityList
│       ├── pages/              # Home, Search, CenterDetail, Login,
│       │                       # Register, Dashboard, Admin, NotFound
│       ├── utils/api.js        # Auth-aware fetch + saved-centre helpers
│       ├── App.js              # Routing and page shell
│       └── index.css           # Tailwind layers and accessibility styles
├── server/                     # Express backend
│   ├── config/db.js            # MongoDB connection
│   ├── middleware/authMiddleware.js
│   ├── models/                 # Center, User and Enquiry Mongoose schemas
│   ├── routes/                 # /api/centers, /api/users and /api/enquiries
│   ├── seeds/index.js          # Sample accommodation data + admin user
│   ├── server.js               # App entry point
│   └── .env.example
├── package.json                # Root orchestration scripts
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm 8+
- MongoDB running locally on port `27017`, or a MongoDB Atlas connection string

### 1. Install dependencies
From the project root:

```bash
npm run install:all
```

This installs the root tooling plus both `client` and `server` dependencies.

### 2. Configure the environment
Copy `server/.env.example` to `server/.env` and edit if needed:

```env
MONGO_URI=mongodb://127.0.0.1:27017/accommodation_finder
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=replace_with_a_long_random_string
```

The server also has safe defaults, so it still starts without a `.env` file when local MongoDB is used.

### 3. Seed the database
```bash
npm run seed
```

This creates:
- 14 sample accommodation centres across London, Manchester, Edinburgh and Birmingham
- An admin account: `admin@example.com` / `admin123`

### 4A. Development mode (hot reload)
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

The React dev server proxies `/api` requests to the Express server.

### 4B. Production-style mode (single server)
```bash
npm run build
npm start
```

The Express server then serves the built React app and the API together at http://localhost:5000.

---

## Features

- **Search & filtering** – free-text search, city, type, price range, amenities, availability, maximum distance to campus and minimum rating, with sorting and pagination.
- **Interactive map view** – Leaflet + OpenStreetMap markers for each result, with links through to accommodation details.
- **Detailed listings** – room types and prices, facilities, policies (visa proof, guarantor, bills), transport links, contact details and a location map.
- **Booking enquiries** – the “Contact to Book” / “Join Waitlist” button opens an in-app form that stores the enquiry in MongoDB (no external email app required); a mailto/copy-email fallback is also provided. Signed-in students track their enquiries and their status under **My Enquiries** on the dashboard. Admin can review enquiries and update their status; the new status appears on the student's dashboard.
- **Accounts** – register, login, JWT-protected endpoints, editable profile and saved preferences.
- **Admin dashboard** (`/admin`, admin login only) – create, edit and delete accommodation listings and manage student enquiries through a web UI backed by the protected API.
- **Saved accommodations** – shortlist centres from search results or detail pages; signed-in users' lists are stored in MongoDB and merged with any local shortlist.
- **Preferences** – save budget, cities, type, amenities and max distance; apply them to search with one click.
- **Accessible, responsive UI** – skip-to-content link, ARIA labels, keyboard-friendly controls, visible focus states, reduced-motion support, mobile navigation and filter drawer.

---

## API Endpoints

### Accommodations (`/api/centers`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/centers` | Filtered, sorted, paginated list |
| GET | `/api/centers/:id` | Single accommodation |
| GET | `/api/centers/filters/options` | Distinct cities, types and amenities |
| GET | `/api/centers/stats` | Counts and average rating for the homepage |
| POST | `/api/centers` | Create (admin only) |
| PUT | `/api/centers/:id` | Update (admin only) |
| DELETE | `/api/centers/:id` | Delete (admin only) |

Query parameters for `GET /api/centers`: `page`, `limit`, `search`, `city`, `type`, `minPrice`, `maxPrice`, `amenities` (comma-separated), `available`, `maxDistance`, `minRating`, `sortBy`, `order`.

### Users (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Create account and receive JWT |
| POST | `/api/users/login` | Login and receive JWT |
| GET | `/api/users/me` | Current account (auth required) |
| PUT | `/api/users/preferences` | Update preferences (auth required) |
| PUT | `/api/users/profile` | Update name (auth required) |
| GET | `/api/users/saved` | Saved centres with full details (auth required) |
| POST | `/api/users/saved/:centerId` | Toggle saved centre (auth required) |

Send the token as `Authorization: Bearer <token>`.

### Enquiries (`/api/enquiries`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/enquiries` | Submit a booking/waitlist enquiry (public; linked to the user when logged in) |
| GET | `/api/enquiries/mine` | The logged-in student's enquiries with current status (auth required) |
| GET | `/api/enquiries` | List all enquiries (admin only) |
| PATCH | `/api/enquiries/:id/status` | Update status to `new`, `contacted` or `closed` (admin only) |

The public POST accepts `center` (a valid accommodation id), `name`, `email`, `message`, and optional `phone` and `purpose` (`booking` or `waitlist`). Enquiries are persisted with a `new` status until an admin updates them.

### Health
`GET /api/health` returns API and database status.

---

## Authentication & Authorisation

Passwords are hashed with **bcryptjs**. Login/register return a signed **JWT** (7-day expiry) using `JWT_SECRET`. The `protect` middleware verifies the token on private user routes, and `adminOnly` restricts accommodation create/update/delete to admin accounts.

---

## Verification Checklist

1. `npm run install:all`
2. `npm run seed`
3. `npm run dev` (or `npm run build && npm start`)
4. Home page statistics load from `/api/centers/stats`.
5. Search returns results; filters, sorting and pagination change the result set.
6. Map view shows markers and detail links.
7. Register/login works; profile and preferences can be saved.
8. Saving a centre shows it in the dashboard.
9. Log in as a student, use “Contact to Book”, then open **Dashboard → My Enquiries** to see the record and its status.
10. Admin (login with `admin@example.com` / `admin123`, then visit `/admin`) can create/edit/delete a centre and update an enquiry's status. Reopen the student dashboard (or press **Refresh status**) to see `Awaiting review` → `Provider contacted you` → `Completed`. Students receive `403` on admin routes and anonymous users receive `401`.
11. `npm run seed` resets the database to 14 centres, the admin account and zero enquiries.

---

## External Sources

The following documentation and services informed the implementation and should be referenced in the supporting documentation using your required Harvard style:

- MongoDB documentation – https://www.mongodb.com/docs/
- Mongoose documentation – https://mongoosejs.com/docs/
- Express documentation – https://expressjs.com/
- React documentation – https://react.dev/
- React Router documentation – https://reactrouter.com/
- Tailwind CSS documentation – https://tailwindcss.com/docs
- Leaflet documentation – https://leafletjs.com/reference.html
- OpenStreetMap tile usage – https://operations.osmfoundation.org/policies/tiles/
- JWT introduction – https://jwt.io/introduction
- bcryptjs documentation – https://www.npmjs.com/package/bcryptjs
