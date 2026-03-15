# V.M.S GARMENTS Order Management System

A full-stack MERN application for manufacturing companies to manage job work orders from client companies.

## Architecture

| Module | Port | Tech |
|--------|------|------|
| Backend API | 5000 | Express.js, MongoDB, JWT |
| Client Portal | 5173 | React, Tailwind CSS, Vite |
| Admin Dashboard | 5174 | React, Tailwind CSS, Vite, Chart.js |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running on `localhost:27017`

### 1. Backend
```bash
cd backend
npm install
npm run dev
```
> Default admin auto-created: `admin@vmsgarments.com` / `admin123`

### 2. Client Portal
```bash
cd client
npm install
npm run dev
```

### 3. Admin Dashboard
```bash
cd admin
npm install
npm run dev
```

## Features

### Client Portal
- Register/Login, Place Orders, Track Status
- Order Timeline UI, Messaging, File Upload
- Profile Management

### Admin Dashboard
- Dashboard with Charts, Orders Management
- Client Management, Production Tracking
- Dispatch, Invoice Generation (PDF), Reports

## Order Workflow
```
Order Placed → Accepted → Raw Material Received → Production Started → Quality Check → Completed → Dispatched → Delivered
```
