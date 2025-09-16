import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';

export default function CustomDrawerContent({ navigation }) {
  const { colors } = useAppTheme();

  const menuItems = [
    {
      name: 'Journal',
      icon: '📖',
      screen: 'Journal',
    },
    {
      name: 'Calendar',
      icon: '📅',
      screen: 'Calendar',
    },
    {
      name: 'Settings',
      icon: '⚙️',
      screen: 'Settings',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>🌙 Dreem</Text>
      </View>
      
      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  menu: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
  },
});