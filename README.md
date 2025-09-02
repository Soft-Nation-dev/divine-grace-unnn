# My React App

This is a simple React application that includes a landing page with a login button, a mock login page, and a homepage. The application demonstrates basic routing using React Router.

## Project Structure

```
my-react-app
├── public
│   └── index.html
├── src
│   ├── components
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── Homepage.jsx
│   ├── App.jsx
│   ├── index.js
│   ├── css
│   │   ├── landingpage.css
│   │   ├── loginpage.css
│   │   └── homepage.css
│   └── routes
│       └── AppRoutes.jsx
├── package.json
└── README.md
```

## Features

- **Landing Page**: A welcoming page with a login button that redirects to the login page.
- **Login Page**: A mock login form that simulates user authentication and redirects to the homepage upon submission.
- **Homepage**: The main content area of the application that users see after logging in.

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   cd my-react-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000` to view the application.

## Technologies Used

- React
- React Router
- CSS for styling

## License

This project is licensed under the MIT License.