import React, { createContext, useState, useEffect } from "react";

export const DrivingContext = createContext();

export const DrivingProvider = ({ children }) => {
  const [drivingMinutes, setDrivingMinutes] = useState(() => {
    return parseInt(localStorage.getItem("drivingMinutes")) || 0;
  });

  const [startTimer, setStartTimer] = useState(false);
  const [lockState, setLockState] = useState("LOCKED");

  useEffect(() => {
    let interval;
    if (startTimer) {
      interval = setInterval(() => {
        setDrivingMinutes((prev) => {
          const updated = prev + 1;
          localStorage.setItem("drivingMinutes", updated);
          return updated;
        });
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [startTimer]);

  useEffect(() => {
    if (lockState === "LOCKED") {
      setDrivingMinutes(0);
      localStorage.removeItem("drivingMinutes");
    }
  }, [lockState]);

  return (
    <DrivingContext.Provider
      value={{ drivingMinutes, setStartTimer, setLockState, lockState }}
    >
      {children}
    </DrivingContext.Provider>
  );
};
