# Okkhor - Server (Backend API)

## Project Overview

Okkhor-Server is the central nervous system of the Okkhor ecosystem. It is a RESTful API built to handle complex business logic, secure data persistence, and role-based authorization. This repository manages the core database operations for blogs and users, ensuring that every request is authenticated and every piece of data is stored securely in MongoDB.

## Key Features

- **RESTful API Architecture:** Clean and organized endpoints for all CRUD operations.
- **JWT Authentication:** Secure token-based authentication system with expiration and verification.
- **Role-Based Authorization (RBAC):** Custom server-side middleware to enforce permissions for Users, Moderators, and Admins.
- **Database Aggregation & Analytics:** Advanced MongoDB queries for trending blogs, search filters, chronological sorting, real-time author analytics, and comprehensive admin dashboard statistics.
- **Following & Feed Engine:** Optimized `$in` array querying to instantly compile personalized blog feeds based on a user's follower graph, while maintaining follower/following sub-documents for fast connection management.
- **Activity Logging System:** Backend infrastructure to trace user mutations and interactions across the platform.
- **Nested Commenting System:** Recursive database querying and self-referential schema design supporting infinitely deep threaded replies, complete with recursive hard-deletion algorithms for thread cleanup.
- **Data Integrity:** Strict validation of incoming requests to prevent unauthorized data modification.
- **Security Middleware:** CORS configuration and environment-controlled security settings.
- **API Performance:** Optimized database indexing and efficient handling of high-volume requests (upvotes/downvotes).

## Tech Stack

- **Node.js:** Cross-platform JavaScript runtime for server-side logic.
- **Express.js:** Minimal web framework for building RESTful APIs.
- **MongoDB & Mongoose:** Scalable document-oriented NoSQL database coupled with elegant Object Data Modeling (ODM).
- **JSON Web Token (JWT):** Stateless authentication and secure authorization.
- **CORS:** Managing Cross-Origin Resource Sharing for API security.
- **Dotenv:** Secure management of environment-specific configurations.
- **Swagger UI Express:** API documentation UI.
- **Swagger Autogen:** Automatic Swagger documentation generation.
- **Nodemon:** Automated server restarts during development.

## Installation Steps

Okkhor-Server requires a MongoDB instance (local or Atlas) to be accessible.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/RaisulKayesRaka/Okkhor-Server.git
   cd Okkhor-Server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:

   ```env
   PORT=5000
   DB_USER=your_mongodb_username
   DB_PASS=your_mongodb_password
   ACCESS_TOKEN_SECRET=your_jwt_secret_key
   ```

4. **Start the server:**
   - **Development:** `npm run dev` (uses nodemon)
   - **Production:** `npm start`
     The API will be available at `http://localhost:5000`.

## API Documentation

The API documentation is powered by Swagger.

- **View Documentation:** Start the server and visit `http://localhost:5000/api-docs` to see the interactive Swagger UI.
- **Regenerate Documentation:** If you make changes to the routes in `index.js`, run the following command to update the Swagger output:
  ```bash
  npm run swagger
  ```

---

### 🔗 Related Repository

- **Frontend Client:** [Okkhor-Client](https://github.com/RaisulKayesRaka/Okkhor-Client)
