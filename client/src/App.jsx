import {BrowserRouter, Route, Routes} from 'react-router-dom'
import Home from './pages/Home.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Solo from './pages/Solo.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Battle from './pages/Battle.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { useAuth } from './context/AuthContext'

const App = () => {


  const protectedRoute = ({children})=>{
      const user = useAuth();
      return user ? children : <Navigate to = {"/login"}/>
  }


  return (
    <div>
      <BrowserRouter>

        <Routes>

          <Route path = {"/"}  element = {<Home/>}/>
          <Route path = {"/leaderboard"} element = {<Leaderboard/>} />
          <Route path = {"/login"} element = {<Login/>} />
          <Route path = {"/register"} element = {<Register/>} />


          {/* These routes should not be accessible path users who arent logged in*/}

          <Route path = {"/dashboard"} element = {
            <protectedRoute><Dashboard/></protectedRoute>
          }/>

          <Route path = {"/solo"} element = {
            <protectedRoute><Solo/></protectedRoute>
          } />

          <Route path = {"/battle"} element = {
            <protectedRoute><Battle/></protectedRoute>
          }/>

        </Routes>
      
      </BrowserRouter>
    </div>
  )
}

export default App
