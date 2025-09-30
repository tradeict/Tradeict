import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Strategy {
  id: string;
  name: string;
  description: string;
  strategy_type: 'risky' | 'guaranteed';
  monthly_returns: number;
  capital_required: number;
  logic_description: string;
  is_active: boolean;
}

export default function Strategies() {
  const { user, refreshUser } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [subscriptionForm, setSubscriptionForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'risky' | 'guaranteed'>('all');

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/strategies`);
      setStrategies(response.data);
    } catch (error) {
      console.error('Error fetching strategies:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchStrategies(),
      refreshUser(),
    ]);
    setRefreshing(false);
  };

  const handleInvest = async () => {
    if (!selectedStrategy || !investAmount) {
      Alert.alert('Error', 'Please enter an investment amount');
      return;
    }

    const amount = parseFloat(investAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount < selectedStrategy.capital_required) {
      Alert.alert('Error', `Minimum investment is ${formatCurrency(selectedStrategy.capital_required)}`);
      return;
    }

    if (amount > (user?.virtual_balance || 0)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('strategy_id', selectedStrategy.id);
      formData.append('amount', amount.toString());

      await axios.post(`${API_URL}/api/user-strategies`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Investment successful!');
      setShowInvestModal(false);
      setInvestAmount('');
      refreshUser();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Investment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionRequest = async () => {
    if (!selectedStrategy || !subscriptionForm.name || !subscriptionForm.email) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/subscription-requests`, {
        strategy_id: selectedStrategy.id,
        user_name: subscriptionForm.name,
        user_email: subscriptionForm.email,
        phone_number: subscriptionForm.phone || null,
        message: subscriptionForm.message || null,
      });

      Alert.alert('Success', 'Subscription request submitted successfully!');
      setShowSubscriptionModal(false);
      setSubscriptionForm({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        message: '',
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Subscription request failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredStrategies = strategies.filter(strategy => {
    if (activeTab === 'all') return true;
    return strategy.strategy_type === activeTab;
  });

  const renderStrategy = (strategy: Strategy) => (
    <View key={strategy.id} style={styles.strategyCard}>
      <View style={styles.strategyHeader}>
        <View style={styles.strategyTitleContainer}>
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
        <View style={styles.returnsContainer}>
          <Text style={styles.returnsLabel}>Monthly Returns</Text>
          <Text style={styles.returnsValue}>{strategy.monthly_returns}%</Text>
        </View>
      </View>

      <Text style={styles.strategyDescription}>{strategy.description}</Text>
      
      <View style={styles.strategyDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Min. Capital: {formatCurrency(strategy.capital_required)}
          </Text>
        </View>
      </View>

      <View style={styles.strategyLogic}>
        <Text style={styles.logicLabel}>Strategy Logic:</Text>
        <Text style={styles.logicText}>{strategy.logic_description}</Text>
      </View>

      <View style={styles.strategyActions}>
        <TouchableOpacity
          style={styles.investButton}
          onPress={() => {
            setSelectedStrategy(strategy);
            setShowInvestModal(true);
          }}
        >
          <Ionicons name="trending-up" size={16} color="#fff" />
          <Text style={styles.investButtonText}>Invest Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={() => {
            setSelectedStrategy(strategy);
            setShowSubscriptionModal(true);
          }}
        >
          <Ionicons name="rocket-outline" size={16} color="#007AFF" />
          <Text style={styles.subscribeButtonText}>Request Real Bot</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Strategies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'guaranteed' && styles.activeTab]}
          onPress={() => setActiveTab('guaranteed')}
        >
          <Text style={[styles.tabText, activeTab === 'guaranteed' && styles.activeTabText]}>
            Guaranteed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'risky' && styles.activeTab]}
          onPress={() => setActiveTab('risky')}
        >
          <Text style={[styles.tabText, activeTab === 'risky' && styles.activeTabText]}>
            Risky
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.strategiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'all' ? 'All Strategies' : 
               activeTab === 'guaranteed' ? 'Guaranteed Strategies' : 'Risky Strategies'}
            </Text>
            <Text style={styles.sectionCount}>{filteredStrategies.length}</Text>
          </View>

          {filteredStrategies.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bar-chart-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyStateTitle}>No Strategies Available</Text>
              <Text style={styles.emptyStateText}>
                Check back later for new trading strategies
              </Text>
            </View>
          ) : (
            filteredStrategies.map(renderStrategy)
          )}
        </View>
      </ScrollView>

      {/* Investment Modal */}
      <Modal
        visible={showInvestModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInvestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invest in {selectedStrategy?.name}</Text>
              <TouchableOpacity onPress={() => setShowInvestModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.balanceText}>
                Available Balance: {formatCurrency(user?.virtual_balance || 0)}
              </Text>
              <Text style={styles.minCapitalText}>
                Minimum Investment: {formatCurrency(selectedStrategy?.capital_required || 0)}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Investment Amount</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0.00"
                  value={investAmount}
                  onChangeText={setInvestAmount}
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowInvestModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, loading && styles.buttonDisabled]}
                onPress={handleInvest}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Invest</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subscription Modal */}
      <Modal
        visible={showSubscriptionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Real Bot Subscription</Text>
              <TouchableOpacity onPress={() => setShowSubscriptionModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={subscriptionForm.name}
                  onChangeText={(text) => setSubscriptionForm({...subscriptionForm, name: text})}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={subscriptionForm.email}
                  onChangeText={(text) => setSubscriptionForm({...subscriptionForm, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={subscriptionForm.phone}
                  onChangeText={(text) => setSubscriptionForm({...subscriptionForm, phone: text})}
                  keyboardType="phone-pad"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Additional Message</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={subscriptionForm.message}
                  onChangeText={(text) => setSubscriptionForm({...subscriptionForm, message: text})}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#666"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSubscriptionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, loading && styles.buttonDisabled]}
                onPress={handleSubscriptionRequest}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  strategiesSection: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  strategyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  strategyTitleContainer: {
    flex: 1,
  },
  strategyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  strategyType: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  riskyType: {
    backgroundColor: '#FFE5E5',
  },
  guaranteedType: {
    backgroundColor: '#E5F5E5',
  },
  strategyTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  riskyTypeText: {
    color: '#FF3B30',
  },
  guaranteedTypeText: {
    color: '#34C759',
  },
  returnsContainer: {
    alignItems: 'flex-end',
  },
  returnsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  returnsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  strategyDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  strategyDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  strategyLogic: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  logicLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  logicText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  strategyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  investButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  investButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  subscribeButton: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  subscribeButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  balanceText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 4,
  },
  minCapitalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});