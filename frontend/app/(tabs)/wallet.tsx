import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
  trade_details?: any;
}

export default function Wallet() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshUser(),
      fetchTransactions(),
    ]);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
        return 'arrow-up-circle';
      case 'sell':
        return 'arrow-down-circle';
      case 'profit':
        return 'trending-up';
      case 'loss':
        return 'trending-down';
      case 'deposit':
        return 'add-circle';
      case 'coupon_redemption':
        return 'gift';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (type.toLowerCase() === 'profit' || amount > 0) {
      return '#34C759';
    } else if (type.toLowerCase() === 'loss' || amount < 0) {
      return '#FF3B30';
    }
    return '#007AFF';
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: `${getTransactionColor(item.transaction_type, item.amount)}20` }
        ]}>
          <Ionicons
            name={getTransactionIcon(item.transaction_type) as any}
            size={20}
            color={getTransactionColor(item.transaction_type, item.amount)}
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.transactionAmountText,
            { color: getTransactionColor(item.transaction_type, item.amount) }
          ]}>
            {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
          </Text>
          <Text style={styles.transactionType}>
            {item.transaction_type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Overview */}
        <View style={styles.balanceSection}>
          <Text style={styles.sectionTitle}>Balance Overview</Text>
          
          <View style={styles.totalBalanceCard}>
            <View style={styles.totalBalanceHeader}>
              <Ionicons name="wallet" size={24} color="#007AFF" />
              <Text style={styles.totalBalanceLabel}>Total Balance</Text>
            </View>
            <Text style={styles.totalBalanceAmount}>
              {formatCurrency((user?.virtual_balance || 0) + (user?.earnings_balance || 0))}
            </Text>
          </View>

          <View style={styles.balanceBreakdown}>
            <View style={styles.balanceCard}>
              <View style={styles.balanceCardHeader}>
                <Ionicons name="card" size={20} color="#007AFF" />
                <Text style={styles.balanceCardTitle}>Virtual Money</Text>
              </View>
              <Text style={styles.balanceCardAmount}>
                {formatCurrency(user?.virtual_balance || 0)}
              </Text>
              <Text style={styles.balanceCardDescription}>
                Available for new investments
              </Text>
            </View>

            <View style={styles.balanceCard}>
              <View style={styles.balanceCardHeader}>
                <Ionicons name="trophy" size={20} color="#34C759" />
                <Text style={styles.balanceCardTitle}>Earnings</Text>
              </View>
              <Text style={[styles.balanceCardAmount, { color: '#34C759' }]}>
                {formatCurrency(user?.earnings_balance || 0)}
              </Text>
              <Text style={styles.balanceCardDescription}>
                Profits from trading strategies
              </Text>
            </View>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <Text style={styles.sectionCount}>{transactions.length}</Text>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
              <Text style={styles.emptyStateText}>
                Your transaction history will appear here once you start trading
              </Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
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
  balanceSection: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  totalBalanceCard: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  totalBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalBalanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  totalBalanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceBreakdown: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceCardTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  balanceCardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  balanceCardDescription: {
    fontSize: 12,
    color: '#999',
  },
  transactionsSection: {
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
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
});