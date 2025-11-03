// App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Navbar from "./COMPONENETS/Navbar";
import Profile from "./Pages/Profile";
import Dashboard from "./COMPONENETS/Dashboard";
 import ProtectedRoute from "./COMPONENETS/Protectedroutes";




function App() {
  return (
    <>
<Navbar/>
<Routes>

<Route path="/" element={<Home/>}/>
<Route path="/login" element={<Login/>}/>
<Route path="/signup" element={<Signup/>}/>
<Route path="/profile" element={<Profile/>}/>
<Route path="/dashboard" element={<Dashboard/>}/>


  <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />  


</Routes>







    </>
  );
}

export default App;
