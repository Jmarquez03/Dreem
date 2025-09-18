import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JournalListScreen from './screens/JournalListScreen';
import EntryScreen from './screens/EntryScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';
import CustomDrawerContent from './components/CustomDrawerContent';
import ThemeProvider, { useAppTheme } from './theme/ThemeProvider';
import { EntryProvider } from './contexts/EntryContext';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function JournalStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="JournalList" 
        component={JournalListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Entry" 
        component={EntryScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { navTheme } = useAppTheme();
  return (
    <NavigationContainer theme={navTheme}>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            width: 280,
          },
        }}
      >
        <Drawer.Screen 
          name="Journal" 
          component={JournalStack}
          options={{
            drawerIcon: () => '📖',
          }}
        />
        <Drawer.Screen 
          name="Calendar" 
          component={CalendarScreen}
          options={{
            drawerIcon: () => '📅',
          }}
        />
        <Drawer.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            drawerIcon: () => '⚙️',
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <EntryProvider>
        <RootNavigator />
      </EntryProvider>
    </ThemeProvider>
  );
}
