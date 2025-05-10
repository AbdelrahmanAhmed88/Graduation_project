import React, { useEffect, useState, useRef } from 'react';
import AppNavigator from './navigation/AppNavigator';

import { AlertProvider } from './context/AlertContext'; //custom alert context

export default function App() {
  return (
      <AppNavigator />
  );
}
