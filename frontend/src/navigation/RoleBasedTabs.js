import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/FirebaseConfig';

// Lecturer
import ReportingForm from '../screens/Lecturer/ReportingForm';
import Attendance from '../screens/Lecturer/Attendance';
import MyReports from '../screens/Lecturer/MyReports';
import LecturerMonitoring from '../screens/Lecturer/Monitoring';
import LecturerRating from '../screens/Lecturer/Rating';

// Student
import StudentRating from '../screens/Student/Rating';
import ViewAttendance from '../screens/Student/ViewAttendance';
import StudentMonitoring from '../screens/Student/Monitoring';

// PRL
import StreamOverview from '../screens/PRL/StreamOverview';
import Feedback from '../screens/PRL/Feedback';
import PRLMonitoring from '../screens/PRL/Monitoring';
import PRLRating from '../screens/PRL/Rating';
import PRLClasses from '../screens/PRL/Classes';

// PL
import CourseManagement from '../screens/PL/CourseManagement';
import AssignLecturers from '../screens/PL/AssignLecturers';
import PLReports from '../screens/PL/PLReports';
import PLMonitoring from '../screens/PL/PLMonitoring';
import PLClasses from '../screens/PL/PLClasses';
import PLLecturers from '../screens/PL/PLLecturers';
import PLRating from '../screens/PL/PLRating'; 

const Tab = createBottomTabNavigator();

const TAB_CONFIG = {
  STUDENT: [
    { name: 'Attendance', component: ViewAttendance, icon: 'calendar' },
    { name: 'Monitoring', component: StudentMonitoring, icon: 'bar-chart' },
    { name: 'Rate', component: StudentRating, icon: 'star' },
  ],

  LECTURER: [
    { name: 'Report', component: ReportingForm, icon: 'document-text' },
    { name: 'Attendance', component: Attendance, icon: 'people' },
    { name: 'My Reports', component: MyReports, icon: 'folder' },
    { name: 'Monitoring', component: LecturerMonitoring, icon: 'bar-chart' },
    { name: 'Rating', component: LecturerRating, icon: 'star' },
  ],

  PRL: [
    { name: 'Courses', component: StreamOverview, icon: 'book' },
    { name: 'Reports', component: Feedback, icon: 'document-text' },
    { name: 'Monitoring', component: PRLMonitoring, icon: 'bar-chart' },
    { name: 'Rating', component: PRLRating, icon: 'star' },
    { name: 'Classes', component: PRLClasses, icon: 'school' },
  ],

  PL: [
    { name: 'Courses', component: CourseManagement, icon: 'book' },
    { name: 'Assign', component: AssignLecturers, icon: 'person-add' },
    { name: 'Reports', component: PLReports, icon: 'document-text' },
    { name: 'Monitoring', component: PLMonitoring, icon: 'stats-chart' },
    { name: 'Classes', component: PLClasses, icon: 'school' },
    { name: 'Lecturers', component: PLLecturers, icon: 'people' },
    { name: 'Ratings', component: PLRating, icon: 'star' }, 
  ],
};

const LogoutButton = () => (
  <TouchableOpacity
    onPress={async () => {
      const logout = async () => {
        try {
          await signOut(auth);
        } catch (error) {
          Alert.alert('Error', 'Failed to logout. Try again.');
        }
      };

      if (Platform.OS === 'web') {
        logout();
      } else {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
      }
    }}
    style={{ marginRight: 16 }}
  >
    <Ionicons name="log-out-outline" size={22} color="#ef4444" />
  </TouchableOpacity>
);

export default function RoleBasedTabs({ role }) {
  const normalizedRole = role
    ? role.toString().trim().toUpperCase()
    : 'STUDENT';

  const tabs = TAB_CONFIG[normalizedRole] || TAB_CONFIG.STUDENT;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerRight: () => <LogoutButton />,
        headerStyle: { backgroundColor: '#101010' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800' },
        tabBarActiveTintColor: '#1a56db',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f3f4f6',
          height: 60,
          paddingBottom: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const tab = tabs.find(t => t.name === route.name);
          const iconName = tab
            ? focused ? tab.icon : `${tab.icon}-outline`
            : 'apps';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {tabs.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}