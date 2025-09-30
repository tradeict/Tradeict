import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const ProfileItem = ({ 
    icon, 
    title, 
    value, 
    onPress, 
    showArrow = true,
    rightComponent 
  }: {
    icon: string;
    title: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.profileItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color="#007AFF" />
        </View>
        <View style={styles.profileItemInfo}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {value && <Text style={styles.profileItemValue}>{value}</Text>}
        </View>
      </View>
      
      {rightComponent || (showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user?.profile_picture ? (
              <Image source={{ uri: user.profile_picture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#007AFF" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCurrency((user?.virtual_balance || 0) + (user?.earnings_balance || 0))}
              </Text>
              <Text style={styles.statLabel}>Total Balance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#34C759' }]}>
                {formatCurrency(user?.earnings_balance || 0)}
              </Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>
        </View>

        {/* Account Information */}
        <ProfileSection title="Account Information">
          <ProfileItem
            icon="person-circle-outline"
            title="Full Name"
            value={user?.name}
            onPress={() => Alert.alert('Feature Coming Soon', 'Profile editing will be available soon')}
          />
          <ProfileItem
            icon="mail-outline"
            title="Email Address"
            value={user?.email}
            onPress={() => Alert.alert('Feature Coming Soon', 'Email change will be available soon')}
          />
          <ProfileItem
            icon="shield-checkmark-outline"
            title="Account Type"
            value={user?.role?.toUpperCase()}
            showArrow={false}
          />
          <ProfileItem
            icon="time-outline"
            title="Last Login"
            value={formatDate(user?.last_login)}
            showArrow={false}
          />
        </ProfileSection>

        {/* Account Settings */}
        <ProfileSection title="Settings">
          <ProfileItem
            icon="notifications-outline"
            title="Push Notifications"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#fff"
              />
            }
          />
          <ProfileItem
            icon="finger-print-outline"
            title="Biometric Authentication"
            rightComponent={
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#fff"
              />
            }
          />
          <ProfileItem
            icon="language-outline"
            title="Language"
            value="English (US)"
            onPress={() => Alert.alert('Feature Coming Soon', 'Language selection will be available soon')}
          />
          <ProfileItem
            icon="moon-outline"
            title="Dark Mode"
            value="System"
            onPress={() => Alert.alert('Feature Coming Soon', 'Dark mode will be available soon')}
          />
        </ProfileSection>

        {/* Security */}
        <ProfileSection title="Security">
          <ProfileItem
            icon="lock-closed-outline"
            title="Change Password"
            onPress={() => Alert.alert('Feature Coming Soon', 'Password change will be available soon')}
          />
          <ProfileItem
            icon="key-outline"
            title="Two-Factor Authentication"
            value="Disabled"
            onPress={() => Alert.alert('Feature Coming Soon', '2FA setup will be available soon')}
          />
          <ProfileItem
            icon="eye-outline"
            title="Privacy Settings"
            onPress={() => Alert.alert('Feature Coming Soon', 'Privacy settings will be available soon')}
          />
        </ProfileSection>

        {/* Support */}
        <ProfileSection title="Support">
          <ProfileItem
            icon="help-circle-outline"
            title="Help Center"
            onPress={() => Alert.alert('Help Center', 'Contact support at support@tradingsim.com')}
          />
          <ProfileItem
            icon="chatbubble-outline"
            title="Contact Support"
            onPress={() => Alert.alert('Contact Support', 'Email: support@tradingsim.com\nPhone: +1 (555) 123-4567')}
          />
          <ProfileItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => Alert.alert('Feature Coming Soon', 'Terms of service will be available soon')}
          />
          <ProfileItem
            icon="shield-outline"
            title="Privacy Policy"
            onPress={() => Alert.alert('Feature Coming Soon', 'Privacy policy will be available soon')}
          />
        </ProfileSection>

        {/* App Information */}
        <ProfileSection title="App Information">
          <ProfileItem
            icon="information-circle-outline"
            title="App Version"
            value="1.0.0"
            showArrow={false}
          />
          <ProfileItem
            icon="star-outline"
            title="Rate the App"
            onPress={() => Alert.alert('Rate the App', 'Thank you for using our app! We appreciate your feedback.')}
          />
          <ProfileItem
            icon="share-outline"
            title="Share the App"
            onPress={() => Alert.alert('Share the App', 'Feature coming soon! You\'ll be able to share with friends.')}
          />
        </ProfileSection>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileItemInfo: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 14,
    color: '#666',
  },
  logoutSection: {
    paddingVertical: 24,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});