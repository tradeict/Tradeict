import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import VideoAdButton from '../../components/VideoAdButton';
import axios from 'axios';
import Constants from 'expo-constants';

// Dynamic import for AdMob (mobile-only)
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

if (Platform.OS !== 'web') {
  try {
    const AdMob = require('react-native-google-mobile-ads');
    BannerAd = AdMob.BannerAd;
    BannerAdSize = AdMob.BannerAdSize;
    TestIds = AdMob.TestIds;
  } catch (error) {
    console.log('AdMob not available:', error);
  }
}

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
  virtual_money_type?: string;
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

  const getTransactionIcon = (type: string, moneyType?: string) => {
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
      case 'daily_login':
        return 'calendar';
      case 'video_ad':
        return 'play-circle';
      case 'registration':
        return 'person-add';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (['profit', 'daily_login', 'video_ad', 'registration'].includes(type.toLowerCase()) || amount > 0) {
      return '#34C759';
    } else if (['loss', 'coupon_redemption'].includes(type.toLowerCase()) || amount < 0) {
      return '#FF3B30';
    }
    return '#007AFF';
  };

  const handleVideoAdReward = () => {
    onRefresh(); // Refresh data after earning reward
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: `${getTransactionColor(item.transaction_type, item.amount)}20` }
        ]}>
          <Ionicons
            name={getTransactionIcon(item.transaction_type, item.virtual_money_type) as any}
            size={20}
            color={getTransactionColor(item.transaction_type, item.amount)}
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
          {item.virtual_money_type && (
            <Text style={styles.transactionType}>
              {item.virtual_money_type.replace('_', ' ').toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.transactionAmountText,
            { color: getTransactionColor(item.transaction_type, item.amount) }
          ]}>
            {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
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
        {/* Header with Logo */}
        <View style={styles.headerContainer}>
          <Image 
            source={require('../../assets/tradeict-logo-dark.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        {/* Balance Overview */}
        <View style={styles.balanceSection}>
          <Text style={styles.sectionTitle}>Balance Overview</Text>
          
          <View style={styles.totalBalanceCard}>
            <View style={styles.totalBalanceHeader}>
              <Ionicons name="wallet" size={24} color="#007AFF" />
              <Text style={styles.totalBalanceLabel}>Total Portfolio</Text>
            </View>
            <Text style={styles.totalBalanceAmount}>
              {formatCurrency(user?.total_balance || 0)}
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
                <Text style={styles.balanceCardTitle}>Trading Earnings</Text>
              </View>
              <Text style={[styles.balanceCardAmount, { color: '#34C759' }]}>
                {formatCurrency(user?.earnings_balance || 0)}
              </Text>
              <Text style={styles.balanceCardDescription}>
                Available for coupons
              </Text>
            </View>
          </View>

          <View style={styles.balanceBreakdown}>
            <View style={styles.balanceCard}>
              <View style={styles.balanceCardHeader}>
                <Ionicons name="gift" size={20} color="#FF9500" />
                <Text style={styles.balanceCardTitle}>Task Rewards</Text>
              </View>
              <Text style={[styles.balanceCardAmount, { color: '#FF9500' }]}>
                {formatCurrency(user?.task_balance || 0)}
              </Text>
              <Text style={styles.balanceCardDescription}>
                From daily login & ads
              </Text>
            </View>

            <View style={styles.balanceCard}>
              <View style={styles.balanceCardHeader}>
                <Ionicons name="bar-chart" size={20} color="#FF3B30" />
                <Text style={styles.balanceCardTitle}>Investment</Text>
              </View>
              <Text style={[styles.balanceCardAmount, { color: '#FF3B30' }]}>
                {formatCurrency(user?.total_investment || 0)}
              </Text>
              <Text style={styles.balanceCardDescription}>
                Currently invested
              </Text>
            </View>
          </View>
        </View>

        {/* Earn More Section */}
        <View style={styles.earnMoreSection}>
          <Text style={styles.sectionTitle}>Earn More Virtual Money</Text>
          <VideoAdButton 
            style={styles.videoAdButton}
            onRewardEarned={handleVideoAdReward}
          />
        </View>

        {/* Banner Ad */}
        {Platform.OS !== 'web' && BannerAd && (
          <View style={styles.adContainer}>
            <BannerAd
              unitId={TestIds?.BANNER || 'ca-app-pub-3940256099942544/6300978111'}
              size={BannerAdSize?.FULL_BANNER || 'FULL_BANNER'}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
              onAdLoaded={() => {
                console.log('Banner ad loaded');
              }}
              onAdFailedToLoad={(error) => {
                console.error('Banner ad failed to load:', error);
              }}
            />
          </View>
        )}

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
  headerContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  balanceSection: {
    paddingTop: 8,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceBreakdown: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  balanceCardAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  balanceCardDescription: {
    fontSize: 10,
    color: '#999',
  },
  earnMoreSection: {
    paddingBottom: 24,
  },
  videoAdButton: {
    marginTop: 8,
  },
  adContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
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
});