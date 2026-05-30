import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';

// Screens placeholder imports (we will write these next)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import UserDashboard from '../screens/user/UserDashboard';
import MarkAttendanceScreen from '../screens/user/MarkAttendanceScreen';
import HistoryScreen from '../screens/user/HistoryScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import RequestsScreen from '../screens/admin/RequestsScreen';
import EmployeeRecordsScreen from '../screens/admin/EmployeeRecordsScreen';
import EmployeeAttendanceDetailsScreen from '../screens/admin/EmployeeAttendanceDetailsScreen';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0a0c' },
      }}
    >
      {!isAuthenticated ? (
        // Auth Flow
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user?.role === 'ADMIN' ? (
        // Admin Flow
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="Requests" component={RequestsScreen} />
          <Stack.Screen name="Employees" component={EmployeeRecordsScreen} />
          <Stack.Screen name="EmployeeAttendanceDetails" component={EmployeeAttendanceDetailsScreen} />
        </>
      ) : (
        // User (Employee) Flow
        <>
          <Stack.Screen name="UserDashboard" component={UserDashboard} />
          <Stack.Screen name="MarkAttendance" component={MarkAttendanceScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
