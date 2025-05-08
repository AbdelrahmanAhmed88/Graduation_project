import { createContext, useState } from "react";

// Create Context
export const UserContext = createContext();

// Provider Component
export function UserProvider({ children }) {
  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    nfcId: "",
    image: null, // Ensure this key exists
  });

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
}
