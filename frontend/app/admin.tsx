import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  virtual_balance: number;
  earnings_balance: number;
  task_balance: number;
  total_investment: number;
  created_at: string;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  strategy_type: string;
  monthly_returns: number;
  capital_required: number;
  is_active: boolean;
}

export default function AdminDashboard() {
  const [adminToken, setAdminToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'strategies'>('users');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      const { access_token, user } = response.data;
      
      if (user.role !== 'admin') {
        Alert.alert('Access Denied', 'Admin privileges required');
        return;
      }

      setAdminToken(access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setIsAuthenticated(true);
      
      Alert.alert('Success', 'Admin login successful!');
      await fetchData();
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [usersResponse, strategiesResponse] = await Promise.all([
        axios.get(`${API_URL}/api/admin/users`),
        axios.get(`${API_URL}/api/strategies`)
      ]);
      
      setUsers(usersResponse.data);
      setStrategies(strategiesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <View style={styles.loginHeader}>
            <Image 
              source={require('../assets/tradeict-logo-dark.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.loginTitle}>Tradeict Admin</Text>
            <Text style={styles.loginSubtitle}>Login to access admin dashboard</Text>
          </View>

          <View style={styles.loginForm}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Admin Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#666"
              />
            </View>

            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleAdminLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <View style={styles.credentialsHint}>
              <Text style={styles.credentialsText}>Admin Credentials:</Text>
              <Text style={styles.credentialsText}>bimal.vishvakarma@gmail.com / Admin@123</Text>
              <Text style={styles.credentialsText}>admin@tradingsim.com / admin123</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('../assets/tradeict-logo-dark.png')} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            setIsAuthenticated(false);
            setAdminToken('');
            setEmail('');
            setPassword('');
            delete axios.defaults.headers.common['Authorization'];
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users ({users.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'strategies' && styles.activeTab]}
          onPress={() => setActiveTab('strategies')}
        >
          <Text style={[styles.tabText, activeTab === 'strategies' && styles.activeTabText]}>
            Strategies ({strategies.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'users' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Management</Text>
            {users.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userRole}>{user.role.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.userDate}>
                    Joined: {formatDate(user.created_at)}
                  </Text>
                </View>
                <View style={styles.userBalances}>
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>Virtual</Text>
                    <Text style={styles.balanceValue}>
                      {formatCurrency(user.virtual_balance)}
                    </Text>
                  </View>
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>Earnings</Text>
                    <Text style={styles.balanceValue}>
                      {formatCurrency(user.earnings_balance)}
                    </Text>
                  </View>
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>Tasks</Text>
                    <Text style={styles.balanceValue}>
                      {formatCurrency(user.task_balance)}
                    </Text>
                  </View>
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>Invested</Text>
                    <Text style={styles.balanceValue}>
                      {formatCurrency(user.total_investment)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strategy Management</Text>
            {strategies.map((strategy) => (
              <View key={strategy.id} style={styles.strategyCard}>
                <View style={styles.strategyHeader}>
                  <Text style={styles.strategyName}>{strategy.name}</Text>
                  <View style={[
                    styles.strategyType,
                    strategy.strategy_type === 'risky' ? styles.riskyType : styles.guaranteedType
                  ]}>
                    <Text style={[
                      styles.strategyTypeText,
                      strategy.strategy_type === 'risky' ? styles.riskyTypeText : styles.guaranteedTypeText
                    ]}>
                      {strategy.strategy_type.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.strategyDescription}>{strategy.description}</Text>
                <View style={styles.strategyDetails}>
                  <View style={styles.strategyDetail}>
                    <Text style={styles.detailLabel}>Monthly Returns:</Text>
                    <Text style={styles.detailValue}>{strategy.monthly_returns}%</Text>
                  </View>
                  <View style={styles.strategyDetail}>
                    <Text style={styles.detailLabel}>Min. Capital:</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(strategy.capital_required)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  loginForm: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  credentialsHint: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  credentialsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerLogo: {
    width: 100,
    height: 32,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userRole: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
  userBalances: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  strategyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  strategyType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskyType: {
    backgroundColor: '#FFE5E5',
  },
  guaranteedType: {
    backgroundColor: '#E5F5E5',
  },
  strategyTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  riskyTypeText: {
    color: '#FF3B30',
  },
  guaranteedTypeText: {
    color: '#34C759',
  },
  strategyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  strategyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strategyDetail: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});