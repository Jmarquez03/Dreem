import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JournalListScreen from './screens/JournalListScreen';
import EntryScreen from './screens/EntryScreen';
import SettingsScreen from './screens/SettingsScreen';
import { TouchableOpacity, Text } from 'react-native';
import ThemeProvider, { useAppTheme } from './theme/ThemeProvider';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { navTheme } = useAppTheme();
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen
          name="Journal"
          component={JournalListScreen}
          options={({ navigation }) => ({
            headerRight: () => (
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Text style={{ color: '#2563eb' }}>Settings</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen name="Entry" component={EntryScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
