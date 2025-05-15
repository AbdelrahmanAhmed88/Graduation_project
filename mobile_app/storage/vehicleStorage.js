import AsyncStorage from "@react-native-async-storage/async-storage";

const VEHICLE_KEY = "selectedVehicle";

export const saveVehicle = async (vehicle) => {
  try {
    await AsyncStorage.setItem(VEHICLE_KEY, JSON.stringify(vehicle));
  } catch (error) {
    console.error("Error saving vehicle:", error);
  }
};

export const getSelectedVehicle = async () => {
  try {
    const vehicle = await AsyncStorage.getItem(VEHICLE_KEY);
    return vehicle ? JSON.parse(vehicle) : null;
  }catch(error){
    console.error("Error getting vehicle:", error);
    return null;
  }
};

export const removeVehicle = async () => {
  try {
    await AsyncStorage.removeItem(VEHICLE_KEY);
  } catch (error) {
    console.error("Error removing vehicle:", error);
  }
};


