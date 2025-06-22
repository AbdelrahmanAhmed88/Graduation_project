import React from "react";
import { BrowserRouter as Router, Routes, Route  } from "react-router-dom";
import FirstTimeLogin1 from "./componant/FirstTimeLogin1";
import FirstTimeLogin2 from "./componant/FirstTimeLogin2";
import FirstTimeLogin3 from "./componant/FirstTimeLogin3";
import HomePage from "./componant/HomePage";
import UserProfile from "./componant/UserProfile";
import ShowAllUsers from "./componant/ShowAllUsers";
import CurrentUser from "./componant/CurrentUser";
import ChangeAdminInfo from "./componant/ChangeAdminInfo";
import DriverStatePage from "./componant/DriverStatePage";
import { DrivingProvider } from "./componant/DrivingContext";
function App() {
  return (
    <DrivingProvider>
    <Router>
    <Routes>
    
     <Route path="/" element={<FirstTimeLogin1 />} /> 
     <Route path="/Firsttimelogin2" element={<FirstTimeLogin2 />} />
     <Route path="/Firsttimelogin2/Firsttimelogin3" element={<FirstTimeLogin3 />}/> 
     
     <Route path="/Firsttimelogin2/Firsttimelogin3/HomePage"  element={<HomePage />} /> 
     <Route path="/Firsttimelogin2/Firsttimelogin3/HomePage/UserProfile" element={<UserProfile />} />
     <Route path="/Firsttimelogin2/Firsttimelogin3/HomePage/CurrentUser" element={<CurrentUser />} />
     <Route path="/Firsttimelogin2/Firsttimelogin3/HomePage/ShowAllUsers" element={<ShowAllUsers />} />
     <Route path="/Firsttimelogin2/Firsttimelogin3/HomePage/ChangeAdminInfo" element={<ChangeAdminInfo />} />
     <Route path="/Firsttimelogin2/Firsttimelogin3/HomePage/DriverState" element={<DriverStatePage />}/>
    </Routes>
      
    </Router>
    </DrivingProvider>
    
  );
}

export default App
