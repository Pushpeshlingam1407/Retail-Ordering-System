# 🛒 RetailOS — A Full-Stack Retail Orchestrator (Apple & Samsung Vibe)

[![Java Version](https://img.shields.io/badge/Java-23-orange.svg?style=flat-square&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.0-brightgreen.svg?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.0-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-purple.svg?style=flat-square&logo=vite)](https://vite.dev/)
[![Material UI](https://img.shields.io/badge/Material%20UI-5.x-blue.svg?style=flat-square&logo=mui)](https://mui.com/)
[![License](https://img.shields.io/badge/License-MIT-black.svg?style=flat-square)](https://opensource.org/licenses/MIT)

RetailOS is a full-stack retail ordering dashboard. It combines a secure **Spring Boot** REST api, **JWT-based stateless sessions**, and a **React 19 + Vite** client app. The UI is built around custom design guidelines inspired by **Apple, Samsung (One UI), and Anthropic/Cohere** editors.

---

## 🏗️ How it works under the hood

Here is a high-level look at how requests move through the system:

```text
  ┌──────────────────────────────────────────────────────────┐
  │                   React Client App (Vite)                │
  │  Vite Dev Client · React Router · Material UI · Axios    │
  └────────────────────────────┬─────────────────────────────┘
                               │ JWT Authorization Header
                               ▼
  ┌──────────────────────────────────────────────────────────┐
  │                 Security Filters & Guard                 │
  │     CORS Filter · Spring Security Config · JWT Filter     │
  └────────────────────────────┬─────────────────────────────┘
                               │ Request Authorized
                               ▼
  ┌──────────────────────────────────────────────────────────┐
  │                  API Endpoints (Controllers)             │
  │  /api/auth · /api/products · /api/orders · /api/coupons  │
  └────────────────────────────┬─────────────────────────────┘
                               │ Service Logic Invocation
                               ▼
  ┌──────────────────────────────────────────────────────────┐
  │                   Business Service Layer                 │
  │ Transaction Manager · Seed Data Loader · Mail Dispatcher │
  └────────────────────────────┬─────────────────────────────┘
                               │ Hibernate / JPA ORM
                               ▼
  ┌───────────────────────┐         ┌────────────────────────┐
  │      Database         │         │     Email Service      │
  │     MySQL Local       │         │   JavaMailSender SMTP  │
  └───────────────────────┘         └────────────────────────┘
```

---

## ⚡ Core Features

### 🔐 User & Admin Auth

- **JWT Security**: The client stores the JWT token and attaches it to outgoing requests.
- **Protected Access Roles**: The backend validates roles (`USER` vs. `ADMIN`) for each endpoint.
- **Clean Login/Signup Forms**: Error inputs collapse automatically, showing inline feedback and clean visual alerts.

### 🛍️ Customer Flow

- **Product Catalog**: Real-time product lists showing stock levels, search inputs, and visual states.
- **Shopping Cart**: Add, remove, or modify items directly with immediate subtotal recalculations.
- **Promo Application**: Enter active coupons before checkout. The backend checks expiration dates and usage counts on the fly.
- **One-Click Reorder**: Users can clone previous order setups instantly using "Order Again."

### 📊 Admin Control Center

- **Operations Console**: View and track all customer orders placed on the system.
- **Order Confirmation/Cancellation**: Admins can approve (`CONFIRM`) or reject (`CANCEL`) orders. This triggers automated notification emails to the customer.
- **Product Manager**: Complete CRUD operations for building out the store catalog.
- **Coupon Manager**: Adjust parameters, toggle active state, or add promo code rules.

### ✉️ Automated Notifications

- **Receipt Emails**: Sends HTML order details, delivery location logs, and status updates directly to users.
- **Promo Blasts**: Automatically emails all registered users when a new coupon is announced.

---

## 🎨 The Aesthetic (Apple & Samsung Vibe)

We did away with standard grid frameworks and built a premium, editorial design system focused on micro-interactions:

- **CDN Typography (No Local Font Files)**: Zero local `.ttf` clutter. All headings and body components use direct `@font-face` links to Google Font servers to load **CohereText** (Plus Jakarta Sans) and **Anthropic Sans** (Instrument Sans) dynamically.
- **Springy Capsule Buttons**: Standardized button slots use a pill shape (`borderRadius: 99px`), cubic Bezier curves for transition timings, subtle lifts (`translateY(-1.5px)`) on hover, and tactile scaling down (`scale(0.96)`) on click.
- **iOS-Style Toggles**: Custom styled switches matching iOS specifications with a smooth thumb transition, clean shadow depth, and green checked tracks (`#34c759`).
- **One UI Glassmorphic Toasts**: Capsule toast banners (`borderRadius: 99px`) utilizing light background tints and borders matching warning, success, error, or info statuses.
- **Warm Mesh Backdrop**: An editorial glass background with warm cream panel sheets (`#F6F5EF` and translucent overlays).

---

## 🛠️ Quick Start (Up in 2 Minutes)

### Requirements

- **Java SDK 23** or newer
- **Node.js v18** or newer
- **MySQL Server** (running locally on port 3306)

---

### 1. Database Setup

Log in to your local MySQL client and run:

```sql
CREATE DATABASE IF NOT EXISTS retail_db;
```

---

### 2. Run the Spring Boot Backend

1.  Navigate into the backend project folder:
    ```bash
    cd retail
    ```
2.  If you need to change your database user/password, open `src/main/resources/application.properties` and update the connection values.
3.  Launch the app:
    ```bash
    ./mvnw spring-boot:run
    ```
4.  _Note:_ The system automatically seeds demo products and a default admin login (`admin@retailos.com` / `admin123`) on startup.

---

### 3. Run the React Frontend

1.  Go into the frontend folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Boot the Vite dev server:
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:5173` in your browser.

---

## 📖 API Documentation

With the backend running, the full Swagger API console is available here:

```text
http://localhost:8080/swagger-ui/index.html
```

### Key API Mappings

| Resource     | Method | Path                      | Authentication Required? | Role Scope       |
| :----------- | :----- | :------------------------ | :----------------------- | :--------------- |
| **Auth**     | `POST` | `/api/auth/register`      | No                       | Anonymous        |
| **Auth**     | `POST` | `/api/auth/login`         | No                       | Anonymous        |
| **Products** | `GET`  | `/api/products`           | Yes                      | `USER` / `ADMIN` |
| **Products** | `POST` | `/api/products`           | Yes                      | `ADMIN`          |
| **Orders**   | `GET`  | `/api/orders`             | Yes                      | `USER` / `ADMIN` |
| **Orders**   | `POST` | `/api/orders`             | Yes                      | `USER`           |
| **Orders**   | `PUT`  | `/api/orders/{id}/status` | Yes                      | `ADMIN`          |
| **Coupons**  | `GET`  | `/api/coupons`            | Yes                      | `USER` / `ADMIN` |
| **Coupons**  | `POST` | `/api/coupons`            | Yes                      | `ADMIN`          |

---

## 🔒 Configuration & Development Notes

- **Client Session Storage**: The React client uses `sessionStorage` to hold cart configurations and user JWT sessions.
- **Fast Checkout**: The checkout screen automatically pulls details from the user's signup profile for a seamless checkout experience.
- **Global Exception Handling**: Custom errors (such as `InsufficientStockException`) are intercepted by a backend `@ControllerAdvice` to format matching error responses.
